import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticateRequestParameters } from '../services/authentication';
import { HttpStatusCode } from "axios";

export const getUserFriends = async (request: FastifyRequest<{ Querystring: AuthenticateRequestParameters }>, response: FastifyReply) => {
    const authenticationService = request.requestContext.get('authenticationService')!;
    const userRepository = request.requestContext.get("userRepository")!;
    const userRelationshipService = request.requestContext.get("userRelationshipService")!;

    const user = await authenticationService.authenticateUser(request.query, userRepository);
    if (!user) {
        response.code(HttpStatusCode.Unauthorized);
        response.send();
        return;
    }

    const userFriends = await userRelationshipService.getOwnFriendsList(user.id);
    return userFriends.join("\n");
}
