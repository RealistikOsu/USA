import { FastifyReply, FastifyRequest } from "fastify";
import { usernameToUsernameSafe } from "../adapters/user";
import { AuthenticationService } from "../services/authentication";
import { UserRepository } from "../resources/user";
import { Beatmap, User } from "../database";
import { HttpStatusCode } from "axios";
import { ServiceError } from "../services/_common";
import { formatLeaderboardBeatmap, hasLeaderboard } from "../adapters/beatmap";
import { relaxTypeFromMods } from "../adapters/osu";
import { RIPPLE_UPDATE_AVAILABLE, RIPPLE_UNSUBMITTED } from "../adapters/beatmap";
import { Logger } from "../logger";
import { FetchLeaderboardParameters } from "../services/leaderboard";
import { formatLeaderboardScore } from "../adapters/leaderboards";

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

async function authenticateUser(
    query: BeatmapLeaderboardParameters,
    authenticationService: AuthenticationService,
    userRepository: UserRepository
): Promise<User | null> {
    if (query.us === undefined || query.ha === undefined) {
        return null;
    }

    const authResult = await authenticationService.canAuthenticateUser(
        query.us,
        query.ha,
    )

    if (!authResult) {
        return null;
    }
    return await userRepository.findByUsernameSafe(usernameToUsernameSafe(query.us));
}

export const beatmapLeaderboard = async (request: FastifyRequest<{ Querystring: BeatmapLeaderboardParameters }>, reply: FastifyReply) => {
    const authenticationService = request.requestContext.get('authenticationService')!;
    const userRepository = request.requestContext.get('userRepository')!;
    const beatmapService = request.requestContext.get('beatmapService')!;
    const userRelationshipRepository = request.requestContext.get('userRelationshipRepository')!;
    const leaderboardService = request.requestContext.get('leaderboardService')!;

    const authenticatedUser = await authenticateUser(request.query, authenticationService, userRepository);
    if (!authenticatedUser) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const fileName = decodeURI(request.query.f);
    const mods = parseInt(request.query.mods);
    const mode = parseInt(request.query.m);
    const relaxType = relaxTypeFromMods(mods);
    const leaderboardType = parseInt(request.query.v);

    const beatmapResult = await beatmapService.findByBeatmapMd5(
        request.query.c,
        {
            beatmapSetId: parseInt(request.query.i),
            fileName,
        },
    );

    if (beatmapResult === ServiceError.BEATMAP_UNSUBMITTED) {
        return `${RIPPLE_UNSUBMITTED}|false`;
    } else if (beatmapResult === ServiceError.BEATMAP_UPDATE_REQUIRED) {
        return `${RIPPLE_UPDATE_AVAILABLE}|false`;
    }

    if (typeof beatmapResult === "string") {
        logger.warn("Unhandled beatmap ServiceError", {
            error: beatmapResult,
        })
        return `${RIPPLE_UNSUBMITTED}|false`;
    }

    const beatmap = beatmapResult as Beatmap;

    if (!hasLeaderboard(beatmap)) {
        return `${beatmap.ranked}|false`;
    }

    const responseLines: string[] = [];

    if (request.query.s === "1") {
        responseLines.push(formatLeaderboardBeatmap(beatmap, 0, beatmap.rating));
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
            const userRelationships = await userRelationshipRepository.fetchManyByUserId(authenticatedUser.id);

            params.userIdsFilter = userRelationships
                .map(relationship => relationship.user2)
                .concat([authenticatedUser.id]);
        }

        if (leaderboardType == 4) {
            params.countryFilter = authenticatedUser.country;
        }

        const leaderboard = await leaderboardService.fetchByBeatmapMd5(params);

        responseLines.push(formatLeaderboardBeatmap(beatmap, leaderboard.scoreCount, beatmap.rating));

        if (leaderboard.personalBest !== null) {
            responseLines.push(formatLeaderboardScore(relaxType, leaderboard.personalBest));
        } else {
            responseLines.push("");
        }

        for (const score of leaderboard.scores) {
            responseLines.push(formatLeaderboardScore(relaxType, score));
        }
    }

    return responseLines.join('\n');
}
