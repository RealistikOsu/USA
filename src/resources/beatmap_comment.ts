import { Kysely } from "kysely";

import { BeatmapComment, Database, NewBeatmapComment } from "../database";

export class BeatmapCommentRepository {
    constructor(private database: Kysely<Database>) {}

    // async create(beatmapComment: NewBeatmapComment): Promise<BeatmapComment> {
    //     const { insertId } = await this.database
    //         .insertInto("comments")
    //         .values(beatmapComment)
    //         .executeTakeFirstOrThrow();

    //     const commentId = Number(insertId);

    //     return {
    //         id: commentId,
    //         ...beatmapComment,
    //     };
    // }

    // async getComments(beatmapMd5: string): Promise<BeatmapRatingResult> {
    //     const ratingResult = await this.database
    //         .selectFrom("beatmaps_rating")
    //         .select((eb) => eb.fn.avg<number>("rating").as("rating"))
    //         .select((eb) => eb.fn.count<number>("rating").as("count"))
    //         .where("beatmap_md5", "=", beatmapMd5)
    //         .executeTakeFirstOrThrow();

    //     return {
    //         rating: ratingResult.rating,
    //         count: ratingResult.count,
    //     };
    // }
}
