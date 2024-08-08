import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { AuthenticateRequestParameters } from "../services/authentication";
import { Logger } from "../logger";

const logger: Logger = new Logger({
    name: "UserFavouriteHandler",
});

interface NewUserFavouriteRequestParameters
    extends AuthenticateRequestParameters {
    a: string;
}

export const newUserFavourite = async (
    request: FastifyRequest<{ Querystring: NewUserFavouriteRequestParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const userFavouriteService = request.requestContext.get(
        "userFavouriteService"
    )!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );
    if (user === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    await userFavouriteService.addNewFavourite(
        user.id,
        parseInt(request.query.a)
    );

    logger.info("Added a new map as a favourite!", {
        userId: user.id,
        beatmapsetId: request.query.a,
    })

    // We dont care about the result.
    return createSuccessfulFavouriteResponse();
};

export const getUserFavourites = async (
    request: FastifyRequest<{ Querystring: AuthenticateRequestParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const userFavouriteService = request.requestContext.get(
        "userFavouriteService"
    )!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );
    if (user === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const userFavourites = await userFavouriteService.getFavouriteSets(user.id);

    return userFavourites.join("\n");
};

function createSuccessfulFavouriteResponse(): string {
    return "Added favourite!";
}
