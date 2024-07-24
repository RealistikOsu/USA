import { OsuMode, RelaxType } from "../adapters/osu";
import { Database, NewScore, Score } from "../database";
import { Kysely } from "kysely";

export class ScoreRepository {
    constructor(private database: Kysely<Database>) {}

    async fromBeatmapMd5(beatmap_md5: string, relaxType: RelaxType): Promise<Score[]> {
        const table = rippleTableFromRelax(relaxType);

        const scores = await this.database.selectFrom(table)
            .where('beatmap_md5', '=', beatmap_md5)
            .selectAll()
            .execute();
        
        return scores;
    }

    async fromBeatmapMd5WherePersonalBestAndPlayModeOrderedByScore(
        beatmap_md5: string,
        play_mode: OsuMode,
        relaxType: RelaxType,
    ): Promise<Score[]> {
        const table = rippleTableFromRelax(relaxType);

        const scores = await this.database.selectFrom(table)
            .where('beatmap_md5', '=', beatmap_md5)
            .where('completed', '=', 3)
            .where('play_mode', '=', play_mode)
            .orderBy('score', 'desc')
            .selectAll()
            .execute();

        return scores;
    }


    async create(score: NewScore, relaxType: RelaxType): Promise<Score> {
        const table = rippleTableFromRelax(relaxType);

        const { insertId } = await this.database.insertInto(table)
            .values(score)
            .executeTakeFirstOrThrow();

        const scoreId = Number(insertId);

        return {
            id: scoreId,
            ...score,
        };
    }
    
}


function rippleTableFromRelax(value: RelaxType): "scores" | "scores_relax" | "scores_ap" {
    switch (value) {
        case 0: return "scores";
        case 1: return "scores_relax";
        case 2: return "scores_ap";
    }
}
