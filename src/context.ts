import { FastifyInstance } from 'fastify';
import fastifyRequestContext from '@fastify/request-context';
import mysql from 'mysql2/promise';
import { SeasonalBackgroundRepository } from './resources/seasonal_background';
import { BeatmapService } from './services/beatmap';
import { BeatmapRepository } from './resources/beatmap';
import { API as OsuApi } from 'osu-api-v2-js';

declare module '@fastify/request-context' {
    interface RequestContextData {
        _mysqlConnection: mysql.Connection;
        _osuApi: OsuApi;
        _beatmapRepository: BeatmapRepository;
        seasonalBackgroundRepository: SeasonalBackgroundRepository;
        beatmapService: BeatmapService;
    }
}

async function connectDatabase() {
    return mysql.createPool({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });
}

export const registerContext = async (server: FastifyInstance) => {
    server.register(fastifyRequestContext);
    const database = await connectDatabase();

    server.addHook('onRequest', async (request, reply) => {
        const connection = await database.getConnection();
        await connection.beginTransaction();

        const osuApi = await OsuApi.createAsync({
            id: parseInt(process.env.OSU_API_V2_CLIENT_ID),
            secret: process.env.OSU_API_V2_CLIENT_SECRET
        });

        const seasonalBackgroundRepository = new SeasonalBackgroundRepository(connection);

        const beatmapRepository = new BeatmapRepository(connection);
        const beatmapService = new BeatmapService(beatmapRepository, osuApi);

        request.requestContext.set('_mysqlConnection', connection);
        request.requestContext.set('_osuApi', osuApi);
        request.requestContext.set('_beatmapRepository', beatmapRepository);
        request.requestContext.set('seasonalBackgroundRepository', seasonalBackgroundRepository);
        request.requestContext.set('beatmapService', beatmapService);
    });

    server.addHook('onResponse', async (request, reply) => {
        const connection = request.requestContext.get('_mysqlConnection') as mysql.Connection;

        await connection.commit();
        connection.destroy();
    });

    server.addHook('onError', async (request, reply, error) => {
        const connection = request.requestContext.get('_mysqlConnection') as mysql.Connection;

        await connection.rollback();
        connection.destroy();
    });
}
