import { FastifyInstance } from 'fastify';
import fastifyRequestContext from '@fastify/request-context';
import mysql from 'mysql2';
import { SeasonalBackgroundRepository } from './resources/seasonal_background';
import { BeatmapService } from './services/beatmap';
import { BeatmapRepository } from './resources/beatmap';
import { API as OsuApi } from 'osu-api-v2-js';
import { Kysely, MysqlDialect } from 'kysely';
import { Database } from './database';

declare module '@fastify/request-context' {
    interface RequestContextData {
        _database: Kysely<Database>;
        _osuApi: OsuApi;
        _beatmapRepository: BeatmapRepository;
        seasonalBackgroundRepository: SeasonalBackgroundRepository;
        beatmapService: BeatmapService;
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

export const registerContext = async (server: FastifyInstance) => {
    server.register(fastifyRequestContext);
    const database = await createDatabase();

    server.addHook('onRequest', async (request, reply) => {
        const osuApi = await OsuApi.createAsync({
            id: parseInt(process.env.OSU_API_V2_CLIENT_ID),
            secret: process.env.OSU_API_V2_CLIENT_SECRET
        });

        const seasonalBackgroundRepository = new SeasonalBackgroundRepository(database);

        const beatmapRepository = new BeatmapRepository(database);
        const beatmapService = new BeatmapService(beatmapRepository, osuApi);

        request.requestContext.set('_database', database);
        request.requestContext.set('_osuApi', osuApi);
        request.requestContext.set('_beatmapRepository', beatmapRepository);
        request.requestContext.set('seasonalBackgroundRepository', seasonalBackgroundRepository);
        request.requestContext.set('beatmapService', beatmapService);
    });
}
