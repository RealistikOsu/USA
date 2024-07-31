import { Kysely, sql } from "kysely";

import {
  modeSuffixFromMode,
  OsuMode,
  OsuModeString,
  userStatsTableFromRelaxType,
} from "../adapters/osu";
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
    relaxMode: number,
    userStats: UpdateUserStats
  ): Promise<void> {
    const relaxTable = userStatsTableFromRelaxType(relaxMode);

    await this.database
      .updateTable(relaxTable)
      .set(userStats)
      .where("id", "=", userId)
      .execute();
  }

  async incrementReplayViews(userId: number, mode: OsuMode): Promise<void> {
    const replayColumn: ReplaysWatchedColumn = `replays_watched_${modeSuffixFromMode(mode)}`;

    await this.database
      .updateTable("users_stats")
      .set((eb) => ({ [replayColumn]: sql`${eb.ref(replayColumn)} + 1` }))
      .where("id", "=", userId)
      .execute();
  }
}

type ReplaysWatchedColumn = `replays_watched_${OsuModeString}`;
