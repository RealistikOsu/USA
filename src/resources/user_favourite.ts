import { Kysely } from "kysely";

import { Database, UserFavourite } from "../database";

export class UserFavouriteRepository {
    constructor(private database: Kysely<Database>) {}

    async create(userFavourite: UserFavourite) {
        return this.database
            .insertInto("user_favourites")
            .values(userFavourite)
            .execute();
    }

    async createFavourite(userId: number, beatmapSetId: number) {
        return this.database
            .insertInto("user_favourites")
            .values({
                user_id: userId,
                beatmapset_id: beatmapSetId,
                created_at: new Date(),
            })
            .execute();
    }

    async fromUserId(userId: number): Promise<UserFavourite[]> {
        return this.database
            .selectFrom("user_favourites")
            .where("user_id", "=", userId)
            .selectAll()
            .execute();
    }

    async delete(userId: number, beatmapSetId: number) {
        return this.database
            .deleteFrom("user_favourites")
            .where("user_id", "=", userId)
            .where("beatmapset_id", "=", beatmapSetId)
            .execute();
    }

    async fromUserIdAndBeatmapSetId(
        userId: number,
        beatmapSetId: number
    ): Promise<UserFavourite | null> {
        const favourite = await this.database
            .selectFrom("user_favourites")
            .where("user_id", "=", userId)
            .where("beatmapset_id", "=", beatmapSetId)
            .selectAll()
            .executeTakeFirstOrThrow();

        return favourite !== undefined ? favourite : null;
    }
}
