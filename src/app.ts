import fastifyMultipart from "@fastify/multipart";
import fastify from "fastify";

import { registerContext } from "./context";
import { createRoutes } from "./routes";

export const createApp = async () => {
    const server = fastify();

    server.register(fastifyMultipart);

    await registerContext(server);
    createRoutes(server);

    return server;
};
