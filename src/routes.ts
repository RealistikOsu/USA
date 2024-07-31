import { FastifyInstance } from "fastify";

import { getBanchoConnect } from "./handlers/bancho_connect";
import { getBeatmapRatings } from "./handlers/beatmap_ratings";
import { getLastFM } from "./handlers/lastfm";
import { beatmapLeaderboard } from "./handlers/leaderboards";
import {
    downloadBeatmapset,
    osuDirectBeatmapsetCard,
    osuDirectSearch,
} from "./handlers/osu_direct";
import { getFullReplay, getRawReplay } from "./handlers/replays";
import { submitScore } from "./handlers/score_submission";
import { getSeasonalBackgrounds } from "./handlers/seasonal_backgrounds";
import { getUserFavourites, newUserFavourite } from "./handlers/user_favourite";
import { getUserFriends } from "./handlers/user_relationships";

export const createRoutes = (server: FastifyInstance) => {
    server.get("/web/osu-getseasonal.php", getSeasonalBackgrounds);

    server.get("/web/osu-search.php", osuDirectSearch);
    server.get("/web/osu-search-set.php", osuDirectBeatmapsetCard);
    server.get("/d/:beatmapsetId", downloadBeatmapset);

    server.get("/web/osu-rate.php", getBeatmapRatings);

    server.get("/web/osu-osz2-getscores.php", beatmapLeaderboard);

    server.get("/web/bancho_connect.php", getBanchoConnect);

    server.get("/web/osu-getfriends.php", getUserFriends);

    server.post("/web/osu-submit-modular-selector.php", submitScore);
    server.get("/web/lastfm.php", getLastFM);

    server.get("/web/replays/:scoreId", getFullReplay);
    server.get("/web/osu-getreplay.php", getRawReplay);

    server.get("/web/osu-addfavourite.php", newUserFavourite);
    server.get("/web/osu-getfavourites.php", getUserFavourites);
};
