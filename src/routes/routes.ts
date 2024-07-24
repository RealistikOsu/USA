import { FastifyInstance } from "fastify";
import { getSeasonals } from "../handlers/seasonals";

export const createRoutes = (server: FastifyInstance) => {
    server.get("/web/osu-getseasonal.php", getSeasonals);
}