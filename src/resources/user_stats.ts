import { Kysely } from "kysely";

import { RelaxType, userStatsTableFromRelaxType } from "../adapters/osu";
import { Database, UpdateUserStats, UserStats } from "../database";

export class UserStatsRepository {
    constructor(private database: Kysely<Database>) {}

    async fromUserId(
        userId: number,
        relaxMode: number
    ): Promise<UserStats | null> {
        const relaxTable = userStatsTableFromRelaxType(relaxMode);

        const result = await this.database
            .selectFrom(relaxTable)
            .selectAll()
            .where("id", "=", userId)
            .executeTakeFirstOrThrow();

        return result !== undefined ? result : null;
    }

    async updateByUserId(
        userId: number,
        relaxType: RelaxType,
        userStats: UpdateUserStats
    ): Promise<void> {
        const relaxTable = userStatsTableFromRelaxType(relaxType);

        await this.database
            .updateTable(relaxTable)
            .set(userStats)
            .where("id", "=", userId)
            .execute();
    }
}
