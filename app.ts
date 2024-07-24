import fastify from "fastify"
import mysql from "mysql2/promise";
import { createRoutes } from "./routes/routes";
import { registerContext } from "./context";

export const createApp = async () => {
    const server = fastify();

    registerContext(server);
    createRoutes(server);

    return server;
}
