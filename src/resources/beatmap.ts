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

    async create(
        beatmap_id: number,
        beatmapset_id: number,
        beatmap_md5: string,
        song_name: string,
        ar: number,
        od: number,
        mode: number,
        rating: number,
        difficulty_std: number,
        difficulty_taiko: number,
        difficulty_ctb: number,
        difficulty_mania: number,
        max_combo: number,
        hit_length: number,
        bpm: number,
        playcount: number,
        passcount: number,
        ranked: number,
        latest_update: number,
        ranked_status_freezed: boolean,
        pp_100: number,
        pp_99: number,
        pp_98: number,
        pp_95: number,
        disable_pp: boolean,
        file_name: string,
        rankedby: string,
        priv_crawler: boolean,
    ): Promise<Beatmap> {
        await this.database.query(
            "INSERT INTO beatmaps VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                beatmap_id,
                beatmapset_id,
                beatmap_md5,
                song_name,
                ar,
                od,
                mode,
                rating,
                difficulty_std,
                difficulty_taiko,
                difficulty_ctb,
                difficulty_mania,
                max_combo,
                hit_length,
                bpm,
                playcount,
                passcount,
                ranked,
                latest_update,
                ranked_status_freezed,
                pp_100,
                pp_99,
                pp_98,
                pp_95,
                disable_pp,
                file_name,
                rankedby,
                priv_crawler,
            ]
        );

        return {
            beatmap_id,
            beatmapset_id,
            beatmap_md5,
            song_name,
            ar,
            od,
            mode,
            rating,
            difficulty_std,
            difficulty_taiko,
            difficulty_ctb,
            difficulty_mania,
            max_combo,
            hit_length,
            bpm,
            playcount,
            passcount,
            ranked,
            latest_update,
            ranked_status_freezed,
            pp_100,
            pp_99,
            pp_98,
            pp_95,
            disable_pp,
            file_name,
            rankedby,
            priv_crawler,
        };
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