import { Generated, Insertable, Selectable, Updateable } from "kysely"

export interface Database {
    seasonal_bg: SeasonalBackgroundTable;
    beatmaps: BeatmapsTable;
    scores: ScoresTable;
    scores_relax: ScoresTable;
    scores_ap: ScoresTable;
    beatmaps_rating: BeatmapRatingTable;
    users: UsersTable;
    clans: ClansTable;
    user_clans: UserClansTable;
    users_relationships: UserRelationshipTable;
}

interface SeasonalBackgroundTable {
    id: Generated<number>;
    url: string;
    enabled: boolean;
}

interface BeatmapsTable {
    beatmap_id: number;
    beatmapset_id: number;
    beatmap_md5: string;
    song_name: string;
    ar: number;
    od: number;
    mode: number;
    rating: number;
    difficulty_std: number;
    difficulty_taiko: number;
    difficulty_ctb: number;
    difficulty_mania: number;
    max_combo: number;
    hit_length: number;
    bpm: number;
    playcount: number;
    passcount: number;
    ranked: number;
    latest_update: number;
    ranked_status_freezed: boolean;
    pp_100: number;
    pp_99: number;
    pp_98: number;
    pp_95: number;
    disable_pp: boolean;
    file_name: string;
    rankedby: string;
    priv_crawler: boolean;
}

interface ScoresTable {
    id: Generated<number>;
    beatmap_md5: string;
    userid: number;
    score: number;
    max_combo: number;
    full_combo: boolean;
    mods: number;
    "300_count": number;
    "100_count": number;
    "50_count": number;
    katus_count: number;
    gekis_count: number;
    misses_count: number;
    time: number;
    play_mode: number;
    completed: number;
    accuracy: number;
    pp: number;
    playtime: number;
}

interface BeatmapRatingTable {
    id: Generated<number>;
    user_id: number;
    beatmap_md5: string;
    rating: number;
}

interface UsersTable {
    id: Generated<number>;
    osuver: string | null;
    username: string;
    username_safe: string;
    ban_datetime: Date;
    password_md5: string;
    salt: string;
    email: string;
    register_datetime: number;
    rank: boolean;
    allowed: boolean;
    latest_activity: number;
    silence_end: number;
    silence_reason: string;
    password_version: number;
    privileges: number;
    donor_expire: number;
    flags: number;
    achievements_version: number;
    achievements_0: number;
    achievements_1: number;
    notes: string | null;
    frozen: number;
    freezedate: number;
    firstloginafterfrozen: number;
    bypass_hwid: boolean;
    ban_reason: string;
    disabled_comments: boolean;
    country: string;
    api_key: string;
}

interface ClansTable {
    id: Generated<number>;
    name: string;
    description: string;
    icon: string;
    tag: string;
    mlimit: number;
}

interface UserClansTable {
    id: Generated<number>;
    user: number;
    clan: number;
    perms: number;
}

interface UserRelationshipTable {
    id: Generated<number>;
    user1: number;
    user2: number;
}

export type NewBeatmap = Insertable<BeatmapsTable>;
export type NewScore = Insertable<ScoresTable>;
export type NewRating = Insertable<BeatmapRatingTable>;
export type NewBeatmapRating = Insertable<BeatmapRatingTable>;

export type SeasonalBackground = Selectable<SeasonalBackgroundTable>;
export type Beatmap = Selectable<BeatmapsTable>;
export type Score = Selectable<ScoresTable>;
export type BeatmapRating = Selectable<BeatmapRatingTable>;
export type User = Selectable<UsersTable>;
export type Clan = Selectable<ClansTable>;
export type UserClan = Selectable<UserClansTable>;
export type UserRelationship = Selectable<UserRelationshipTable>;

export type UpdateBeatmap = Updateable<BeatmapsTable>;
