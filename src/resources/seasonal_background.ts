import { Kysely } from "kysely";

import { Database, SeasonalBackground } from "../database";

export class SeasonalBackgroundRepository {
  constructor(private database: Kysely<Database>) {}

  async getWhereEnabled(
    enabled: boolean = true
  ): Promise<SeasonalBackground[]> {
    const seasonalBackgrounds = await this.database
      .selectFrom("seasonal_bg")
      .where("enabled", "=", enabled)
      .selectAll()
      .execute();

    return seasonalBackgrounds;
  }
}
