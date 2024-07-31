import { Kysely } from "kysely";

import { Beatmap, Database, NewBeatmap, UpdateBeatmap } from "../database";

export class BeatmapRepository {
    constructor(private database: Kysely<Database>) {}

    async create(beatmap: NewBeatmap) {
        await this.database.insertInto("beatmaps").values(beatmap).execute();
    }

    async findByBeatmapId(beatmapId: number): Promise<Beatmap | null> {
        const beatmap = await this.database
            .selectFrom("beatmaps")
            .where("beatmap_id", "=", beatmapId)
            .selectAll()
            .executeTakeFirst();

        return beatmap !== undefined ? beatmap : null;
    }

    async findByMd5(beatmapMd5: string): Promise<Beatmap | null> {
        const beatmap = await this.database
            .selectFrom("beatmaps")
            .where("beatmap_md5", "=", beatmapMd5)
            .selectAll()
            .executeTakeFirst();

        return beatmap !== undefined ? beatmap : null;
    }

    async updateByBeatmapId(beatmapId: number, update: UpdateBeatmap) {
        await this.database
            .updateTable("beatmaps")
            .set(update)
            .where("beatmap_id", "=", beatmapId)
            .execute();
    }

    async updateByBeatmapMd5(beatmapMd5: string, update: UpdateBeatmap) {
        await this.database
            .updateTable("beatmaps")
            .set(update)
            .where("beatmap_md5", "=", beatmapMd5)
            .execute();
    }

    async createOrUpdate(beatmap: NewBeatmap): Promise<Beatmap> {
        const existingBeatmap = await this.findByMd5(beatmap.beatmap_md5);

        if (existingBeatmap === null) {
            await this.create(beatmap);
            return beatmap;
        }

        await this.updateByBeatmapMd5(beatmap.beatmap_md5, beatmap);
        return { ...existingBeatmap, ...beatmap };
    }

    async fromFileName(fileName: string): Promise<Beatmap | null> {
        const beatmap = await this.database
            .selectFrom("beatmaps")
            .where("file_name", "=", fileName)
            .selectAll()
            .executeTakeFirst();

        return beatmap !== undefined ? beatmap : null;
    }

    async deleteByBeatmapId(beatmapId: number) {
        await this.database
            .deleteFrom("beatmaps")
            .where("beatmap_id", "=", beatmapId)
            .execute();
    }

    async fromBeatmapSetId(beatmapSetId: number): Promise<Beatmap[]> {
        return this.database
            .selectFrom("beatmaps")
            .where("beatmapset_id", "=", beatmapSetId)
            .selectAll()
            .execute();
    }

    async deleteByBeatmapSetId(beatmapSetId: number) {
        await this.database
            .deleteFrom("beatmaps")
            .where("beatmapset_id", "=", beatmapSetId)
            .execute();
    }
}
