import { approximateRelaxTypeFromScoreId } from "../adapters/osu";
import { ScoreRepository } from "../resources/score";

export class ScoreService {
  constructor(private scoreRepository: ScoreRepository) {}

  async verifyScoreOwnership(
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
}
