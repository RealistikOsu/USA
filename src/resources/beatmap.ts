import { Kysely } from "kysely";
import { Beatmap, Database, NewBeatmap } from "../database";

export class BeatmapRepository {
    constructor(
        private database: Kysely<Database>,
    ) { }

    async create(beatmap: NewBeatmap) {
        await this.database.insertInto('beatmaps')
            .values(beatmap)
            .execute();
    }

    async findByBeatmapId(beatmapId: number): Promise<Beatmap | null> {
        const beatmap = await this.database.selectFrom('beatmaps')
            .where('beatmap_id', '=', beatmapId)
            .selectAll()
            .executeTakeFirst();

        return beatmap !== undefined ? beatmap : null;
    }

    async findByMd5(beatmapMd5: string): Promise<Beatmap | null> {
        const beatmap = await this.database.selectFrom('beatmaps')
            .where('beatmap_md5', '=', beatmapMd5)
            .selectAll()
            .executeTakeFirst();

        return beatmap !== undefined ? beatmap : null;
    }
}