import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRepository } from '../resources/user';
import { AuthenticationService } from '../services/authentication';
import { User } from '../database';
import { usernameToUsernameSafe } from '../adapters/user';
import { HttpStatusCode } from 'axios';

interface AuthenticateParameters {
    u: string;
    h: string;
}

interface BeatmapRatingParameters extends AuthenticateParameters {
    c: string;
    rating?: string;
}

async function authenticateUser(
    query: AuthenticateParameters,
    authenticationService: AuthenticationService,
    userRepository: UserRepository
): Promise<User | null> {
    if (query.u === undefined || query.h === undefined) {
        return null;
    }

    const authResult = await authenticationService.canAuthenticateUser(
        query.u,
        query.h,
    )

    if (!authResult) {
        return null;
    }
    return await userRepository.findByUsernameSafe(usernameToUsernameSafe(query.u));
}

export const getBeatmapRatings = async (request: FastifyRequest<{ Querystring: BeatmapRatingParameters }>, reply: FastifyReply) => {
    const beatmapRatingService = request.requestContext.get("beatmapRatingService")!;
    const userRepository = request.requestContext.get("userRepository")!;
    const authenticationService = request.requestContext.get("authenticationService")!;

    const user = await authenticateUser(request.query, authenticationService, userRepository);
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
