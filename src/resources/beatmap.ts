import { Connection } from "mysql2/promise";

export interface Beatmap {
    beatmap_id: number;
    beatmapset_id: number;
    beatmap_md5: string;
    song_name: string;
    ar: number;
    od: number;
    mode: number;
    rating: number;
    difficulty_std: number;
    difficulty_taiko: number;
    difficulty_ctb: number;
    difficulty_mania: number;
    max_combo: number;
    hit_length: number;
    bpm: number;
    playcount: number;
    passcount: number;
    ranked: number;
    latest_update: number;
    ranked_status_freezed: boolean;
    pp_100: number;
    pp_99: number;
    pp_98: number;
    pp_95: number;
    disable_pp: boolean;
    file_name: string;
    rankedby: string;
    priv_crawler: boolean;
}

export class BeatmapRepository {
    constructor(
        private database: Connection,
    ) { }

    async create(beatmap: Beatmap) {
        await this.database.query(
            "INSERT INTO beatmaps VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
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
                beatmap.priv_crawler,
            ]
        );
    }

    async findByBeatmapId(beatmapId: number): Promise<Beatmap | null> {
        const [results, _] = await this.database.query(
            "SELECT * FROM beatmaps WHERE beatmap_id = ?",
            [beatmapId]
        );

        const beatmapResult = results as Beatmap[];

        if (beatmapResult.length === 0) {
            return null;
        }

        return beatmapResult[0];
    }

    async findByMd5(beatmapMd5: string): Promise<Beatmap | null> {
        const [results, _] = await this.database.query(
            "SELECT * FROM beatmaps WHERE beatmap_md5 = ?",
            [beatmapMd5]
        );

        const beatmapResult = results as Beatmap[];

        if (beatmapResult.length === 0) {
            return null;
        }

        return beatmapResult[0];
    }
}