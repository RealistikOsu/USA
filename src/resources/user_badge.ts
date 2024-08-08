import { Kysely } from "kysely";

import { Database } from "../database";

export class UserBadgeRepository {
    constructor(private database: Kysely<Database>) {}

    async hasBadge(userId: number, badgeId: number): Promise<boolean> {
        const hasBadge = await this.database
            .selectFrom("user_badges")
            .selectAll()
            .where("user", "=", userId)
            .where("badge", "=", badgeId)
            .executeTakeFirst();

        return hasBadge !== undefined;
    }
}
