import crypto from "crypto";

import { writeOsuString } from "../adapters/binary";
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
    ) {}

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

        // "You have more important things to do like stats" - Nah ill count bytes
        // 39 + extra bytes for string lengths, predicting those will be longer than
        // the reallocation speed probably
        const buffer = Buffer.alloc(100 + replay.rawBody.length);

        // Writing the replay headers
        buffer.writeUInt8(score.play_mode);
        buffer.writeInt32LE(20191106);
        writeOsuString(score.beatmap_md5, buffer);
        writeOsuString(user.username, buffer);
        writeOsuString(replayMd5, buffer);
        buffer.writeInt16LE(score["300_count"]);
        buffer.writeInt16LE(score["100_count"]);
        buffer.writeInt16LE(score["50_count"]);
        buffer.writeInt16LE(score.gekis_count);
        buffer.writeInt16LE(score.katus_count);
        buffer.writeInt16LE(score.misses_count);
        buffer.writeInt32LE(score.score);
        buffer.writeInt16LE(score.max_combo);
        buffer.writeUInt8(score.full_combo ? 1 : 0);
        buffer.writeInt32LE(score.mods);
        buffer.writeUInt8(0);
        buffer.writeInt32LE(score.time);
        buffer.writeInt32LE(replay.rawBody.length);
        replay.rawBody.copy(buffer);
        buffer.writeInt32LE(score.id);

        return {
            rawBody: buffer,
            score: score,
            user: user,
            beatmap: beatmap,
        };
    }
}

function createBeatmapMd5BaseString(score: Score, user: User): string {
    return `${score["100_count"] + score["300_count"]}${score["50_count"]}${score.gekis_count}${score.katus_count}${score.misses_count}${score.beatmap_md5}${score.max_combo}${score.full_combo ? "true" : "false"}${user.username}${score.score}0${score.mods}true`;
}
