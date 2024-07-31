import { Kysely } from "kysely";

import { Database, UserRelationship } from "../database";

export class UserRelationshipRepository {
  constructor(private database: Kysely<Database>) {}

  async fetchManyByUserId(userId: number): Promise<UserRelationship[]> {
    const userRelationships = await this.database
      .selectFrom("users_relationships")
      .selectAll()
      .where("user1", "=", userId)
      .execute();

    return userRelationships;
  }
}
