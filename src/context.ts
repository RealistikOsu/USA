import { FastifyInstance } from 'fastify';
import fastifyRequestContext from '@fastify/request-context';
import mysql from 'mysql2';
import { SeasonalBackgroundRepository } from './resources/seasonal_background';
import { BeatmapService } from './services/beatmap';
import { BeatmapRepository } from './resources/beatmap';
import { BeatmapRatingRepository } from './resources/beatmap_rating';
import { Kysely, MysqlDialect } from 'kysely';
import { Database } from './database';
import { auth } from 'osu-api-extended';
import { UserRepository } from './resources/user';
import { AuthenticationService } from './services/authentication';
import { BeatmapRatingService } from './services/beatmap_rating';
import { UserRelationshipRepository } from './resources/user_relationship';
import { LeaderboardService } from './services/leaderboard';
import { ScoreRepository } from './resources/score';

declare module '@fastify/request-context' {
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
        })
    });

    return new Kysely<Database>({ dialect });
}

async function authenticateOsuApi() {
    await auth.login(
        parseInt(process.env.OSU_API_V2_CLIENT_ID),
        process.env.OSU_API_V2_CLIENT_SECRET, 
        ['public'],
    );
}

export const registerContext = async (server: FastifyInstance) => {
    server.register(fastifyRequestContext);
    const database = await createDatabase();

    await authenticateOsuApi();

    server.addHook('onRequest', async (request, reply) => {
        const seasonalBackgroundRepository = new SeasonalBackgroundRepository(database);

        const beatmapRepository = new BeatmapRepository(database);
        const beatmapService = new BeatmapService(beatmapRepository);

        const userRepository = new UserRepository(database);
        const authenticationService = new AuthenticationService(userRepository);
        
        const beatmapRatingRepository = new BeatmapRatingRepository(database);
        const beatmapRatingService = new BeatmapRatingService(
            beatmapRatingRepository,
            beatmapRepository,
        );

        const userRelationshipRepository = new UserRelationshipRepository(database);

        const scoreRepository = new ScoreRepository(database);
        const leaderboardService = new LeaderboardService(scoreRepository);

        request.requestContext.set('_database', database);
        request.requestContext.set('_beatmapRepository', beatmapRepository);
        request.requestContext.set("_beatmapRatingRepository", beatmapRatingRepository);
        request.requestContext.set('_scoreRepository', scoreRepository);
        request.requestContext.set('userRepository', userRepository);
        request.requestContext.set('seasonalBackgroundRepository', seasonalBackgroundRepository);
        request.requestContext.set('beatmapService', beatmapService);
        request.requestContext.set('authenticationService', authenticationService);
        request.requestContext.set("beatmapRatingService", beatmapRatingService);
        request.requestContext.set('userRelationshipRepository', userRelationshipRepository);
        request.requestContext.set('leaderboardService', leaderboardService);
    });
}
