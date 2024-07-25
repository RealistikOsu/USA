import { FastifyInstance } from "fastify";
import { getSeasonalBackgrounds } from "./handlers/seasonal_backgrounds";
import { downloadBeatmapset, osuDirectBeatmapsetCard, osuDirectSearch } from "./handlers/osu_direct";
import { getBeatmapRatings } from "./handlers/beatmap_ratings";
import { beatmapLeaderboard } from "./handlers/leaderboards";

export const createRoutes = (server: FastifyInstance) => {
    server.get("/web/osu-getseasonal.php", getSeasonalBackgrounds);

    server.get("/web/osu-search.php", osuDirectSearch);
    server.get("/web/osu-search-set.php", osuDirectBeatmapsetCard);
    server.get("/d/:beatmapsetId", downloadBeatmapset);

    server.get("/web/osu-rate.php", getBeatmapRatings);

    server.get("/web/osu-osz2-getscores.php", beatmapLeaderboard);
}
