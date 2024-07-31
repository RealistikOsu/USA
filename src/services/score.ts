import { approximateRelaxTypeFromScoreId, OsuMode, RelaxType } from "../adapters/osu";
import { ScoreStatus } from "../adapters/score";
import { NewScore, Score } from "../database";
import { ScoreRepository } from "../resources/score";

export class ScoreService {
    constructor(private scoreRepository: ScoreRepository) {}

    async scoreBelongsToUser(
        scoreId: number,
        userId: number
    ): Promise<boolean> {
        const approximateRelaxType = approximateRelaxTypeFromScoreId(scoreId);
        const score = await this.scoreRepository.fromScoreId(
            scoreId,
            approximateRelaxType
        );
        if (score === null) {
            return false;
        }

        return score.userid === userId;
    }

    async findBestByUserIdAndBeatmapMd5(userId: number, beatmapMd5: string, mode: OsuMode, relaxType: RelaxType): Promise<Score | null> {
        const score = await this.scoreRepository.findBestByUserIdAndBeatmapMd5(userId, beatmapMd5, mode, relaxType);
        return score;
    }

    async create(score: NewScore, relaxType: RelaxType): Promise<Score> {
        const createdScore = await this.scoreRepository.create(score, relaxType);
        return createdScore;
    }

    async updateScoreStatusToSubmitted(scoreId: number, relaxType: RelaxType) {
        await this.scoreRepository.update(
            scoreId,
            { completed: ScoreStatus.SUBMITTED },
            relaxType,
        );
    }
}
