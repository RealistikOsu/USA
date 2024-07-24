import { osuApiBeatmapToRippleBeatmap } from "../adapters/beatmap";
import { Beatmap, BeatmapRepository } from "../resources/beatmap";
import { API as OsuApi } from "osu-api-v2-js";

export class BeatmapService {
    constructor(
        private beatmapRepository: BeatmapRepository,
        private osuApi: OsuApi) { }

    async findByBeatmapId(beatmapId: number): Promise<Beatmap | null> {
        let beatmap = await this.beatmapRepository.findByBeatmapId(beatmapId);

        if (beatmap === null) {
            beatmap = await this.getBeatmapFromOsuApi(beatmapId);

            if (beatmap !== null) {
                beatmap = await this.beatmapRepository.create(
                    beatmap.beatmap_id,
                    beatmap.beatmapset_id,
                    beatmap.beatmap_md5,
                    beatmap.song_name,
                    beatmap.ar,
                    beatmap.od,
                    beatmap.mode,
                    beatmap.rating,
                    beatmap.difficulty_std,
                    beatmap.difficulty_taiko,
                    beatmap.difficulty_ctb,
                    beatmap.difficulty_mania,
                    beatmap.max_combo,
                    beatmap.hit_length,
                    beatmap.bpm,
                    beatmap.playcount,
                    beatmap.passcount,
                    beatmap.ranked,
                    beatmap.latest_update,
                    beatmap.ranked_status_freezed,
                    beatmap.pp_100,
                    beatmap.pp_99,
                    beatmap.pp_98,
                    beatmap.pp_95,
                    beatmap.disable_pp,
                    beatmap.file_name,
                    beatmap.rankedby,
                    beatmap.priv_crawler
                )
            }
        }

        return beatmap;
    }

    private async getBeatmapFromOsuApi(beatmapId: number): Promise<Beatmap | null> {
        const beatmap = await this.osuApi.getBeatmap(beatmapId);

        if (beatmap === null) {
            return null;
        }

        return osuApiBeatmapToRippleBeatmap(beatmap);
    }
}
