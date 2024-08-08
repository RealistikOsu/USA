import { Kysely } from "kysely";

import { Database, NewBanLog } from "../database";

export class BanLogRepository {
    constructor(private database: Kysely<Database>) {}

    async create(banLog: NewBanLog) {
        await this.database.insertInto("ban_logs").values(banLog).execute();
    }
}
