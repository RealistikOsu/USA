import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { osuApiStatusFromDirectStatus } from "../adapters/beatmap";
import {
    BeatmapSearchParameters,
    getCheesegullBeatmapset,
    searchCheesegullBeatmapsets,
} from "../adapters/cheesegull";
import {
    osuDirectBeatmapsetCardFromCheesegullBeatmapset,
    osuDirectBeatmapsetFromCheesegullBeatmapset,
} from "../adapters/osu_direct";
import { Beatmap } from "../database";
import { Logger } from "../logger";

interface AuthenticateParameters {
    u: string;
    h: string;
}

interface OsuDirectSearchParameters extends AuthenticateParameters {
    r: string;
    q: string;
    m: string;
    p: string;
}

const DEFAULT_MODE = -1;
const DEFAULT_RANKED_STATUS = 4;
const DEFAULT_QUERIES = ["Newest", "Top Rated", "Most Played"];

const logger: Logger = new Logger({
    name: "OsuDirectHandler",
});

export const osuDirectSearch = async (
    request: FastifyRequest<{ Querystring: OsuDirectSearchParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;

    const authenticatedUser =
        await authenticationService.authenticateUserFromQuery(request.query);
    if (authenticatedUser === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const query = decodeURI(request.query.q);
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

    const beatmapsets = await searchCheesegullBeatmapsets(params);
    const beatmapsetCount = beatmapsets.length;

    const osuDirectBeatmapsets = beatmapsets.map((beatmapset) =>
        osuDirectBeatmapsetFromCheesegullBeatmapset(beatmapset)
    );
    const osuDirectBeatmapsetCount =
        beatmapsetCount >= 100 ? 101 : beatmapsetCount;

    logger.info("Handled osu!direct search", {
        query: query,
        userId: authenticatedUser.id,
        page: pageNumber,
    })

    return `${osuDirectBeatmapsetCount}\n${osuDirectBeatmapsets.join("\n")}`;
};

interface OsuDirectBeatmapCardParameters extends AuthenticateParameters {
    s?: string;
    b?: string;
}

export const osuDirectBeatmapsetCard = async (
    request: FastifyRequest<{ Querystring: OsuDirectBeatmapCardParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const beatmapService = request.requestContext.get("beatmapService")!;

    const authenticatedUser =
        await authenticationService.authenticateUserFromQuery(request.query);
    if (authenticatedUser === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    let beatmapsetId =
        request.query.s !== undefined ? parseInt(request.query.s) : null;
    const beatmapId =
        request.query.b !== undefined ? parseInt(request.query.b) : null;

    if (beatmapId != null && beatmapsetId === null) {
        const beatmapResult = await beatmapService.findByBeatmapId(beatmapId);

        if (typeof beatmapResult === "string") {
            logger.warn("Failed to find beatmap", {
                error: beatmapResult,
            });

            reply.code(HttpStatusCode.NotFound);
            reply.send();
            return;
        }

        const beatmap = beatmapResult as Beatmap;

        beatmapsetId = beatmap?.beatmapset_id ?? null;
    }

    if (beatmapsetId === null) {
        reply.code(HttpStatusCode.NotFound);
        reply.send();
        return;
    }

    logger.info("Handled osu!direct beatmap card", {
        userId: authenticatedUser.id,
        beatmapId: beatmapId,
        beatmapsetId: beatmapsetId,
    })

    const beatmapset = await getCheesegullBeatmapset(beatmapsetId);
    return osuDirectBeatmapsetCardFromCheesegullBeatmapset(beatmapset);
};

interface DownloadBeatmapsetParameters {
    beatmapsetId: string;
}

export const downloadBeatmapset = async (
    request: FastifyRequest<{ Params: DownloadBeatmapsetParameters }>,
    reply: FastifyReply
) => {
    reply.redirect(
        `${process.env.BEATMAP_DOWNLOAD_MIRROR_BASE_URL}/d/${request.params.beatmapsetId}`,
        HttpStatusCode.MovedPermanently
    );
};
