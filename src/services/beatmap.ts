import { v2 } from "osu-api-extended";
import { osuApiBeatmapToRippleBeatmap } from "../adapters/beatmap";
import { Beatmap } from "../database";
import { BeatmapRepository } from "../resources/beatmap";

export class BeatmapService {
    constructor(
        private beatmapRepository: BeatmapRepository) { }

    async findByBeatmapId(beatmapId: number): Promise<Beatmap | null> {
        let beatmap = await this.beatmapRepository.findByBeatmapId(beatmapId);

        if (beatmap === null) {
            beatmap = await this.getBeatmapFromOsuApi(beatmapId);

            if (beatmap !== null) {
                await this.beatmapRepository.create(beatmap);
            }
        }

        return beatmap;
    }

    private async getBeatmapFromOsuApi(beatmapId: number): Promise<Beatmap | null> {
        const beatmap = await v2.beatmap.id.details(beatmapId);

        if (beatmap === null) {
            return null;
        }

        return osuApiBeatmapToRippleBeatmap(beatmap);
    }
}
