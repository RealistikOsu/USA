import { Kysely } from "kysely";

import { OsuMode, RelaxType } from "../adapters/osu";
import { Database, PpLimit } from "../database";

export class PpLimitRepository {
    constructor(private database: Kysely<Database>) {}

    async getByModeAndRelaxType(
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<PpLimit> {
        const ppLimit = await this.database
            .selectFrom("pp_limits")
            .selectAll()
            .where("mode", "=", mode)
            .where("relax", "=", relaxType)
            .executeTakeFirstOrThrow();

        return ppLimit;
    }
}
