import fastify from "fastify";
import { createRoutes } from "./routes";
import { registerContext } from "./context";

export const createApp = async () => {
    const server = fastify();

    await registerContext(server);
    createRoutes(server);

    return server;
}
