import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";
import { Logger } from "../logger";

interface ReplayScoreIdRequest {
    c: string;
}

const logger = new Logger({
    name: "ReplayHandler"
});

export const getRawReplay = async (
    request: FastifyRequest<{ Querystring: ReplayScoreIdRequest }>,
    reply: FastifyReply
) => {
    const replayService = request.requestContext.get("replayService")!;

    const replayResponse = await replayService.serveRawReplay(
        parseInt(request.query.c)
    );

    if (typeof replayResponse === "string") {
        logger.error("Failed to serve raw replay", {
            error: replayResponse
        });
        reply.code(HttpStatusCode.NotFound).send();
        return;
    }

    return replayResponse.rawBody;
};

interface ReplayScoreIdRequestPath {
    scoreId: string;
}

export const getFullReplay = async (
    request: FastifyRequest<{ Params: ReplayScoreIdRequestPath }>,
    reply: FastifyReply
) => {
    const replayService = request.requestContext.get("replayService")!;

    const replayResponse = await replayService.serveCookedReplay(
        parseInt(request.params.scoreId)
    );

    if (typeof replayResponse === "string") {
        logger.error("Failed to serve full replay", {
            error: replayResponse
        });
        reply.code(HttpStatusCode.NotFound).send();
        return;
    }

    return replayResponse.rawBody;
};
