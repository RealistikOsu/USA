import crypto from "crypto";

import { writeOsuString } from "../adapters/binary";
import { approximateRelaxTypeFromScoreId } from "../adapters/osu";
import { Score, User } from "../database";
import { ReplayRepository, ReplayWithoutHeaders } from "../resources/replay";
import { ScoreRepository } from "../resources/score";
import { UserRepository } from "../resources/user";
import { UserStatsRepository } from "../resources/user_stats";
import { ErrorOr, ServiceError } from "./_common";

export interface ReplayWithHeaders {
    rawBody: Buffer;
}

export class ReplayService {
    constructor(
        private replayRepository: ReplayRepository,
        private scoreRepository: ScoreRepository,
        private userRepository: UserRepository,
        private userStatsRepository: UserStatsRepository
    ) {}

    async saveRawReplay(scoreId: number, replay: Buffer) {
        return this.replayRepository.createFromScoreId(scoreId, {
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

        await this.userStatsRepository.incrementReplayViews(
            score.userid,
            score.play_mode
        );

        return replay;
    }
    /**
     * BinaryWriter()
        .write_u8_le(score.mode.as_vn)
        .write_i32_le(OSU_VERSION)
        .write_osu_string(score.map_md5)
        .write_osu_string(username)
        .write_osu_string(replay_md5)
        .write_i16_le(score.n300)
        .write_i16_le(score.n100)
        .write_i16_le(score.n50)
        .write_i16_le(score.ngeki)
        .write_i16_le(score.nkatu)
        .write_i16_le(score.nmiss)
        .write_i32_le(score.score)
        .write_i16_le(score.max_combo)
        .write_u8_le(score.full_combo)
        .write_i32_le(score.mods.value)
        .write_u8_le(0)
        .write_i64_le(app.utils.ts_to_utc_ticks(score.time))
        .write_i32_le(len(replay_bytes))
        .write_raw(replay_bytes)
        .write_i64_le(score.id)
     */

    async serveFullReplay(
        scoreId: number
    ): Promise<ErrorOr<ReplayWithHeaders>> {
        const replay = await this.replayRepository.getFromScoreId(scoreId);

        if (!replay) {
            return ServiceError.REPLAY_NOT_FOUND;
        }

        const score = await this.scoreRepository.fromScoreId(
            scoreId,
            approximateRelaxTypeFromScoreId(scoreId)
        );
        if (!score) {
            return ServiceError.SCORE_NOT_FOUND;
        }

        const user = await this.userRepository.findById(score.userid);
        if (!user) {
            return ServiceError.USER_NOT_FOUND;
        }

        await this.userStatsRepository.incrementReplayViews(
            score.userid,
            score.play_mode
        );

        const replayMd5 = crypto
            .createHash("md5")
            .update(createBeatmapMd5BaseString(score, user))
            .digest("hex");

        // Writing the replay headers
        const buffer = Buffer.alloc(0);
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
        };
    }
}

function createBeatmapMd5BaseString(score: Score, user: User): string {
    return `${score["100_count"] + score["300_count"]}${score["50_count"]}${score.gekis_count}${score.katus_count}${score.misses_count}${score.beatmap_md5}${score.max_combo}${score.full_combo ? "true" : "false"}${user.username}${score.score}0${score.mods}true`;
}
