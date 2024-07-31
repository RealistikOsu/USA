import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { AuthenticateRequestParameters } from "../services/authentication";

export const getUserFriends = async (
  request: FastifyRequest<{ Querystring: AuthenticateRequestParameters }>,
  response: FastifyReply
) => {
  const authenticationService = request.requestContext.get(
    "authenticationService"
  )!;
  const userRelationshipService = request.requestContext.get(
    "userRelationshipService"
  )!;

  const user = await authenticationService.authenticateUserFromQuery(
    request.query
  );
  if (!user) {
    response.code(HttpStatusCode.Unauthorized);
    response.send();
    return;
  }

  const userFriends = await userRelationshipService.getOwnFriendsList(user.id);
  return userFriends.join("\n");
};
