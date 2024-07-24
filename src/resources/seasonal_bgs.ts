import { Connection } from "mysql2/promise";

export interface SeasonalBackground {
    id: number;
    url: string;
    enabled: boolean;
}

export class SeasonalBackgroundRepository {
    constructor(private database: Connection) {}

    async getSeasonalBackgrounds(enabled: boolean = true): Promise<SeasonalBackground[]> {
        const [results, _] = await this.database.query(
            'SELECT * FROM seasonal_bg WHERE enabled = ?',
            [enabled],
        );

        return results as SeasonalBackground[];
    }
}
