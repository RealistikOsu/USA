import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import {
    formatLeaderboardBeatmap,
    hasLeaderboard,
    RIPPLE_UNSUBMITTED,
    RIPPLE_UPDATE_AVAILABLE,
} from "../adapters/beatmap";
import { formatLeaderboardScore } from "../adapters/leaderboards";
import { OsuMode, relaxTypeFromMods } from "../adapters/osu";
import { Beatmap } from "../database";
import { Logger } from "../logger";
import { ServiceError } from "../services/_common";
import { FetchLeaderboardParameters } from "../services/leaderboard";

const logger: Logger = new Logger({
    name: "LeaderboardHandler",
});

interface BeatmapLeaderboardParameters {
    us: string;
    ha: string;
    s: string;
    vv: string;
    v: string;
    c: string;
    f: string;
    m: string;
    i: string;
    mods: string;
    h: string;
    a: string;
}

export const beatmapLeaderboard = async (
    request: FastifyRequest<{ Querystring: BeatmapLeaderboardParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const beatmapService = request.requestContext.get("beatmapService")!;
    const userRelationshipRepository = request.requestContext.get(
        "userRelationshipRepository"
    )!;
    const leaderboardService =
        request.requestContext.get("leaderboardService")!;

    const authenticatedUser =
        await authenticationService.authenticateUserFromQuery(request.query);
    if (!authenticatedUser) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const fileName = decodeURI(request.query.f);
    const mods = parseInt(request.query.mods);
    const mode = parseInt(request.query.m) as OsuMode;
    const relaxType = relaxTypeFromMods(mods);
    const leaderboardType = parseInt(request.query.v);

    const beatmapResult = await beatmapService.findByBeatmapMd5(
        request.query.c,
        {
            beatmapSetId: parseInt(request.query.i),
            fileName,
        }
    );

    if (beatmapResult === ServiceError.BEATMAP_UNSUBMITTED) {
        return `${RIPPLE_UNSUBMITTED}|false`;
    } else if (beatmapResult === ServiceError.BEATMAP_UPDATE_REQUIRED) {
        return `${RIPPLE_UPDATE_AVAILABLE}|false`;
    }

    if (typeof beatmapResult === "string") {
        logger.warn("Unhandled beatmap ServiceError", {
            error: beatmapResult,
        });
        return `${RIPPLE_UNSUBMITTED}|false`;
    }

    const beatmap = beatmapResult as Beatmap;

    if (!hasLeaderboard(beatmap)) {
        return `${beatmap.ranked}|false`;
    }

    const responseLines: string[] = [];

    if (request.query.s === "1") {
        responseLines.push(
            formatLeaderboardBeatmap(beatmap, 0, beatmap.rating)
        );
    } else {
        const params: FetchLeaderboardParameters = {
            beatmapMd5: beatmap.beatmap_md5,
            playMode: mode,
            requesteeUserId: authenticatedUser.id,
            relaxType: relaxType,
            leaderboardSize: (authenticatedUser.privileges & 4) > 0 ? 200 : 100,
        };

        if (leaderboardType === 2) {
            params.modsFilter = mods;
        }

        if (leaderboardType == 3) {
            const userRelationships =
                await userRelationshipRepository.fetchManyByUserId(
                    authenticatedUser.id
                );

            params.userIdsFilter = userRelationships
                .map((relationship) => relationship.user2)
                .concat([authenticatedUser.id]);
        }

        if (leaderboardType == 4) {
            params.countryFilter = authenticatedUser.country;
        }

        const leaderboard = await leaderboardService.fetchByBeatmapMd5(params);

        responseLines.push(
            formatLeaderboardBeatmap(
                beatmap,
                leaderboard.scoreCount,
                beatmap.rating
            )
        );

        if (leaderboard.personalBest !== null) {
            responseLines.push(
                formatLeaderboardScore(relaxType, leaderboard.personalBest)
            );
        } else {
            responseLines.push("");
        }

        for (const score of leaderboard.scores) {
            responseLines.push(formatLeaderboardScore(relaxType, score));
        }
    }

    return responseLines.join("\n");
};
