import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticateRequestParameters } from '../services/authentication';
import { HttpStatusCode } from 'axios';

interface BeatmapRatingParameters extends AuthenticateRequestParameters {
    c: string;
    rating?: string;
}

export const getBeatmapRatings = async (request: FastifyRequest<{ Querystring: BeatmapRatingParameters }>, reply: FastifyReply) => {
    const beatmapRatingService = request.requestContext.get("beatmapRatingService")!;
    const userRepository = request.requestContext.get("userRepository")!;
    const authenticationService = request.requestContext.get("authenticationService")!;

    const user = await authenticationService.authenticateUser(request.query, userRepository);
    if (user === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const castResult = await beatmapRatingService.castRating(
        user.id,
        request.query.c,
        request.query.rating !== undefined ? parseInt(request.query.rating) : null
    );

    if (castResult.ownRating !== null) {
        return createAlreadyVotedResponse(castResult.rating);
    }

    if (request.query.rating === undefined) {
        return createReadyToVoteResponse();
    } else {
        return createVoteCastResponse(castResult.rating);
    }
}

function createAlreadyVotedResponse(rating: number): string {
    return `alreadyvoted\n${rating}`
}

function createVoteCastResponse(rating: number): string {
    return `alreadyvoting\n${rating}`
}

function createReadyToVoteResponse(): string {
    return "ok";
}
