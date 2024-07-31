import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { User } from "../database";
import { Logger } from "../logger";
import { AuthenticateRequestParameters } from "../services/authentication";

const logger: Logger = new Logger({
  name: "BeatmapCommentsHandler",
});

interface BeatmapCommentParameters extends AuthenticateRequestParameters {
  a: string;
  b?: string;
  s?: string;
  r?: string;
  target?: string;
  f?: string;
  comment?: string;
  starttime?: string;
}

interface PostBeatmapCommentParameters {
  target: string;
  f: string;
  b?: string;
  s?: string;
  r?: string;
  comment: string;
  starttime: string;
}

interface BeatmapCommentSongParameters {
  s: string;
}

interface BeatmapCommentMapParameters {
  b: string;
}

interface BeatmapCommentReplayParameters {
  r: string;
}

async function getBeatmapCommentResponse(
  request: FastifyRequest<{ Querystring: BeatmapCommentParameters }>,
  user: User
): Promise<string | null> {
  return null;
}

async function postBeatmapCommentResponse(
  request: FastifyRequest<{ Querystring: BeatmapCommentParameters }>,
  user: User
): Promise<string | null> {
  const query = request.query as PostBeatmapCommentParameters;
  const scoreService = request.requestContext.get("scoreService")!;

  const comment = query.comment;
  const commentTime = parseInt(query.starttime);
  if (comment.length === 0 || isNaN(commentTime)) {
    return null;
  }

  const cleanedComment = comment
    .replace("\r", "")
    .replace("\t", "")
    .replace("\n", "")
    .slice(0, 128);

  let whoCommented = "normal";
  // TODO: who check for bat and subscriber

  const whatTarget = query.target.trim().toLowerCase();
  let _query = request.query as
    | BeatmapCommentSongParameters
    | BeatmapCommentMapParameters
    | BeatmapCommentReplayParameters;

  switch (whatTarget) {
    case "song":
      _query = request.query as BeatmapCommentSongParameters;
      const beatmapSetId = parseInt(_query.s);

      var column = "beatmapset_id";
      var value = beatmapSetId;

      break;
    case "map":
      _query = request.query as BeatmapCommentMapParameters;
      const beatmapId = parseInt(_query.b);

      var column = "beatmap_id";
      var value = beatmapId;

      break;
    case "replay":
      _query = request.query as BeatmapCommentReplayParameters;
      const replayId = parseInt(_query.r);

      var column = "replay_id";
      var value = replayId;

      const isScoreOwner = await scoreService.verifyScoreOwnership(
        replayId,
        user.id
      );
      if (isScoreOwner) {
        whoCommented = "player";
      }

      break;
    default:
      logger.error("Unreachable target", {
        target: whatTarget,
      });
      break;
  }

  return null;
}

export const getBeatmapComments = async (
  request: FastifyRequest<{ Querystring: BeatmapCommentParameters }>,
  reply: FastifyReply
) => {
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

  const action = request.query.a.trim().toLowerCase();

  if (action === "get") {
    return getBeatmapCommentResponse(request, user);
  } else if (action === "post") {
    return postBeatmapCommentResponse(request, user);
  }

  console.log(`Unreachable action: ${action}`);
  return;
};
