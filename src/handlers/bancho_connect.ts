import { FastifyRequest } from "fastify";

import { AuthenticateRequestParameters } from "../services/authentication";

export const getBanchoConnect = async (
    request: FastifyRequest<{ Querystring: AuthenticateRequestParameters }>
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );
    if (user === null) {
        return createUnauthorisedResponse();
    }

    return user.country;
};

function createUnauthorisedResponse(): string {
    return "error: pass";
}
