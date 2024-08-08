import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { AuthenticateRequestParameters } from "../services/authentication";

interface BeatmapRatingParameters extends AuthenticateRequestParameters {
    c: string;
    v?: string;
}

export const getBeatmapRatings = async (
    request: FastifyRequest<{ Querystring: BeatmapRatingParameters }>,
    reply: FastifyReply
) => {
    const beatmapRatingService = request.requestContext.get(
        "beatmapRatingService"
    )!;
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );
    if (user === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const castResult = await beatmapRatingService.castRating(
        user.id,
        request.query.c,
        request.query.v !== undefined
            ? parseInt(request.query.v)
            : null
    );

    if (castResult.ownRating !== null) {
        return createAlreadyVotedResponse(castResult.rating);
    }

    if (request.query.v === undefined) {
        return createReadyToVoteResponse();
    } else {
        return createVoteCastResponse(castResult.rating);
    }
};

function createAlreadyVotedResponse(rating: number): string {
    return `alreadyvoted\n${rating}`;
}

function createVoteCastResponse(rating: number): string {
    return `alreadyvoting\n${rating}`;
}

function createReadyToVoteResponse(): string {
    return "ok";
}
