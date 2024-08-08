import { Kysely, sql } from "kysely";

import { OsuMode, RelaxType, scoresTableFromRelaxType } from "../adapters/osu";
import { Database, NewScore, Score, UpdateScore } from "../database";

export interface ScoreWithRank extends Score {
    rank: number;
}

export interface ScoreWithRankAndUsername extends ScoreWithRank {
    username: string;
}

export interface FetchManyScoresParameters {
    beatmapMd5: string;
    playMode: OsuMode;
    relaxType: RelaxType;
    requesteeUserId: number;
    modsFilter?: number;
    countryFilter?: string;
    userIdsFilter?: number[];
    bestScoresOnly: boolean;
    scoreLimit: number;
    sortColumn: "pp" | "score";
}

export interface FindByUserIdParameters {
    beatmapMd5: string;
    playMode: OsuMode;
    relaxType: RelaxType;
    userId: number;
    modsFilter?: number;
    bestScoresOnly: boolean;
    sortColumn: "pp" | "score";
}

export interface TopScore {
    accuracy: number;
    pp: number;
}

export class ScoreRepository {
    constructor(private database: Kysely<Database>) {}

    async create(score: NewScore, relaxType: RelaxType): Promise<Score> {
        const table = scoresTableFromRelaxType(relaxType);

        const { insertId } = await this.database
            .insertInto(table)
            .values(score)
            .executeTakeFirstOrThrow();

        const scoreId = Number(insertId);

        return {
            id: scoreId,
            ...score,
        };
    }

    async update(scoreId: number, score: UpdateScore, relaxType: RelaxType) {
        const table = scoresTableFromRelaxType(relaxType);

        await this.database
            .updateTable(table)
            .set(score)
            .where("id", "=", scoreId)
            .execute();
    }

    async findBestByUserIdAndBeatmapMd5(
        userId: number,
        beatmapMd5: string,
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<Score | null> {
        const table = scoresTableFromRelaxType(relaxType);

        const score = await this.database
            .selectFrom(table)
            .selectAll()
            .where("userid", "=", userId)
            .where("beatmap_md5", "=", beatmapMd5)
            .where("play_mode", "=", mode)
            .where("completed", "=", 3)
            .executeTakeFirst();

        return score !== undefined ? score : null;
    }

    async findByUserIdWithRankAndUsername(
        params: FindByUserIdParameters
    ): Promise<ScoreWithRankAndUsername | null> {
        const table = scoresTableFromRelaxType(params.relaxType);

        const score = await this.database
            .with("ranked_scores", (database) => {
                let cteQuery = database
                    .selectFrom(table)
                    .innerJoin("users", "users.id", `${table}.userid`)
                    .leftJoin("user_clans", "user_clans.user", "userid")
                    .leftJoin("clans", "clans.id", "user_clans.clan")
                    .selectAll(table)
                    .select((eb) =>
                        sql<number>`row_number() OVER (PARTITION BY ${eb.ref("userid")}
                        ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref("time")} ASC)`.as(
                            "score_order_rank"
                        )
                    )
                    .select("clans.tag")
                    .select("users.username as users_username")
                    .where("beatmap_md5", "=", params.beatmapMd5)
                    .where("play_mode", "=", params.playMode)
                    .where((eb) =>
                        eb.or([
                            sql<boolean>`${eb.ref("privileges")} & 1 > 0`,
                            eb("userid", "=", params.userId),
                        ])
                    );

                if (params.bestScoresOnly) {
                    cteQuery = cteQuery.where("completed", "=", 3);
                } else {
                    cteQuery = cteQuery.where("completed", "in", [2, 3]);
                }

                if (params.modsFilter !== undefined) {
                    cteQuery = cteQuery.where("mods", "=", params.modsFilter);
                }

                return cteQuery;
            })
            .with("a", (database) => {
                return database
                    .selectFrom("ranked_scores")
                    .selectAll()
                    .select((eb) =>
                        sql<number>`row_number() OVER (ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref("time")} ASC)`.as(
                            "rank"
                        )
                    )
                    .where("score_order_rank", "=", 1);
            })
            .selectFrom("a")
            .selectAll("a")
            .select("users_username as username")
            .where("userid", "=", params.userId)
            .orderBy(params.sortColumn, "desc")
            .orderBy("time", "asc")
            .limit(1)
            .executeTakeFirst();

        return score !== undefined ? score : null;
    }

    async fetchManyWithRankAndUsername(
        params: FetchManyScoresParameters
    ): Promise<ScoreWithRankAndUsername[]> {
        const table = scoresTableFromRelaxType(params.relaxType);

        const scores = await this.database
            .with("ranked_scores", (database) => {
                let cteQuery = database
                    .selectFrom(table)
                    .innerJoin("users", "users.id", `${table}.userid`)
                    .leftJoin("user_clans", "user_clans.user", "userid")
                    .leftJoin("clans", "clans.id", "user_clans.clan")
                    .selectAll(table)
                    .select((eb) =>
                        sql<number>`row_number() OVER (PARTITION BY ${eb.ref("userid")}
                        ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref("time")} ASC)`.as(
                            "score_order_rank"
                        )
                    )
                    .select("clans.tag")
                    .select("users.username as users_username")
                    .where("beatmap_md5", "=", params.beatmapMd5)
                    .where("play_mode", "=", params.playMode)
                    .where((eb) =>
                        eb.or([
                            sql<boolean>`${eb.ref("privileges")} & 1 > 0`,
                            eb("userid", "=", params.requesteeUserId),
                        ])
                    );

                if (params.bestScoresOnly) {
                    cteQuery = cteQuery.where("completed", "=", 3);
                } else {
                    cteQuery = cteQuery.where("completed", "in", [2, 3]);
                }

                if (params.modsFilter !== undefined) {
                    cteQuery = cteQuery.where("mods", "=", params.modsFilter);
                }

                if (params.countryFilter !== undefined) {
                    cteQuery = cteQuery.where(
                        "country",
                        "=",
                        params.countryFilter
                    );
                }

                if (params.userIdsFilter !== undefined) {
                    cteQuery = cteQuery.where(
                        "userid",
                        "in",
                        params.userIdsFilter
                    );
                }

                return cteQuery;
            })
            .with("a", (database) => {
                return database
                    .selectFrom("ranked_scores")
                    .selectAll()
                    .select((eb) =>
                        sql<number>`row_number() OVER (ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref("time")} ASC)`.as(
                            "rank"
                        )
                    )
                    .where("score_order_rank", "=", 1);
            })
            .selectFrom("a")
            .selectAll("a")
            .select((eb) =>
                sql<string>`
            CONCAT(
                IF(
                    ${eb.ref("tag")} IS NOT NULL AND ${eb.ref("userid")} != ${params.requesteeUserId},
                    CONCAT("[", ${eb.ref("tag")}, "] "),
                    ""
                ),
                ${eb.ref("users_username")}
            )`.as("username")
            )
            .orderBy(params.sortColumn, "desc")
            .orderBy("time", "asc")
            .limit(params.scoreLimit)
            .execute();

        return scores;
    }

    async fetchScoreCount(params: FetchManyScoresParameters): Promise<number> {
        const table = scoresTableFromRelaxType(params.relaxType);

        const scoreCountResult = await this.database
            .with("ranked_scores", (database) => {
                let cteQuery = database
                    .selectFrom(table)
                    .innerJoin("users", "users.id", `${table}.userid`)
                    .leftJoin("user_clans", "user_clans.user", "userid")
                    .leftJoin("clans", "clans.id", "user_clans.clan")
                    .selectAll(table)
                    .select((eb) =>
                        sql<number>`row_number() OVER (PARTITION BY ${eb.ref("userid")}
                        ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref("time")} ASC)`.as(
                            "score_order_rank"
                        )
                    )
                    .select("clans.tag")
                    .select("users.username as users_username")
                    .where("beatmap_md5", "=", params.beatmapMd5)
                    .where("play_mode", "=", params.playMode)
                    .where((eb) =>
                        eb.or([
                            sql<boolean>`${eb.ref("privileges")} & 1 > 0`,
                            eb("userid", "=", params.requesteeUserId),
                        ])
                    );

                if (params.bestScoresOnly) {
                    cteQuery = cteQuery.where("completed", "=", 3);
                } else {
                    cteQuery = cteQuery.where("completed", "in", [2, 3]);
                }

                if (params.modsFilter !== undefined) {
                    cteQuery = cteQuery.where("mods", "=", params.modsFilter);
                }

                if (params.countryFilter !== undefined) {
                    cteQuery = cteQuery.where(
                        "country",
                        "=",
                        params.countryFilter
                    );
                }

                if (params.userIdsFilter !== undefined) {
                    cteQuery = cteQuery.where(
                        "userid",
                        "in",
                        params.userIdsFilter
                    );
                }

                return cteQuery;
            })
            .with("a", (database) => {
                return database
                    .selectFrom("ranked_scores")
                    .selectAll()
                    .select((eb) =>
                        sql<number>`row_number() OVER (ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref("time")} ASC)`.as(
                            "rank"
                        )
                    )
                    .where("score_order_rank", "=", 1);
            })
            .selectFrom("a")
            .select((eb) => eb.fn.countAll().as("count"))
            .executeTakeFirstOrThrow();

        return scoreCountResult.count as number;
    }

    async fromScoreId(
        scoreId: number,
        relaxType: RelaxType
    ): Promise<Score | null> {
        const table = scoresTableFromRelaxType(relaxType);

        const result = this.database
            .selectFrom(table)
            .selectAll()
            .where("id", "=", scoreId)
            .executeTakeFirstOrThrow();

        return result !== undefined ? result : null;
    }

    async findByScoreIdWithRank(
        scoreId: number,
        userId: number,
        beatmapMd5: string,
        mode: OsuMode,
        relaxType: RelaxType,
        sortColumn: "pp" | "score"
    ): Promise<ScoreWithRank | null> {
        const table = scoresTableFromRelaxType(relaxType);

        const result = await this.database
            .selectFrom(`${table} as s`)
            .selectAll()
            .innerJoin("users", "userid", "users.id")
            .select(({ eb, selectFrom, or, and }) => [
                selectFrom(`${table} as b`)
                    .select((_) => sql<number>`COUNT(*) + 1`.as("rank"))
                    .where("b.beatmap_md5", "=", beatmapMd5)
                    .where("b.play_mode", "=", mode)
                    .where("b.completed", "=", 3)
                    .where(
                        or([
                            sql<boolean>`${eb.ref("privileges")} & 1 > 0`,
                            eb("users.id", "=", userId),
                        ])
                    )
                    .where(
                        or([
                            sql<boolean>`b.${sortColumn} > s.${sortColumn}`,
                            and([
                                sql<boolean>`b.${eb.ref(sortColumn)} = s.${eb.ref(sortColumn)}`,
                                sql<boolean>`b.time < s.time`,
                            ]),
                        ])
                    )
                    .as("rank"),
            ])
            .where("s.id", "=", scoreId)
            .executeTakeFirst();

        return result !== undefined ? (result as ScoreWithRank) : null;
    }

    async findTop1000ScoresByUserId(
        userId: number,
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<TopScore[]> {
        const table = scoresTableFromRelaxType(relaxType);

        const scores = await this.database
            .selectFrom(table)
            .select("accuracy")
            .select("pp")
            .innerJoin(
                "beatmaps",
                `${table}.beatmap_md5`,
                "beatmaps.beatmap_md5"
            )
            .where("completed", "=", 3)
            .where("play_mode", "=", mode)
            .where("ranked", "in", [2, 3])
            .where("userid", "=", userId)
            .orderBy("pp", "desc")
            .limit(1000)
            .execute();

        return scores;
    }
}
