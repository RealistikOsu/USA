import cryptian from "cryptian";
import { FastifyRequest } from "fastify";

import { notifyApiOfNewScore } from "../adapters/api";
import { beatmapAwardsPerformance, hasLeaderboard } from "../adapters/beatmap";
import { getCurrentUnixTimestamp } from "../adapters/datetime";
import { calculateAccuracy, OsuMode, relaxTypeFromMods } from "../adapters/osu";
import { calculatePerformance } from "../adapters/performance";
import { calculateScoreStatusForUser, ScoreStatus } from "../adapters/score";
import { assertNotNull } from "../asserts";
import { Beatmap } from "../database";
import { ScoreWithRank } from "../resources/score";
import { UpdateUserStats, UserStats } from "../services/user_stats";

interface FormData {
    fields: ScoreSubmissionFormFields;
    files: ScoreSubmissionFormFiles;
}

interface ScoreSubmissionFormFiles {
    i: Buffer;
    score: Buffer;
}

interface ScoreSubmissionFormFields {
    x: string;
    ft: string;
    fs: string;
    bmk: string;
    sbk: string;
    iv: string;
    c1: string;
    st: string;
    pass: string;
    osuver: string;
    s: string;
    score: string;
}

interface ScoreSubmissionHeaders {
    token?: string;
    "user-agent": string;
}

async function getFormData(request: FastifyRequest): Promise<FormData> {
    const parts = request.parts();

    const fields: any = {};
    const files: any = {};

    for await (const part of parts) {
        if (part.type === "file") {
            const fileData = await part.toBuffer();
            files[part.fieldname as keyof ScoreSubmissionFormFiles] = fileData;
        } else {
            fields[part.fieldname as keyof ScoreSubmissionFormFields] =
                part.value;
        }
    }

    return {
        fields,
        files,
    };
}

interface ScoreData {
    beatmapMd5: string;
    username: string;
    scoreChecksum: string;
    count300s: number;
    count100s: number;
    count50s: number;
    countGekis: number;
    countKatus: number;
    countMisses: number;
    score: number;
    maxCombo: number;
    fullCombo: boolean;
    rank: string;
    mods: number;
    passed: boolean;
    mode: OsuMode;
    // some unknown number here, maybe timestamp?
    osuVersion: string;
}

interface ScoreSubmissionData {
    scoreData: ScoreData;
    clientHash: string;
}

const VERIFIED_BADGE_ID = parseInt(process.env.SERVER_VERIFIED_BADGE_ID);

function decryptScoreSubmissionData(formData: FormData): ScoreSubmissionData {
    const key = `osu!-scoreburgr---------${formData.fields.osuver}`;

    const rijndael = new cryptian.algorithm.Rijndael256();
    rijndael.setKey(Buffer.from(key, "ascii"));

    const cbcDecipher = new cryptian.mode.cbc.Decipher(
        rijndael,
        Buffer.from(formData.fields.iv, "base64")
    );

    const scoreData = cbcDecipher.transform(
        Buffer.from(formData.fields.score, "base64")
    );
    const clientHash = cbcDecipher.transform(
        Buffer.from(formData.fields.s, "base64")
    );

    const scoreDataArray = scoreData.toString().split(":");

    return {
        scoreData: {
            beatmapMd5: scoreDataArray[0],
            username: scoreDataArray[1].trimEnd(), // trim supporter "pace"
            scoreChecksum: scoreDataArray[2],
            count300s: parseInt(scoreDataArray[3]),
            count100s: parseInt(scoreDataArray[4]),
            count50s: parseInt(scoreDataArray[5]),
            countGekis: parseInt(scoreDataArray[6]),
            countKatus: parseInt(scoreDataArray[7]),
            countMisses: parseInt(scoreDataArray[8]),
            score: parseInt(scoreDataArray[9]),
            maxCombo: parseInt(scoreDataArray[10]),
            fullCombo: scoreDataArray[11] === "True",
            rank: scoreDataArray[12],
            mods: parseInt(scoreDataArray[13]),
            passed: scoreDataArray[14] === "True",
            mode: parseInt(scoreDataArray[15]) as OsuMode,
            // skipped value here
            osuVersion: scoreDataArray[17],
            // skipped value here
        },
        clientHash: clientHash.toString(),
    };
}

export const submitScore = async (
    request: FastifyRequest<{ Headers: ScoreSubmissionHeaders }>
) => {
    const beatmapService = request.requestContext.get("beatmapService")!;
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const userService = request.requestContext.get("userService")!;
    const scoreService = request.requestContext.get("scoreService")!;
    const beatmapPlaycountRepository = request.requestContext.get(
        "beatmapPlaycountRepository"
    )!;
    const ppCapService = request.requestContext.get("ppCapService")!;
    const userBadgeRepository = request.requestContext.get(
        "userBadgeRepository"
    )!;
    const whitelistRepository = request.requestContext.get(
        "whitelistRepository"
    )!;
    const userStatsService = request.requestContext.get("userStatsService")!;
    const replayService = request.requestContext.get("replayService")!;
    const firstPlaceService = request.requestContext.get("firstPlaceService")!;
    const redis = request.requestContext.get("redis")!;

    const formData = await getFormData(request);
    const { scoreData, clientHash } = decryptScoreSubmissionData(formData);

    const authenticatedUser = await authenticationService.authenticateUser(
        scoreData.username,
        formData.fields.pass
    );
    if (!authenticatedUser) {
        return emptyErrorResponse();
    }

    const beatmapResult = await beatmapService.findByBeatmapMd5(
        scoreData.beatmapMd5
    );
    if (typeof beatmapResult === "string") {
        return beatmapErrorResponse();
    }

    const beatmap = beatmapResult as Beatmap;

    const accuracy = calculateAccuracy(
        scoreData.count300s,
        scoreData.count100s,
        scoreData.count50s,
        scoreData.countGekis,
        scoreData.countKatus,
        scoreData.countMisses,
        scoreData.mode
    );

    // TODO: do all of this in a transaction

    await userService.updateLatestActivityToCurrentTime(authenticatedUser.id);

    // TODO: lock all logic below by score checksum (requires adding checksum to scores)
    // TODO: check if score with current checksum exists (^)

    const relaxType = relaxTypeFromMods(scoreData.mods);

    const sameScoreExists = await scoreService.identicalScoreExists(
        authenticatedUser.id,
        beatmap.beatmap_md5,
        scoreData.score,
        scoreData.mode,
        scoreData.mods,
        relaxType,
    );
    if (sameScoreExists) {
        return shutUpErrorResponse();
    }

    if (!areModsRanked(scoreData.mods)) {
        return shutUpErrorResponse();
    }

    if (areModsConflicting(scoreData.mods)) {
        await userService.restrict(
            authenticatedUser.id,
            "Score submitted with conflicting mods.",
            "The score was submitted with impossible mod combinations, therefore must have been tampering with the client."
        );
        return shutUpErrorResponse();
    }

    if (!isUserAgentValid(request.headers["user-agent"])) {
        await userService.restrict(
            authenticatedUser.id,
            "Score submitted with invalid user-agent.",
            `Received user-agent: "${request.headers["user-agent"]}", instead of "osu!". This indicates that the score submission was not made by the official osu! client.`
        );
    }

    // TODO: do passed objects
    const performanceResult = await calculatePerformance(
        beatmap.beatmap_id,
        scoreData.mode,
        scoreData.mods,
        scoreData.maxCombo,
        accuracy,
        scoreData.countMisses
    );

    const exited = formData.fields.x == "1";
    const failed = !scoreData.passed && !exited;

    const previousBest =
        await scoreService.findBestByUserIdAndBeatmapMd5WithRankAndUsername(
            authenticatedUser.id,
            beatmap.beatmap_md5,
            scoreData.mode,
            relaxType
        );

    const scoreStatus = calculateScoreStatusForUser(
        scoreData.score,
        performanceResult.pp,
        failed,
        exited,
        previousBest?.score,
        previousBest?.pp
    );

    const timeElapsed = scoreData.passed
        ? parseInt(formData.fields.st)
        : parseInt(formData.fields.ft);

    const createdScore = await scoreService.create(
        {
            beatmap_md5: beatmap.beatmap_md5,
            userid: authenticatedUser.id,
            score: scoreData.score,
            max_combo: scoreData.maxCombo,
            full_combo: scoreData.fullCombo,
            mods: scoreData.mods,
            "300_count": scoreData.count300s,
            "100_count": scoreData.count100s,
            "50_count": scoreData.count50s,
            katus_count: scoreData.countKatus,
            gekis_count: scoreData.countGekis,
            misses_count: scoreData.countMisses,
            time: getCurrentUnixTimestamp(),
            play_mode: scoreData.mode,
            completed: scoreStatus,
            accuracy: accuracy,
            pp: performanceResult.pp,
            playtime: timeElapsed,
        },
        relaxType
    );

    const scoreRank = await scoreService.findScoreRank(
        createdScore.id,
        authenticatedUser.id,
        beatmap.beatmap_md5,
        createdScore.play_mode,
        relaxType
    );

    const score = {
        rank: scoreRank,
        ...createdScore,
    };

    if (scoreData.passed) {
        await replayService.saveRawReplay(score.id, formData.files.score);
    }

    if (scoreStatus === ScoreStatus.BEST && previousBest !== null) {
        await scoreService.updateScoreStatusToSubmitted(
            previousBest.id,
            relaxType
        );
    }

    await beatmapPlaycountRepository.createOrIncrement(
        authenticatedUser.id,
        beatmap.beatmap_id,
        scoreData.mode
    );

    const oldStats = await userStatsService.findByUserIdAndMode(
        authenticatedUser.id,
        score.play_mode,
        relaxType
    );
    assertNotNull(oldStats);

    if (scoreData.passed && beatmapAwardsPerformance(beatmap)) {
        const verified = await userBadgeRepository.hasBadge(
            authenticatedUser.id,
            VERIFIED_BADGE_ID
        );
        const whitelisted = await whitelistRepository.hasWhitelist(
            authenticatedUser.id
        );
        const exceedsPpCap = await ppCapService.ppExceedsPpCap(
            score.pp,
            score.play_mode,
            relaxType,
            score.mods
        );

        if (exceedsPpCap && !verified && !whitelisted) {
            await userService.restrict(authenticatedUser.id, "todo", "todo");
        }
    }

    // TODO: probably move all of this stat update stuff into ScoreService? UserStatsService? IDK which is more appropriate

    let totalHits = score["300_count"] + score["100_count"];

    if (score.play_mode != 2) {
        // include 50s for non-catch
        totalHits += score["50_count"];
    }

    if (score.play_mode === 1 || score.play_mode === 3) {
        // include gekis/katus for taiko & mania
        totalHits += score.gekis_count + score.katus_count;
    }

    const statsToUpdate: UpdateUserStats = {
        playcount: oldStats.playcount + 1,
        playtime: oldStats.playtime + timeElapsed / 1000,
        total_score: oldStats.total_score + score.score,
        total_hits: oldStats.total_hits + totalHits,
    };

    if (scoreData.passed && hasLeaderboard(beatmap)) {
        if (score.max_combo > oldStats.max_combo) {
            statsToUpdate.max_combo = score.max_combo;
        }

        const scoresToConsider = await scoreService.findTop1000ScoresByUserId(
            authenticatedUser.id,
            score.play_mode,
            relaxType
        );

        const top100Scores = scoresToConsider.slice(0, 100);

        let totalPp = 0;
        let totalAcc = 0;
        let lastIndex = 0;

        for (let index = 0; index < top100Scores.length; index++) {
            const score = top100Scores[index];

            totalPp += score.pp * Math.pow(0.95, index);
            totalAcc += score.accuracy * Math.pow(0.95, index);

            lastIndex = index;
        }

        statsToUpdate.avg_accuracy =
            (totalAcc * (100.0 / (20 * (1 - Math.pow(0.95, lastIndex + 1))))) /
            100;
        statsToUpdate.pp =
            totalPp + 416.6667 * (1 - Math.pow(0.995, scoresToConsider.length));

        // TODO: apparently this is supposed to apply to loved too? (osu! does)
        if (
            score.completed === ScoreStatus.BEST &&
            beatmapAwardsPerformance(beatmap)
        ) {
            let rankedScore = score.score;
            if (previousBest !== null) {
                rankedScore -= previousBest.score;
            }

            statsToUpdate.ranked_score = oldStats.ranked_score + rankedScore;
        }
    }

    const newStats = await userStatsService.updateByUserIdAndMode(
        authenticatedUser.id,
        score.play_mode,
        relaxType,
        statsToUpdate
    );

    const userRestricted = await userService.userIsRestricted(
        authenticatedUser.id
    );
    if (
        score.rank === 1 &&
        score.completed === ScoreStatus.BEST &&
        hasLeaderboard(beatmap) &&
        !userRestricted
    ) {
        await firstPlaceService.setNewFirstPlace(
            score,
            authenticatedUser,
            beatmap,
            relaxType
        );
    }

    // TODO: handlers should probably not be aware of lower level connections (i.e database, redis)
    await notifyApiOfNewScore(score.id, redis);

    return makeFinalChart(
        authenticatedUser.id,
        beatmap,
        score,
        newStats,
        oldStats,
        previousBest
    ).join("|");
};

// Scorev2, autoplay and target practice.
const UNRANKED_MODS = (1 << 29) | (1 << 11) | (1 << 23);

function areModsRanked(mods: number): boolean {
    return (mods & UNRANKED_MODS) === 0;
}

// DTHT
const ILLEGAL_RATE_MOD_COMBINATIONS = (1 << 6) | (1 << 8);

// EZHR
const ILLEGAL_SIZE_MOD_COMBINATIONS = (1 << 4) | (1 << 1);

// DTNC
const ENFORCED_RATE_MOD_COMBINATIONS = (1 << 6) | (1 << 9);

function areModsConflicting(mods: number): boolean {
    const enforcedRateMods = mods & ENFORCED_RATE_MOD_COMBINATIONS;
    return (
        (mods & ILLEGAL_RATE_MOD_COMBINATIONS) ===
            ILLEGAL_RATE_MOD_COMBINATIONS ||
        (mods & ILLEGAL_SIZE_MOD_COMBINATIONS) ===
            ILLEGAL_SIZE_MOD_COMBINATIONS ||
        (enforcedRateMods > 0 &&
            enforcedRateMods < ENFORCED_RATE_MOD_COMBINATIONS &&
            enforcedRateMods !== (1 << 6)
        )
    );
}

function beatmapErrorResponse() {
    return "error: beatmap";
}

function emptyErrorResponse() {
    return "";
}

function shutUpErrorResponse() {
    return "error: no";
}

function isUserAgentValid(userAgent: string): boolean {
    return userAgent === "osu!";
}

type ChartDeltaName =
    | "rank"
    | "rankedScore"
    | "totalScore"
    | "maxCombo"
    | "accuracy"
    | "pp";

function chartDeltaRow(
    name: ChartDeltaName,
    newValue: string,
    oldValue: string | null = null
): string {
    return `${name}Before:${oldValue || ""}|${name}After:${newValue}`;
}

function makeScoreDeltaChart(
    newScore: ScoreWithRank,
    oldScore: ScoreWithRank | null
): string[] {
    const chart: string[] = [];

    const chartEntry = (
        name: ChartDeltaName,
        newValue: string,
        oldValue: string | null = null
    ) => {
        chart.push(chartDeltaRow(name, newValue, oldValue));
    };

    if (oldScore) {
        chartEntry("rank", newScore.rank.toString(), newScore.rank.toString());
        chartEntry(
            "rankedScore",
            newScore.score.toString(),
            oldScore.score.toString()
        );
        chartEntry(
            "totalScore",
            newScore.score.toString(),
            oldScore.score.toString()
        );
        chartEntry(
            "maxCombo",
            newScore.max_combo.toString(),
            oldScore.max_combo.toString()
        );
        chartEntry(
            "accuracy",
            newScore.accuracy.toFixed(2),
            oldScore.accuracy.toFixed(2)
        );
        chartEntry("pp", newScore.pp.toFixed(2), oldScore.pp.toFixed(2));
    } else {
        chartEntry("rank", newScore.rank.toString());
        chartEntry("rankedScore", newScore.score.toString());
        chartEntry("totalScore", newScore.score.toString());
        chartEntry("maxCombo", newScore.max_combo.toString());
        chartEntry("accuracy", newScore.accuracy.toFixed(2));
        chartEntry("pp", newScore.pp.toFixed(2));
    }

    return chart;
}

function makeStatsDeltaChart(
    newStats: UserStats,
    oldStats: UserStats
): string[] {
    const chart: string[] = [];

    const chartEntry = (
        name: ChartDeltaName,
        newValue: string,
        oldValue: string | null = null
    ) => {
        chart.push(chartDeltaRow(name, newValue, oldValue));
    };

    chartEntry("rank", newStats.rank.toString(), oldStats.rank.toString());

    chartEntry(
        "rankedScore",
        newStats.ranked_score.toString(),
        oldStats.ranked_score.toString()
    );
    chartEntry(
        "totalScore",
        newStats.total_score.toString(),
        oldStats.total_score.toString()
    );
    chartEntry(
        "maxCombo",
        newStats.max_combo.toString(),
        oldStats.max_combo.toString()
    );
    chartEntry(
        "accuracy",
        newStats.avg_accuracy.toFixed(2),
        oldStats.avg_accuracy.toFixed(2)
    );
    chartEntry("pp", newStats.pp.toFixed(2), oldStats.pp.toFixed(2));

    return chart;
}

function makeFinalChart(
    userId: number,
    beatmap: Beatmap,
    newScore: ScoreWithRank,
    newStats: UserStats,
    oldStats: UserStats,
    oldScore: ScoreWithRank | null
): string[] {
    const beatmapRankingChart = makeScoreDeltaChart(newScore, oldScore);
    const overallRankingChart = makeStatsDeltaChart(newStats, oldStats);

    return [
        `beatmapId:${beatmap.beatmap_id}`,
        `beatmapSetId:${beatmap.beatmapset_id}`,
        `beatmapPlaycount:${beatmap.playcount}`,
        `beatmapPasscount:${beatmap.passcount}`,
        `approvedDate:${new Date(beatmap.latest_update * 1000).toISOString()}`,
        "\n",
        "chartId:beatmap",
        `chartUrl:${process.env.SERVER_BASE_URL}/beatmaps/${beatmap.beatmap_id}`,
        "chartName:Beatmap Ranking",
        ...beatmapRankingChart,
        `onlineScoreId:${newScore.id}`,
        "\n",
        "chartId:overall",
        `chartUrl:${process.env.SERVER_BASE_URL}/users/${userId}`,
        "chartName:Overall Ranking",
        ...overallRankingChart,
        "achievements-new:", // TODO: achievements
    ];
}
