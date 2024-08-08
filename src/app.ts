import fastifyMultipart from "@fastify/multipart";
import fastify from "fastify";

import { registerContext } from "./context";
import { createRoutes } from "./routes";
import { Logger } from "./logger";
import { HttpStatusCode } from "axios";

export const createApp = async () => {
    const logger: Logger = new Logger();
    const server = fastify();

    server.setErrorHandler((error, request, reply) => {
        logger.error("Received error", { error });

        reply.status(HttpStatusCode.InternalServerError);
        reply.send();
    })

    server.register(fastifyMultipart);

    await registerContext(server);
    createRoutes(server);

    return server;
};
