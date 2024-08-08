import { HttpStatusCode } from "axios"
import { FastifyReply, FastifyRequest } from "fastify"

export const getHealth = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.code(HttpStatusCode.Ok);
    reply.send();
}