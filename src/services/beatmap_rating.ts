import { BeatmapRatingRepository } from '../resources/beatmap_rating';
import { BeatmapRepository } from '../resources/beatmap';
import { BeatmapRating } from '../database';

export interface BeatmapRatingCastResult {
    rating: number;
    ownRating: BeatmapRating | null;
}

export class BeatmapRatingService {
    constructor(
        private beatmapRatingRepository: BeatmapRatingRepository,
        private beatmapRepository: BeatmapRepository,
    ) {}


    // Raiting being set to null is just for querying your existing rating.
    async castRating(userId: number, beatmapMd5: string, rating: number | null = null): Promise<BeatmapRatingCastResult> {
        const ownRating = await this.beatmapRatingRepository.fromUserIdAndBeatmapMd5(
            userId,
            beatmapMd5,
        )

        if (rating !== null && ownRating === null) {
            await this.beatmapRatingRepository.create(
                {
                    user_id: userId,
                    rating: rating,
                    beatmap_md5: beatmapMd5,
                }
            )
        }

        const newResult = await this.beatmapRatingRepository.getRating(beatmapMd5)

        await this.beatmapRepository.updateByBeatmapMd5(beatmapMd5, {
            rating: newResult.rating,
        })

        return {
            rating: newResult.rating,
            ownRating: ownRating,
        };
    }
}
