import cryptian from "cryptian";
import { FastifyRequest } from "fastify";

import { Beatmap } from "../database";
import { calculateAccuracy, OsuMode, relaxTypeFromMods } from "../adapters/osu";
import { calculatePerformance } from "../adapters/performance";
import { calculateScoreStatusForUser } from "../adapters/score";
import { getCurrentUnixTimestamp } from "../adapters/datetime";

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
    const beatmapPlaycountRepository = request.requestContext.get("beatmapPlaycountRepository")!;

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
        scoreData.mode,
    );
    
    // TODO: do all of this in a transaction

    await userService.updateLatestActivityToCurrentTime(authenticatedUser.id);

    // TODO: check mods are ranked
    // TODO: check user-agent
    // TODO: check "conflicting" mods
    // TODO: lock all logic below by score checksum (requires adding checksum to scores)
    // TODO: check if score with current checksum exists (^)

    // TODO: do passed objects
    const performanceResult = await calculatePerformance(
        beatmap.beatmap_id,
        scoreData.mode,
        scoreData.mods,
        scoreData.maxCombo,
        accuracy,
        scoreData.countMisses,
    );

    const relaxType = relaxTypeFromMods(scoreData.mods);
    const exited = formData.fields.x == '1';
    const failed = !scoreData.passed && !exited;

    const previousBest = await scoreService.findBestByUserIdAndBeatmapMd5(authenticatedUser.id, beatmap.beatmap_md5, scoreData.mode, relaxType);
    const scoreStatus = calculateScoreStatusForUser(scoreData.score, performanceResult.pp, failed, exited, previousBest?.score, previousBest?.pp);

    const timeElapsed = scoreData.passed ? parseInt(formData.fields.st) : parseInt(formData.fields.ft);

    const score = await scoreService.create(
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
        relaxType,
    );

    if (previousBest !== null) {
        await scoreService.updateScoreStatusToSubmitted(previousBest.id, relaxType);
    }

    await beatmapPlaycountRepository.createOrIncrement(authenticatedUser.id, beatmap.beatmap_id, scoreData.mode);
};

function beatmapErrorResponse() {
    return "error: beatmap";
}

function emptyErrorResponse() {
    return "";
}
