import { Redis } from "ioredis";

import { redisLeaderboardForMode } from "../adapters/mode";
import { modeSuffixFromMode, OsuMode, RelaxType } from "../adapters/osu";
import { assertNotNull } from "../asserts";
import { UpdateUserStats as UpdateDatabaseUserStats } from "../database";
import { UserStatsRepository } from "../resources/user_stats";
import { UserService } from "./user";

export interface UserStats {
    ranked_score: number;
    playcount: number;
    total_score: number;
    replays_watched: number;
    level: number;
    total_hits: number;
    playtime: number;
    avg_accuracy: number;
    pp: number;
    max_combo: number;
    rank: number;
}

export interface UpdateUserStats {
    ranked_score?: number | undefined;
    playcount?: number | undefined;
    total_score?: number | undefined;
    replays_watched?: number | undefined;
    level?: number | undefined;
    total_hits?: number | undefined;
    playtime?: number | undefined;
    avg_accuracy?: number | undefined;
    pp?: number | undefined;
    max_combo?: number | undefined;
}

export class UserStatsService {
    constructor(
        private userStatsRepository: UserStatsRepository,
        private userService: UserService,
        private redis: Redis
    ) {}

    async findByUserIdAndMode(
        userId: number,
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<UserStats | null> {
        const userStats = await this.userStatsRepository.fromUserId(
            userId,
            relaxType
        );
        if (userStats === null) {
            return null;
        }

        const leaderboardKey = redisLeaderboardForMode(mode, relaxType);
        const redisRank = await this.redis.zrevrank(leaderboardKey, userId);
        const rank = redisRank !== null ? redisRank + 1 : 0;

        const modeSuffix = modeSuffixFromMode(mode);

        return {
            ranked_score: userStats[`ranked_score_${modeSuffix}`],
            playcount: userStats[`playcount_${modeSuffix}`],
            total_score: userStats[`total_score_${modeSuffix}`],
            replays_watched: userStats[`replays_watched_${modeSuffix}`],
            level: userStats[`level_${modeSuffix}`],
            total_hits: userStats[`total_hits_${modeSuffix}`],
            playtime: userStats[`playtime_${modeSuffix}`],
            avg_accuracy: userStats[`avg_accuracy_${modeSuffix}`],
            pp: userStats[`pp_${modeSuffix}`],
            max_combo: userStats[`max_combo_${modeSuffix}`],
            rank,
        };
    }

    async updateByUserIdAndMode(
        userId: number,
        mode: OsuMode,
        relaxType: RelaxType,
        update: UpdateUserStats
    ): Promise<UserStats> {
        const modeSuffix = modeSuffixFromMode(mode);

        const updateUserStats: UpdateDatabaseUserStats = {};
        updateUserStats[`ranked_score_${modeSuffix}`] = update.ranked_score;
        updateUserStats[`playcount_${modeSuffix}`] = update.playcount;
        updateUserStats[`total_score_${modeSuffix}`] = update.total_score;
        updateUserStats[`replays_watched_${modeSuffix}`] =
            update.replays_watched;
        updateUserStats[`playtime_${modeSuffix}`] = update.playtime;
        updateUserStats[`avg_accuracy_${modeSuffix}`] = update.avg_accuracy;
        updateUserStats[`pp_${modeSuffix}`] = update.pp;
        updateUserStats[`max_combo_${modeSuffix}`] = update.max_combo;

        await this.userStatsRepository.updateByUserId(
            userId,
            relaxType,
            updateUserStats
        );

        // if the pp changes and the user is not restricted, update the pp in redis too
        const userRestricted = await this.userService.userIsRestricted(userId);
        if (update.pp !== undefined && !userRestricted) {
            const leaderboardKey = redisLeaderboardForMode(mode, relaxType);
            await this.redis.zadd(leaderboardKey, update.pp, userId.toString());
        }

        const newStats = await this.findByUserIdAndMode(
            userId,
            mode,
            relaxType
        );
        assertNotNull(newStats);

        return newStats;
    }
}
