import { Kysely } from "kysely";

import { Database, UpdateUser, User } from "../database";

export class UserRepository {
    constructor(private database: Kysely<Database>) {}

    async findById(userId: number): Promise<User | null> {
        const user = await this.database
            .selectFrom("users")
            .where("id", "=", userId)
            .selectAll()
            .executeTakeFirst();

        return user !== undefined ? user : null;
    }

    async findByUsernameSafe(usernameSafe: string): Promise<User | null> {
        const user = await this.database
            .selectFrom("users")
            .where("username_safe", "=", usernameSafe)
            .selectAll()
            .executeTakeFirst();

        return user !== undefined ? user : null;
    }

    async updateUserById(userId: number, update: UpdateUser) {
        await this.database
            .updateTable('users')
            .set(update)
            .where('id', '=', userId)
            .execute();
    }
}
