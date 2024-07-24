import { FastifyInstance } from "fastify";
import { getSeasonalBackgrounds } from "./handlers/seasonal_backgrounds";
import { osuDirectSearch } from "./handlers/osu_direct";

export const createRoutes = (server: FastifyInstance) => {
    server.get("/web/osu-getseasonal.php", getSeasonalBackgrounds);
    server.get("/web/osu-search.php", osuDirectSearch);
}
