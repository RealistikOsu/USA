import { Redis } from "ioredis";

import { sendBanchoMessage } from "../adapters/bancho";
import {
    createOsuBeatmapEmbed,
    createOsuUserEmbed,
    formatRelaxType,
    RelaxType,
} from "../adapters/osu";
import { Beatmap, Score, User } from "../database";
import { FirstPlaceRepository } from "../resources/first_place";

const ANNOUNCE_CHANNEL = "#announce";

export class FirstPlaceService {
    constructor(
        private firstPlaceRepository: FirstPlaceRepository,
        private redis: Redis
    ) {}

    // TODO: transaction
    async setNewFirstPlace(
        score: Score,
        user: User,
        beatmap: Beatmap,
        relaxType: RelaxType
    ) {
        await this.firstPlaceRepository.delete(
            score.beatmap_md5,
            score.play_mode,
            relaxType
        );

        await this.firstPlaceRepository.create({
            score_id: score.id,
            user_id: score.userid,
            score: score.score,
            max_combo: score.max_combo,
            full_combo: score.full_combo,
            mods: score.mods,
            "300_count": score["300_count"],
            "100_count": score["100_count"],
            "50_count": score["50_count"],
            cgekis_count: score.gekis_count,
            ckatus_count: score.katus_count,
            miss_count: score.misses_count,
            timestamp: score.time,
            mode: score.play_mode,
            completed: score.completed,
            accuracy: score.accuracy,
            pp: score.pp,
            play_time: score.playtime,
            beatmap_md5: score.beatmap_md5,
            relax: relaxType,
        });

        const announceMessage = `${formatRelaxType(relaxType)} User ${createOsuUserEmbed(user)} has submitted a #1 place on ${createOsuBeatmapEmbed(beatmap)} (${score.pp.toFixed(2)})`;
        await sendBanchoMessage(ANNOUNCE_CHANNEL, announceMessage, this.redis);
    }
}
