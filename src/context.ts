import { FastifyInstance } from 'fastify';
import fastifyRequestContext from '@fastify/request-context';
import mysql from 'mysql2/promise';
import { SeasonalBackgroundRepository } from './resources/seasonal_bgs';

declare module '@fastify/request-context' {
    interface RequestContextData {
        _mysqlConnection: mysql.Connection;
        seasonalBackgroundRepository: SeasonalBackgroundRepository;
    }
}

async function connectDatabase() {
    return await mysql.createPool({
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

        request.requestContext.set('_mysqlConnection', connection);
        request.requestContext.set('seasonalBackgroundRepository', new SeasonalBackgroundRepository(connection));
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
