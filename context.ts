import { FastifyInstance } from 'fastify';
import fastifyRequestContext from '@fastify/request-context';
import { Connection } from 'mysql2/promise';
import mysql from 'mysql2/promise';

declare module '@fastify/request-context' {
    interface RequestContextData {
        database: Connection;
    }
}

async function connectDatabase() {
    return await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });
}

export const registerContext = (server: FastifyInstance) => {
    server.register(fastifyRequestContext);

    server.addHook('onRequest', async (request, reply) => {
        request.requestContext.set('database', await connectDatabase());
    });
}
