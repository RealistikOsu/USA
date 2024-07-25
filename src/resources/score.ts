import { OsuMode, RelaxType, scoresTableFromRelaxType } from "../adapters/osu";
import { Database, NewScore, Score } from "../database";
import { Kysely, sql } from "kysely";

export interface ScoreWithRankAndUsername extends Score {
    rank: number;
    username: string;
}

export interface FetchManyScoresParameters {
    beatmapMd5: string;
    playMode: number;
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
    playMode: number;
    relaxType: RelaxType;
    userId: number;
    modsFilter?: number;
    bestScoresOnly: boolean;
    sortColumn: "pp" | "score";
}

export class ScoreRepository {
    constructor(private database: Kysely<Database>) {}

    async create(score: NewScore, relaxType: RelaxType): Promise<Score> {
        const table = scoresTableFromRelaxType(relaxType);

        const { insertId } = await this.database.insertInto(table)
            .values(score)
            .executeTakeFirstOrThrow();

        const scoreId = Number(insertId);

        return {
            id: scoreId,
            ...score,
        };
    }

    async findByUserIdWithRankAndUsername(params: FindByUserIdParameters): Promise<ScoreWithRankAndUsername | null> {
        const table = scoresTableFromRelaxType(params.relaxType);

        const score = await this.database.with('ranked_scores', (database) => {
            let cteQuery = database.selectFrom(table)
                .innerJoin('users', 'users.id', `${table}.userid`)
                .innerJoin('user_clans', 'user_clans.user', 'userid')
                .innerJoin('clans', 'clans.id', 'user_clans.clan')
                .selectAll(table)
                .select((eb) =>
                    sql<number>`row_number() OVER (PARTITION BY ${eb.ref('userid')}
                        ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref('time')} ASC)`
                    .as('score_order_rank'))
                .select('clans.tag')
                .select('users.username as users_username')
                .where('beatmap_md5', '=', params.beatmapMd5)
                .where('play_mode', '=', params.playMode)
                .where((eb) => eb.or([
                    sql<boolean>`${eb.ref('privileges')} & 1 > 0`,
                    eb('userid', '=', params.userId),
                ]));

            if (params.bestScoresOnly) {
                cteQuery = cteQuery.where('completed', '=', 3);
            } else {
                cteQuery = cteQuery.where('completed', 'in', [2, 3]);
            }

            if (params.modsFilter !== undefined) {
                cteQuery = cteQuery.where('mods', '=', params.modsFilter);
            }

            return cteQuery;
        })
        .with('a', (database) => {
            return database.selectFrom('ranked_scores')
                .selectAll()
                .select((eb) =>
                    sql<number>`row_number() OVER (ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref('time')} ASC)`
                    .as('rank'))
                .where('score_order_rank', '=', 1);
        })
        .selectFrom('a')
        .selectAll('a')
        .select('users_username as username')
        .where('userid', '=', params.userId)
        .orderBy(params.sortColumn, 'desc')
        .orderBy('time', 'asc')
        .limit(1)
        .executeTakeFirst();

        return score !== undefined ? score : null;
    }

    async fetchManyWithRankAndUsername(params: FetchManyScoresParameters): Promise<ScoreWithRankAndUsername[]> {
        const table = scoresTableFromRelaxType(params.relaxType);

        const scores = await this.database.with('ranked_scores', (database) => {
            let cteQuery = database.selectFrom(table)
                .innerJoin('users', 'users.id', `${table}.userid`)
                .innerJoin('user_clans', 'user_clans.user', 'userid')
                .innerJoin('clans', 'clans.id', 'user_clans.clan')
                .selectAll(table)
                .select((eb) =>
                    sql<number>`row_number() OVER (PARTITION BY ${eb.ref('userid')}
                        ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref('time')} ASC)`
                    .as('score_order_rank'))
                .select('clans.tag')
                .select('users.username as users_username')
                .where('beatmap_md5', '=', params.beatmapMd5)
                .where('play_mode', '=', params.playMode)
                .where((eb) => eb.or([
                    sql<boolean>`${eb.ref('privileges')} & 1 > 0`,
                    eb('userid', '=', params.requesteeUserId),
                ]));

            if (params.bestScoresOnly) {
                cteQuery = cteQuery.where('completed', '=', 3);
            } else {
                cteQuery = cteQuery.where('completed', 'in', [2, 3]);
            }

            if (params.modsFilter !== undefined) {
                cteQuery = cteQuery.where('mods', '=', params.modsFilter);
            }

            if (params.countryFilter !== undefined) {
                cteQuery = cteQuery.where('country', '=', params.countryFilter);
            }

            if (params.userIdsFilter !== undefined) {
                cteQuery = cteQuery.where('userid', 'in', params.userIdsFilter);
            }

            return cteQuery;
        })
        .with('a', (database) => {
            return database.selectFrom('ranked_scores')
                .selectAll()
                .select((eb) =>
                    sql<number>`row_number() OVER (ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref('time')} ASC)`
                    .as('rank'))
                .where('score_order_rank', '=', 1);
        })
        .selectFrom('a')
        .selectAll('a')
        .select((eb) =>
            sql<string>`
            CONCAT(
                IF(
                    ${eb.ref('tag')} IS NOT NULL AND ${eb.ref('userid')} != ${params.requesteeUserId},
                    CONCAT("[", ${eb.ref('tag')}, "] "),
                    ""
                ),
                ${eb.ref('users_username')}
            )`.as('username'))
        .orderBy(params.sortColumn, 'desc')
        .orderBy('time', 'asc')
        .limit(params.scoreLimit)
        .execute();

        return scores;
    }

    async fetchScoreCount(params: FetchManyScoresParameters): Promise<number> {
        const table = scoresTableFromRelaxType(params.relaxType);

        const scoreCountResult = await this.database.with('ranked_scores', (database) => {
            let cteQuery = database.selectFrom(table)
                .innerJoin('users', 'users.id', `${table}.userid`)
                .innerJoin('user_clans', 'user_clans.user', 'userid')
                .innerJoin('clans', 'clans.id', 'user_clans.clan')
                .selectAll(table)
                .select((eb) =>
                    sql<number>`row_number() OVER (PARTITION BY ${eb.ref('userid')}
                        ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref('time')} ASC)`
                    .as('score_order_rank'))
                .select('clans.tag')
                .select('users.username as users_username')
                .where('beatmap_md5', '=', params.beatmapMd5)
                .where('play_mode', '=', params.playMode)
                .where((eb) => eb.or([
                    sql<boolean>`${eb.ref('privileges')} & 1 > 0`,
                    eb('userid', '=', params.requesteeUserId),
                ]));

            if (params.bestScoresOnly) {
                cteQuery = cteQuery.where('completed', '=', 3);
            } else {
                cteQuery = cteQuery.where('completed', 'in', [2, 3]);
            }

            if (params.modsFilter !== undefined) {
                cteQuery = cteQuery.where('mods', '=', params.modsFilter);
            }

            if (params.countryFilter !== undefined) {
                cteQuery = cteQuery.where('country', '=', params.countryFilter);
            }

            if (params.userIdsFilter !== undefined) {
                cteQuery = cteQuery.where('userid', 'in', params.userIdsFilter);
            }

            return cteQuery;
        })
        .with('a', (database) => {
            return database.selectFrom('ranked_scores')
                .selectAll()
                .select((eb) =>
                    sql<number>`row_number() OVER (ORDER BY ${eb.ref(params.sortColumn)} DESC, ${eb.ref('time')} ASC)`
                    .as('rank'))
                .where('score_order_rank', '=', 1);
        })
        .selectFrom('a')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow();

        return scoreCountResult.count as number;
    }
}
