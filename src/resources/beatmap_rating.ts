import { Kysely } from "kysely";

import { BeatmapRating, Database, NewBeatmapRating } from "../database";

export interface BeatmapRatingResult {
    rating: number;
    count: number;
}

export class BeatmapRatingRepository {
    constructor(private database: Kysely<Database>) {}

    async create(beatmapRating: NewBeatmapRating): Promise<BeatmapRating> {
        const { insertId } = await this.database
            .insertInto("beatmaps_rating")
            .values(beatmapRating)
            .executeTakeFirstOrThrow();

        const ratingId = Number(insertId);

        return {
            id: ratingId,
            ...beatmapRating,
        };
    }

    async getRating(beatmapMd5: string): Promise<BeatmapRatingResult> {
        const ratingResult = await this.database
            .selectFrom("beatmaps_rating")
            .select((eb) => eb.fn.avg<number>("rating").as("rating"))
            .select((eb) => eb.fn.count<number>("rating").as("count"))
            .where("beatmap_md5", "=", beatmapMd5)
            .executeTakeFirstOrThrow();

        return {
            rating: ratingResult.rating ?? 10,
            count: ratingResult.count ?? 0,
        };
    }

    async fromUserIdAndBeatmapMd5(
        userId: number,
        beatmapMd5: string
    ): Promise<BeatmapRating | null> {
        const rating = await this.database
            .selectFrom("beatmaps_rating")
            .where("beatmap_md5", "=", beatmapMd5)
            .where("user_id", "=", userId)
            .selectAll()
            .executeTakeFirst();

        return rating !== undefined ? rating : null;
    }
}
