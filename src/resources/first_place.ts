import { Kysely } from "kysely";

import { OsuMode, RelaxType } from "../adapters/osu";
import { Database, NewFirstPlace } from "../database";

export class FirstPlaceRepository {
    constructor(private database: Kysely<Database>) {}

    async delete(beatmapMd5: string, mode: OsuMode, relaxType: RelaxType) {
        await this.database
            .deleteFrom("first_places")
            .where("beatmap_md5", "=", beatmapMd5)
            .where("mode", "=", mode)
            .where("relax", "=", relaxType)
            .execute();
    }

    async create(firstPlace: NewFirstPlace) {
        await this.database
            .insertInto("first_places")
            .values(firstPlace)
            .execute();
    }
}
