import fastifyMultipart from "@fastify/multipart";
import { HttpStatusCode } from "axios";
import fastify from "fastify";

import { registerContext } from "./context";
import { Logger } from "./logger";
import { createRoutes } from "./routes";

export const createApp = async () => {
    const logger: Logger = new Logger();
    const server = fastify();

    server.setErrorHandler((error, request, reply) => {
        logger.error("Received error", { error });

        reply.status(HttpStatusCode.InternalServerError);
        reply.send();
    });

    server.register(fastifyMultipart);

    await registerContext(server);
    createRoutes(server);

    return server;
};
