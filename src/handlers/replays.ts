import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { Beatmap, User } from "../database";
import { Logger } from "../logger";
import { AuthenticateRequestParameters } from "../services/authentication";

interface ReplayScoreIdRequest extends AuthenticateRequestParameters {
    c: string;
}

const logger = new Logger({
    name: "ReplayHandler",
});

export const getRawReplay = async (
    request: FastifyRequest<{ Querystring: ReplayScoreIdRequest }>,
    reply: FastifyReply
) => {
    const replayService = request.requestContext.get("replayService")!;
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;

    const authenticatedUser =
        await authenticationService.authenticateUserFromQuery(request.query);

    if (!authenticatedUser) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const replayResponse = await replayService.serveRawReplay(
        parseInt(request.query.c)
    );

    if (typeof replayResponse === "string") {
        logger.error("Failed to serve raw replay", {
            error: replayResponse,
        });
        reply.code(HttpStatusCode.NotFound).send();
        return;
    }

    logger.info("Served raw replay", {
        replayId: request.query.c,
        userId: authenticatedUser.id,
    });

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
            error: replayResponse,
        });
        reply.code(HttpStatusCode.NotFound).send();
        return;
    }

    logger.info("Served cooked replay", {
        replayId: request.params.scoreId,
    });
    reply.header(
        "Content-Disposition",
        `attachment; filename=${createReplayName(replayResponse.user, replayResponse.beatmap)}`
    );
    return replayResponse.rawBody;
};

function createReplayName(user: User, beatmap: Beatmap): string {
    return `${user.username} - ${beatmap.song_name}.osr`;
}
