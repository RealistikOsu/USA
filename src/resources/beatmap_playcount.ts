import { Kysely, sql } from "kysely";

import { Database } from "../database";

export class BeatmapPlaycountRepository {
  constructor(private database: Kysely<Database>) {}

  async createOrIncrement(userId: number, beatmapId: number, gameMode: number) {
    await this.database
      .insertInto("users_beatmap_playcount")
      .values({
        user_id: userId,
        beatmap_id: beatmapId,
        game_mode: gameMode,
        playcount: 1,
      })
      .onDuplicateKeyUpdate((eb) => ({
        playcount: sql`${eb.ref("playcount")} + 1`,
      }))
      .execute();
  }
}
