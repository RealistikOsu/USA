import { FastifyReply, FastifyRequest } from "fastify";

import { calculatePerformance, calculatePerformances, PerformanceRequest } from "../adapters/performance";
import { Beatmap } from "../database";

interface PPQuery {
    b: string; // beatmap_id
    m?: string; // mods
    g?: string; // mode
    a?: string; // accuracy
    max_combo?: string; // combo
}

const COMMON_PP_PERCENTAGES = [100.0, 99.0, 98.0, 95.0];

export const getPP = async (
    request: FastifyRequest<{ Querystring: PPQuery }>,
    reply: FastifyReply
) => {
    const beatmapService = request.requestContext.get("beatmapService")!;

    const beatmapId = parseInt(request.query.b);
    if (isNaN(beatmapId)) {
        return reply.status(400).send({
            message: "Invalid/non-existent beatmap id.",
        });
    }

    const mods = parseInt(request.query.m || "0");
    const mode = parseInt(request.query.g || "0");
    const acc = request.query.a ? parseFloat(request.query.a) : undefined;
    const combo = request.query.max_combo ? parseInt(request.query.max_combo) : undefined;

    const beatmapResult = await beatmapService.findByBeatmapId(beatmapId);
    if (typeof beatmapResult === "string" || beatmapResult === null) {
        return reply.status(400).send({
            message: "Invalid/non-existent beatmap id.",
        });
    }

    const beatmap = beatmapResult as Beatmap;
    const finalCombo = combo || beatmap.max_combo;

    let ppResult: number[];
    let starRating = 0;

    if (acc === undefined) {
        const ppRequests: PerformanceRequest[] = COMMON_PP_PERCENTAGES.map((accuracy) => ({
            beatmap_id: beatmap.beatmap_id,
            mode: mode,
            mods: mods,
            max_combo: finalCombo,
            accuracy: accuracy,
            miss_count: 0,
        }));

        const results = await calculatePerformances(ppRequests);
        ppResult = results.map((r) => r.pp);
        // We can just use the stars from the first result (100% acc)
        starRating = results[0]?.stars || 0;
    } else {
        const result = await calculatePerformance(
            beatmap.beatmap_id,
            mode,
            mods,
            finalCombo,
            acc,
            0 // miss count
        );
        ppResult = [result.pp];
        starRating = result.stars;
    }

    return {
        status: 200,
        message: "ok",
        song_name: beatmap.song_name,
        pp: ppResult,
        length: beatmap.hit_length,
        stars: starRating,
        ar: beatmap.ar,
        bpm: beatmap.bpm,
    };
};
