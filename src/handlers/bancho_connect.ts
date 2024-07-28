import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticateRequestParameters } from '../services/authentication';

export const getBanchoConnect = async (request: FastifyRequest<{ Querystring: AuthenticateRequestParameters}>, reply: FastifyReply) => {
    const userRepository = request.requestContext.get("userRepository")!;
    const authenticationService = request.requestContext.get("authenticationService")!;

    const user = await authenticationService.authenticateUser(request.query, userRepository);
    if (user === null) {
        return createUnauthorisedResponse();
    }

    return user.country;
}

function createUnauthorisedResponse(): string { 
    return "error: pass\n"
};