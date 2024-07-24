import { Database } from "../database";
import { Kysely } from "kysely";

export interface LeaderboardScore {
    id: number;
    displayedUsername: string;
    displayedScore: number;
    max_combo: number;
    count_50: number;
    count_100: number;
    count_300: number;
    count_miss: number;
    count_katu: number;
    count_geki: number;
    full_combo: boolean;
    mods: number;
    user_id: number;
    rank: number;
    time: number;
    has_replay: boolean;
}


export class LeaderboardRepository {
    constructor(private database: Kysely<Database>) {}

    
}
