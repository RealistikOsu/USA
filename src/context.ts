import fastifyRequestContext from "@fastify/request-context";
import { FastifyInstance } from "fastify";
import { Redis } from "ioredis";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import { auth } from "osu-api-extended";

import { Database } from "./database";
import { BanLogRepository } from "./resources/ban_log";
import { BeatmapRepository } from "./resources/beatmap";
import { BeatmapPlaycountRepository } from "./resources/beatmap_playcount";
import { BeatmapRatingRepository } from "./resources/beatmap_rating";
import { FirstPlaceRepository } from "./resources/first_place";
import { LastfmFlagRepository } from "./resources/lastfm_flag";
import { PpLimitRepository } from "./resources/pp_limit";
import { ReplayRepository } from "./resources/replay";
import { ScoreRepository } from "./resources/score";
import { ScreenshotRepository } from "./resources/screenshots";
import { SeasonalBackgroundRepository } from "./resources/seasonal_background";
import { UserRepository } from "./resources/user";
import { UserBadgeRepository } from "./resources/user_badge";
import { UserFavouriteRepository } from "./resources/user_favourite";
import { UserRelationshipRepository } from "./resources/user_relationship";
import { UserStatsRepository } from "./resources/user_stats";
import { WhitelistRepository } from "./resources/whitelist";
import { AuthenticationService } from "./services/authentication";
import { BeatmapService } from "./services/beatmap";
import { BeatmapRatingService } from "./services/beatmap_rating";
import { FirstPlaceService } from "./services/first_place";
import { LastfmFlagService } from "./services/lastfm_flag";
import { LeaderboardService } from "./services/leaderboard";
import { PpCapService } from "./services/pp_cap";
import { ReplayService } from "./services/replay";
import { ScoreService } from "./services/score";
import { ScreenshotService } from "./services/screenshot";
import { UserService } from "./services/user";
import { UserFavouriteService } from "./services/user_favourite";
import { UserRelationshipService } from "./services/user_relationship";
import { UserStatsService } from "./services/user_stats";

declare module "@fastify/request-context" {
    interface RequestContextData {
        _database: Kysely<Database>;
        _beatmapRepository: BeatmapRepository;
        _beatmapRatingRepository: BeatmapRatingRepository;
        _scoreRepository: ScoreRepository;
        _ppLimitRepository: PpLimitRepository;
        _firstPlaceRepository: FirstPlaceRepository;
        seasonalBackgroundRepository: SeasonalBackgroundRepository;
        beatmapService: BeatmapService;
        userRepository: UserRepository;
        authenticationService: AuthenticationService;
        beatmapRatingService: BeatmapRatingService;
        userRelationshipRepository: UserRelationshipRepository;
        leaderboardService: LeaderboardService;
        userRelationshipService: UserRelationshipService;
        replayRepository: ReplayRepository;
        lastfmFlagService: LastfmFlagService;
        replayService: ReplayService;
        userStatsRepository: UserStatsRepository;
        userFavouriteRepository: UserFavouriteRepository;
        userFavouriteService: UserFavouriteService;
        scoreService: ScoreService;
        userService: UserService;
        beatmapPlaycountRepository: BeatmapPlaycountRepository;
        ppCapService: PpCapService;
        userBadgeRepository: UserBadgeRepository;
        whitelistRepository: WhitelistRepository;
        userStatsService: UserStatsService;
        redis: Redis;
        banLogRepository: BanLogRepository;
        screenshotRepository: ScreenshotRepository;
        screenshotService: ScreenshotService;
        firstPlaceService: FirstPlaceService;
    }
}

async function createDatabase() {
    const dialect = new MysqlDialect({
        pool: mysql.createPool({
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT),
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        }),
    });

    return new Kysely<Database>({ dialect });
}

async function authenticateOsuApi() {
    await auth.login(
        parseInt(process.env.OSU_API_V2_CLIENT_ID),
        process.env.OSU_API_V2_CLIENT_SECRET,
        ["public"]
    );
}

function createRedis(): Redis {
    return new Redis(parseInt(process.env.REDIS_PORT), process.env.REDIS_HOST);
}

export const registerContext = async (server: FastifyInstance) => {
    server.register(fastifyRequestContext);
    const database = await createDatabase();
    const redis = createRedis();

    await authenticateOsuApi();

    server.addHook("onRequest", async (request) => {
        const seasonalBackgroundRepository = new SeasonalBackgroundRepository(
            database
        );

        const beatmapRepository = new BeatmapRepository(database);
        const beatmapService = new BeatmapService(beatmapRepository);

        const banLogRepository = new BanLogRepository(database);

        const userRepository = new UserRepository(database);
        const userService = new UserService(
            userRepository,
            banLogRepository,
            redis
        );
        const authenticationService = new AuthenticationService(userRepository);

        const beatmapRatingRepository = new BeatmapRatingRepository(database);
        const beatmapRatingService = new BeatmapRatingService(
            beatmapRatingRepository,
            beatmapRepository
        );

        const userRelationshipRepository = new UserRelationshipRepository(
            database
        );
        const userRelationshipService = new UserRelationshipService(
            userRelationshipRepository
        );

        const scoreRepository = new ScoreRepository(database);
        const scoreService = new ScoreService(scoreRepository);

        const leaderboardService = new LeaderboardService(scoreRepository);

        const userStatsRepository = new UserStatsRepository(database);
        const userStatsService = new UserStatsService(
            userStatsRepository,
            userService,
            redis
        );

        const replayRepository = new ReplayRepository();
        const replayService = new ReplayService(
            replayRepository,
            scoreRepository,
            userRepository,
            userStatsService,
            beatmapService,
        );

        const lastfmFlagRepository = new LastfmFlagRepository(database);
        const lastfmFlagService = new LastfmFlagService(lastfmFlagRepository);

        const userFavouriteRepository = new UserFavouriteRepository(database);
        const userFavouriteService = new UserFavouriteService(
            userFavouriteRepository
        );

        const beatmapPlaycountRepository = new BeatmapPlaycountRepository(
            database
        );

        const ppLimitRepository = new PpLimitRepository(database);
        const ppCapService = new PpCapService(ppLimitRepository);

        const userBadgeRepository = new UserBadgeRepository(database);

        const whitelistRepository = new WhitelistRepository(database);

        const firstPlaceRepository = new FirstPlaceRepository(database);
        const firstPlaceService = new FirstPlaceService(
            firstPlaceRepository,
            redis
        );

        const screenshotRepository = new ScreenshotRepository(redis);
        const screenshotService = new ScreenshotService(screenshotRepository);

        request.requestContext.set("_database", database);
        request.requestContext.set("_beatmapRepository", beatmapRepository);
        request.requestContext.set(
            "_beatmapRatingRepository",
            beatmapRatingRepository
        );
        request.requestContext.set("_scoreRepository", scoreRepository);
        request.requestContext.set("userRepository", userRepository);
        request.requestContext.set(
            "seasonalBackgroundRepository",
            seasonalBackgroundRepository
        );
        request.requestContext.set("beatmapService", beatmapService);
        request.requestContext.set(
            "authenticationService",
            authenticationService
        );
        request.requestContext.set(
            "beatmapRatingService",
            beatmapRatingService
        );
        request.requestContext.set(
            "userRelationshipRepository",
            userRelationshipRepository
        );
        request.requestContext.set("leaderboardService", leaderboardService);
        request.requestContext.set(
            "userRelationshipService",
            userRelationshipService
        );
        request.requestContext.set("replayRepository", replayRepository);
        request.requestContext.set("lastfmFlagService", lastfmFlagService);
        request.requestContext.set("replayService", replayService);
        request.requestContext.set("userStatsRepository", userStatsRepository);
        request.requestContext.set(
            "userFavouriteRepository",
            userFavouriteRepository
        );
        request.requestContext.set(
            "userFavouriteService",
            userFavouriteService
        );
        request.requestContext.set("scoreService", scoreService);
        request.requestContext.set("userService", userService);
        request.requestContext.set(
            "beatmapPlaycountRepository",
            beatmapPlaycountRepository
        );
        request.requestContext.set("_ppLimitRepository", ppLimitRepository);
        request.requestContext.set("ppCapService", ppCapService);
        request.requestContext.set("userBadgeRepository", userBadgeRepository);
        request.requestContext.set("whitelistRepository", whitelistRepository);
        request.requestContext.set("userStatsService", userStatsService);
        request.requestContext.set("redis", redis);
        request.requestContext.set("banLogRepository", banLogRepository);
        request.requestContext.set(
            "_firstPlaceRepository",
            firstPlaceRepository
        );
        request.requestContext.set(
            "screenshotRepository",
            screenshotRepository
        );
        request.requestContext.set("screenshotService", screenshotService);
        request.requestContext.set("firstPlaceService", firstPlaceService);
    });
};
