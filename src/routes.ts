import { FastifyInstance } from "fastify";
import { getSeasonalBackgrounds } from "./handlers/seasonal_backgrounds";

export const createRoutes = (server: FastifyInstance) => {
    server.get("/web/osu-getseasonal.php", getSeasonalBackgrounds);
}
