import { Kysely } from "kysely";

import { Database, NewLastfmFlag } from "../database";

export class LastfmFlagRepository {
    constructor(private database: Kysely<Database>) {}

    async create(lastfmFlag: NewLastfmFlag) {
        await this.database
            .insertInto("lastfm_flags")
            .values(lastfmFlag)
            .execute();
    }
}
