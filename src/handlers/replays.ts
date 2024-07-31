import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

interface ReplayScoreIdRequest {
  c: string;
}

export const getRawReplay = async (
  request: FastifyRequest<{ Querystring: ReplayScoreIdRequest }>,
  reply: FastifyReply
) => {
  const replayService = request.requestContext.get("replayService")!;

  const replayResponse = await replayService.serveRawReplay(
    parseInt(request.query.c)
  );

  if (typeof replayResponse === "string") {
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

  const replayResponse = await replayService.serveFullReplay(
    parseInt(request.params.scoreId)
  );

  if (typeof replayResponse === "string") {
    reply.code(HttpStatusCode.NotFound).send();
    return;
  }

  return replayResponse.rawBody;
};
