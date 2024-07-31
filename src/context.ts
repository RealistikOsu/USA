import fastifyRequestContext from "@fastify/request-context";
import { FastifyInstance } from "fastify";
import { Kysely, MysqlDialect } from "kysely";
import mysql from "mysql2";
import { auth } from "osu-api-extended";

import { Database } from "./database";
import { BeatmapRepository } from "./resources/beatmap";
import { BeatmapRatingRepository } from "./resources/beatmap_rating";
import { LastfmFlagRepository } from "./resources/lastfm_flag";
import { ReplayRepository } from "./resources/replay";
import { ScoreRepository } from "./resources/score";
import { SeasonalBackgroundRepository } from "./resources/seasonal_background";
import { UserRepository } from "./resources/user";
import { UserFavouriteRepository } from "./resources/user_favourite";
import { UserRelationshipRepository } from "./resources/user_relationship";
import { UserStatsRepository } from "./resources/user_stats";
import { AuthenticationService } from "./services/authentication";
import { BeatmapService } from "./services/beatmap";
import { BeatmapRatingService } from "./services/beatmap_rating";
import { LastfmFlagService } from "./services/lastfm_flag";
import { LeaderboardService } from "./services/leaderboard";
import { ReplayService } from "./services/replay";
import { ScoreService } from "./services/score";
import { UserFavouriteService } from "./services/user_favourite";
import { UserRelationshipService } from "./services/user_relationship";

declare module "@fastify/request-context" {
    interface RequestContextData {
        _database: Kysely<Database>;
        _beatmapRepository: BeatmapRepository;
        _beatmapRatingRepository: BeatmapRatingRepository;
        _scoreRepository: ScoreRepository;
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

export const registerContext = async (server: FastifyInstance) => {
    server.register(fastifyRequestContext);
    const database = await createDatabase();

    await authenticateOsuApi();

    server.addHook("onRequest", async (request) => {
        const seasonalBackgroundRepository = new SeasonalBackgroundRepository(
            database
        );

        const beatmapRepository = new BeatmapRepository(database);
        const beatmapService = new BeatmapService(beatmapRepository);

        const userRepository = new UserRepository(database);
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

        const replayRepository = new ReplayRepository();
        const replayService = new ReplayService(
            replayRepository,
            scoreRepository,
            userRepository,
            userStatsRepository
        );

        const lastfmFlagRepository = new LastfmFlagRepository(database);
        const lastfmFlagService = new LastfmFlagService(lastfmFlagRepository);

        const userFavouriteRepository = new UserFavouriteRepository(database);
        const userFavouriteService = new UserFavouriteService(
            userFavouriteRepository
        );

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
    });
};
