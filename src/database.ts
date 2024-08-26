import { Generated, Insertable, Selectable, Updateable } from "kysely";

import { OsuMode, RelaxType } from "./adapters/osu";
import { ScoreStatus } from "./adapters/score";

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
    users_beatmap_playcount: UserBeatmapPlaycountTable;
    users_stats: UsersStatsTable;

    // Technically these two differ a tad bit from users_stats.
    rx_stats: UsersStatsTable;
    ap_stats: UsersStatsTable;

    lastfm_flags: LastfmFlagsTable;
    user_favourites: UserFavouritesTable;
    comments: BeatmapCommentsTable;
    pp_limits: PpLimitsTable;
    user_badges: UserBadgesTable;
    whitelist: WhitelistTable;
    ban_logs: BanLogsTable;
    first_places: FirstPlacesTable;
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
    play_mode: OsuMode;
    completed: ScoreStatus;
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
    ban_datetime: number;
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
    coins: number;
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

interface UserBeatmapPlaycountTable {
    id: Generated<number>;
    user_id: number;
    beatmap_id: number;
    game_mode: number;
    playcount: number;
}

interface UsersStatsTable {
    id: Generated<number>;
    username: string;
    username_aka: string;
    user_color: string;
    user_style: string;
    ranked_score_std: number;
    playcount_std: number;
    total_score_std: number;
    replays_watched_std: number;
    ranked_score_taiko: number;
    playcount_taiko: number;
    total_score_taiko: number;
    replays_watched_taiko: number;
    ranked_score_ctb: number;
    playcount_ctb: number;
    total_score_ctb: number;
    replays_watched_ctb: number;
    ranked_score_mania: number;
    playcount_mania: number;
    total_score_mania: number;
    replays_watched_mania: number;
    total_hits_std: number;
    total_hits_taiko: number;
    total_hits_ctb: number;
    total_hits_mania: number;
    country: string;
    unrestricted_pp: number;
    ppboard: boolean;
    show_country: boolean;
    level_std: number;
    level_taiko: number;
    level_ctb: number;
    level_mania: number;
    playtime_std: number;
    playtime_taiko: number;
    playtime_ctb: number;
    playtime_mania: number;
    avg_accuracy_std: number;
    avg_accuracy_taiko: number;
    avg_accuracy_ctb: number;
    avg_accuracy_mania: number;
    pp_std: number;
    pp_taiko: number;
    pp_ctb: number;
    pp_mania: number;
    badges_shown: string;
    safe_title: boolean;
    userpage_content: string;
    play_style: number;
    favourite_mode: number;
    prefer_relax: number;
    custom_badge_icon: string;
    custom_badge_name: string;
    can_custom_badge: boolean;
    show_custom_badge: boolean;
    current_status: string;
    achievements: number;
    max_combo_std: number;
    max_combo_taiko: number;
    max_combo_ctb: number;
    max_combo_mania: number;
}

interface LastfmFlagsTable {
    id: Generated<number>;
    user_id: number;
    timestamp: number;
    flag_enum: number;
    flag_text: string;
}

interface UserFavouritesTable {
    user_id: number;
    beatmapset_id: number;
    created_at: Date;
}

interface BeatmapCommentsTable {
    id: Generated<number>;
    beatmapset_id?: number;
    beatmap_id?: number;
    score_id?: number;
    user_id: number;
    comment: string;
    time: number;
    who: string;
    special_format: string;
}

interface PpLimitsTable {
    mode: OsuMode;
    relax: RelaxType;
    pp: number;
    flashlight_pp: number;
}

interface UserBadgesTable {
    id: Generated<number>;
    user: number;
    badge: number;
}

interface WhitelistTable {
    user_id: number;
}

interface BanLogsTable {
    id: Generated<number>;
    from_id: number;
    to_id: number;
    ts: Generated<Date>;
    summary: string;
    detail: string;
}

interface FirstPlacesTable {
    id: Generated<number>;
    score_id: number;
    user_id: number;
    score: number;
    max_combo: number;
    full_combo: boolean;
    mods: number;
    "300_count": number;
    "100_count": number;
    "50_count": number;
    ckatus_count: number;
    cgekis_count: number;
    miss_count: number;
    timestamp: number;
    mode: OsuMode;
    completed: ScoreStatus;
    accuracy: number;
    pp: number;
    play_time: number;
    beatmap_md5: string;
    relax: RelaxType;
}

export type NewBeatmap = Insertable<BeatmapsTable>;
export type NewScore = Insertable<ScoresTable>;
export type NewRating = Insertable<BeatmapRatingTable>;
export type NewBeatmapRating = Insertable<BeatmapRatingTable>;
export type NewUserBeatmapPlaycount = Insertable<UserBeatmapPlaycountTable>;
export type NewLastfmFlag = Insertable<LastfmFlagsTable>;
export type NewUserFavorite = Insertable<UserFavouritesTable>;
export type NewBeatmapComment = Insertable<BeatmapCommentsTable>;
export type NewBanLog = Insertable<BanLogsTable>;
export type NewFirstPlace = Insertable<FirstPlacesTable>;

export type SeasonalBackground = Selectable<SeasonalBackgroundTable>;
export type Beatmap = Selectable<BeatmapsTable>;
export type Score = Selectable<ScoresTable>;
export type BeatmapRating = Selectable<BeatmapRatingTable>;
export type User = Selectable<UsersTable>;
export type Clan = Selectable<ClansTable>;
export type UserClan = Selectable<UserClansTable>;
export type UserRelationship = Selectable<UserRelationshipTable>;
export type UserBeatmapPlaycount = Selectable<UserBeatmapPlaycountTable>;
export type UserStats = Selectable<UsersStatsTable>;
export type UserFavourite = Selectable<UserFavouritesTable>;
export type BeatmapComment = Selectable<BeatmapCommentsTable>;
export type PpLimit = Selectable<PpLimitsTable>;
export type UserBadge = Selectable<UserBadgesTable>;
export type Whitelist = Selectable<WhitelistTable>;
export type BanLog = Selectable<BanLogsTable>;
export type FirstPlace = Selectable<FirstPlacesTable>;

export type UpdateBeatmap = Updateable<BeatmapsTable>;
export type UpdateUserBeatmapPlaycount = Updateable<UserBeatmapPlaycountTable>;
export type UpdateUserStats = Updateable<UsersStatsTable>;
export type UpdateUser = Updateable<UsersTable>;
export type UpdateScore = Updateable<ScoresTable>;
