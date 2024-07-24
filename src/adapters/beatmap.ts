import { Beatmap } from "../database";
import { response as OsuBeatmap } from "osu-api-extended/dist/types/v2_beatmap_id_details";

export function osuApiModeAsInteger(mode: string): number {
    switch (mode) {
        case "osu":
            return 0;
        case "taiko":
            return 1;
        case "fruits":
            return 2;
        case "mania":
            return 3;
        default:
            throw new Error(`Invalid mode string: ${mode}`)
    }
}

export function formatRippleBeatmapSongName(artist: string, title: string, difficulty: string): string {
    return `${artist} - ${title} [${difficulty}]`;
}

export function formatRippleBeatmapFilename(artist: string, title: string, difficulty: string, creator: string): string {
    return `${artist} - ${title} [${difficulty}] (${creator}).osu`;
}

export function osuApiBeatmapToRippleBeatmap(beatmap: OsuBeatmap): Beatmap {
    return {
        beatmap_id: beatmap.id,
        beatmapset_id: beatmap.beatmapset_id,
        beatmap_md5: beatmap.checksum,
        song_name: formatRippleBeatmapSongName(beatmap.beatmapset.artist, beatmap.beatmapset.title, beatmap.version),
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
        file_name: formatRippleBeatmapFilename(beatmap.beatmapset.artist, beatmap.beatmapset.title, beatmap.version, beatmap.beatmapset.creator),
        rankedby: "",
        priv_crawler: false,
    }
}