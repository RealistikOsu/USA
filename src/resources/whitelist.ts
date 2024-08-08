import { Kysely } from "kysely";

import { Database } from "../database";

export class WhitelistRepository {
    constructor(private database: Kysely<Database>) {}

    async hasWhitelist(userId: number): Promise<boolean> {
        const whitelist = await this.database
            .selectFrom("whitelist")
            .selectAll()
            .where("user_id", "=", userId)
            .executeTakeFirst();

        return whitelist !== undefined;
    }
}
