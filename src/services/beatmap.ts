import { Beatmap, BeatmapRepository } from "../resources/beatmap";
import { API as OsuApi, Beatmap as OsuBeatmap } from "osu-api-v2-js";

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

        return osuApiBeatmapAsRippleBeatamp(beatmap);
    }
}

function osuApiModeAsInteger(mode: "osu" | "taiko" | "mania" | "fruits" ): number {
    switch (mode) {
        case "osu":
            return 0;
        case "taiko":
            return 1;
        case "fruits":
            return 2;
        case "mania":
            return 3;
    }
}

function makeOsuTitle(artist: string, title: string, difficulty: string): string {
    return `${artist} - ${title} [${difficulty}]`;
}

function makeOsuFilename(artist: string, title: string, difficulty: string, creator: string): string {
    return `${artist} - ${title} [${difficulty}] (${creator}).osu`;
}

function osuApiBeatmapAsRippleBeatamp(beatmap: OsuBeatmap.Extended.WithFailtimesBeatmapset): Beatmap {
    return {
        beatmap_id: beatmap.id,
        beatmapset_id: beatmap.beatmapset_id,
        beatmap_md5: beatmap.checksum,
        song_name: makeOsuTitle(beatmap.beatmapset.artist, beatmap.beatmapset.title, beatmap.version),
        ar: beatmap.ar,
        od: beatmap.accuracy,
        mode: osuApiModeAsInteger(beatmap.mode),
        rating: 10,
        difficulty_std: beatmap.difficulty_rating,
        difficulty_taiko: beatmap.difficulty_rating,
        difficulty_ctb: beatmap.difficulty_rating,
        difficulty_mania: beatmap.difficulty_rating,
        max_combo: beatmap.max_combo,
        hit_length: beatmap.hit_length,
        bpm: beatmap.bpm,
        playcount: beatmap.playcount,
        passcount: beatmap.passcount,
        ranked: beatmap.ranked,
        latest_update: new Date().getUTCSeconds(),
        ranked_status_freezed: false,
        pp_100: 0,
        pp_99: 0,
        pp_98: 0,
        pp_95: 0,
        disable_pp: false,
        file_name: makeOsuFilename(beatmap.beatmapset.artist, beatmap.beatmapset.title, beatmap.version, beatmap.beatmapset.creator),
        rankedby: "",
        priv_crawler: false,
    }
}
