import { FastifyReply, FastifyRequest } from "fastify";
import { searchBeatmapsets, BeatmapSearchParameters } from "../adapters/cheesegull";
import { osuApiStatusFromDirectStatus } from "../adapters/beatmap";
import { osuDirectBeatmapsetFromCheesegullBeatmapset } from "../adapters/osu_direct";
import { HttpStatusCode } from "axios";

interface OsuDirectSearchParameters {
    u: string;
    h: string;
    r: string;
    q: string;
    m: string;
    p: string;
}

const DEFAULT_MODE = -1;
const DEFAULT_RANKED_STATUS = 4;
const DEFAULT_QUERIES = [
    'Newest',
    'Top Rated',
    'Most Played',
]

export const osuDirectSearch = async (request: FastifyRequest<{ Querystring: OsuDirectSearchParameters }>, reply: FastifyReply) => {
    const authenticationService = request.requestContext.get('authenticationService')!;

    // TODO: move this into a hook or something
    const authenticatedUser = await authenticationService.canAuthenticateUser(request.query.u, request.query.h);
    if (!authenticatedUser) {
        reply.status(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }
    
    const query = request.query.q;
    const rankedStatus = parseInt(request.query.r);
    const mode = parseInt(request.query.m);
    const pageNumber = parseInt(request.query.p);

    const params: BeatmapSearchParameters = {
        amount: 101,
        offset: pageNumber,
    };

    if (mode !== DEFAULT_MODE) {
        params.mode = mode;
    }

    if (rankedStatus !== DEFAULT_RANKED_STATUS) {
        params.status = osuApiStatusFromDirectStatus(rankedStatus);
    }

    if (!DEFAULT_QUERIES.includes(query)) {
        params.query = query;
    }

    const beatmapsets = await searchBeatmapsets(params);
    const beatmapsetCount = beatmapsets.length;

    const osuDirectBeatmapsets = beatmapsets.map(beatmapset => osuDirectBeatmapsetFromCheesegullBeatmapset(beatmapset));
    const osuDirectBeatmapsetCount = beatmapsetCount >= 100 ? 101 : beatmapsetCount;

    return `${osuDirectBeatmapsetCount}\n${osuDirectBeatmapsets.join("\n")}`;
}