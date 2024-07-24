import { Connection } from "mysql2/promise";
import { API as OsuApi, Beatmap as OsuBeatmap } from "osu-api-v2-js";

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
        private osuApi: OsuApi,
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

    private async fromBeatmapIdDatabase(beatmap_id: number): Promise<Beatmap | null> {
        const [results, _] = await this.database.query(
            "SELECT * FROM beatmaps WHERE beatmap_id = ?",
            [beatmap_id]
        );

        const beatmapResult = results as Beatmap[];

        if (beatmapResult.length === 0) {
            return null;
        }

        return beatmapResult[0];
    }

    private async fromBeatmapIdOsuApi(beatmap_id: number): Promise<Beatmap | null> {
        const beatmap = await this.osuApi.getBeatmap(beatmap_id);

        if (beatmap === null) {
            return null;
        }

        return osuApiBeatmapAsRippleBeatamp(beatmap);
    }

    async fromBeatmapId(beatmap_id: number): Promise<Beatmap | null> {
        let beatmap = await this.fromBeatmapIdDatabase(beatmap_id);

        if (beatmap === null) {
            beatmap = await this.fromBeatmapIdOsuApi(beatmap_id);

            if (beatmap !== null) {
                beatmap = await this.create(
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

    private async fromMd5Database(beatmap_md5: string): Promise<Beatmap | null> {
        const [results, _] = await this.database.query(
            "SELECT * FROM beatmaps WHERE beatmap_md5 = ?",
            [beatmap_md5]
        );

        const beatmapResult = results as Beatmap[];

        if (beatmapResult.length === 0) {
            return null;
        }

        return beatmapResult[0];
    }

    private async fromMd5OsuApi(beatmap_md5: string): Promise<Beatmap | null> {
        const beatmap = await this.osuApi.lookupBeatmap({checksum: beatmap_md5});

        if (beatmap === null) {
            return null;
        }

        return osuApiBeatmapAsRippleBeatamp(beatmap);
    }

    async fromMd5(beatmap_md5: string): Promise<Beatmap | null> {
        let beatmap = await this.fromMd5Database(beatmap_md5);

        if (beatmap === null) {
            beatmap = await this.fromMd5OsuApi(beatmap_md5);

            if (beatmap !== null) {
                beatmap = await this.create(
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
