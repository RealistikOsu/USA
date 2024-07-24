import { Connection } from "mysql2/promise";
import { SeasonalBG } from "../entities/seasonal_bg";

export const getEnabledSeasonalBGs = async (database: Connection): Promise<SeasonalBG[]> => {
    const [results, _] = await database.query('SELECT id, url, enabled FROM seasonal_bg WHERE enabled = 1');
    return results as SeasonalBG[];
}
