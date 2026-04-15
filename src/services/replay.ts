import crypto from "crypto";

import { BinaryWriter } from "../adapters/binary";
import { approximateRelaxTypeFromScoreId } from "../adapters/osu";
import { assertNotNull } from "../asserts";
import { Beatmap, Score, User } from "../database";
import { ReplayRepository, ReplayWithoutHeaders } from "../resources/replay";
import { ScoreRepository } from "../resources/score";
import { UserRepository } from "../resources/user";
import { ErrorOr, ServiceError } from "./_common";
import { BeatmapService } from "./beatmap";
import { UserStatsService } from "./user_stats";

export interface ReplayWithHeaders {
    rawBody: Buffer;
    score: Score;
    user: User;
    beatmap: Beatmap;
}

export class ReplayService {
    constructor(
        private replayRepository: ReplayRepository,
        private scoreRepository: ScoreRepository,
        private userRepository: UserRepository,
        private userStatsService: UserStatsService,
        private beatmapService: BeatmapService
    ) { }

    async saveRawReplay(scoreId: number, replay: Buffer) {
        this.replayRepository.createFromScoreId(scoreId, {
            rawBody: replay,
        });
    }

    async serveRawReplay(
        scoreId: number
    ): Promise<ErrorOr<ReplayWithoutHeaders>> {
        const replay = await this.replayRepository.getFromScoreId(scoreId);

        if (!replay) {
            return ServiceError.REPLAY_NOT_FOUND;
        }

        const relaxType = approximateRelaxTypeFromScoreId(scoreId);
        const score = await this.scoreRepository.fromScoreId(
            scoreId,
            relaxType
        );
        if (!score) {
            return ServiceError.SCORE_NOT_FOUND;
        }

        const userStats = await this.userStatsService.findByUserIdAndMode(
            score.userid,
            score.play_mode,
            relaxType
        );
        assertNotNull(userStats);

        await this.userStatsService.updateByUserIdAndMode(
            score.userid,
            score.play_mode,
            relaxType,
            {
                replays_watched: userStats.replays_watched + 1,
            }
        );

        return replay;
    }

    async serveCookedReplay(
        scoreId: number
    ): Promise<ErrorOr<ReplayWithHeaders>> {
        const replay = await this.replayRepository.getFromScoreId(scoreId);
        if (!replay) {
            return ServiceError.REPLAY_NOT_FOUND;
        }

        const relaxType = approximateRelaxTypeFromScoreId(scoreId);

        const score = await this.scoreRepository.fromScoreId(
            scoreId,
            relaxType
        );
        if (!score) {
            return ServiceError.SCORE_NOT_FOUND;
        }

        const user = await this.userRepository.findById(score.userid);
        if (!user) {
            return ServiceError.USER_NOT_FOUND;
        }

        const beatmap = await this.beatmapService.findByBeatmapMd5(
            score.beatmap_md5
        );
        if (typeof beatmap === "string") {
            return beatmap;
        }

        const replayMd5 = crypto
            .createHash("md5")
            .update(createBeatmapMd5BaseString(score, user))
            .digest("hex");

        const ticks = BigInt(score.time) * BigInt(10000000) + BigInt("621355968000000000");

        const writer = new BinaryWriter(128 + replay.rawBody.length);
        writer
            .writeU8(score.play_mode)
            .writeI32LE(20260412)
            .writeOsuString(score.beatmap_md5)
            .writeOsuString(user.username)
            .writeOsuString(replayMd5)
            .writeI16LE(score["300_count"])
            .writeI16LE(score["100_count"])
            .writeI16LE(score["50_count"])
            .writeI16LE(score.gekis_count)
            .writeI16LE(score.katus_count)
            .writeI16LE(score.misses_count)
            .writeI32LE(score.score)
            .writeI16LE(score.max_combo)
            .writeU8(score.full_combo ? 1 : 0)
            .writeI32LE(score.mods)
            .writeU8(0)
            .writeI64LE(ticks)
            .writeI32LE(replay.rawBody.length)
            .writeRaw(replay.rawBody)
            .writeI64LE(BigInt(score.id));

        return {
            rawBody: writer.data,
            score: score,
            user: user,
            beatmap: beatmap,
        };
    }
}

function createBeatmapMd5BaseString(score: Score, user: User): string {
    return `${score["100_count"] + score["300_count"]}${score["50_count"]}${score.gekis_count}${score.katus_count}${score.misses_count}${score.beatmap_md5}${score.max_combo}${score.full_combo ? "true" : "false"}${user.username}${score.score}0${score.mods}true`;
}
