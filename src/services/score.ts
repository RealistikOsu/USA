import {
    approximateRelaxTypeFromScoreId,
    OsuMode,
    RelaxType,
    sortColumnFromRelaxType,
} from "../adapters/osu";
import { ScoreStatus } from "../adapters/score";
import { assertNotNull } from "../asserts";
import { NewScore, Score } from "../database";
import {
    ScoreRepository,
    ScoreWithRankAndUsername,
    TopScore,
} from "../resources/score";

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

    async findBestByUserIdAndBeatmapMd5(
        userId: number,
        beatmapMd5: string,
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<Score | null> {
        const score = await this.scoreRepository.findBestByUserIdAndBeatmapMd5(
            userId,
            beatmapMd5,
            mode,
            relaxType
        );
        return score;
    }

    async create(score: NewScore, relaxType: RelaxType): Promise<Score> {
        const createdScore = await this.scoreRepository.create(
            score,
            relaxType
        );
        return createdScore;
    }

    async updateScoreStatusToSubmitted(scoreId: number, relaxType: RelaxType) {
        await this.scoreRepository.update(
            scoreId,
            { completed: ScoreStatus.SUBMITTED },
            relaxType
        );
    }

    async findBestByUserIdAndBeatmapMd5WithRankAndUsername(
        userId: number,
        beatmapMd5: string,
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<ScoreWithRankAndUsername | null> {
        const score =
            await this.scoreRepository.findByUserIdWithRankAndUsername({
                userId,
                beatmapMd5,
                playMode: mode,
                relaxType,
                bestScoresOnly: true,
                sortColumn: sortColumnFromRelaxType(relaxType),
            });

        return score;
    }

    async findScoreRank(
        scoreId: number,
        userId: number,
        beatmapMd5: string,
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<number> {
        const score = await this.scoreRepository.findByScoreIdWithRank(
            scoreId,
            userId,
            beatmapMd5,
            mode,
            relaxType,
            sortColumnFromRelaxType(relaxType)
        );
        assertNotNull(score);

        return score.rank;
    }

    async findTop1000ScoresByUserId(
        userId: number,
        mode: OsuMode,
        relaxType: RelaxType
    ): Promise<TopScore[]> {
        const scores = await this.scoreRepository.findTop1000ScoresByUserId(
            userId,
            mode,
            relaxType
        );
        return scores;
    }

    async identicalScoreExists(
        userId: number,
        beatmapMd5: string,
        score: number,
        mode: OsuMode,
        mods: number,
        relaxType: RelaxType
    ): Promise<boolean> {
        return await this.scoreRepository.identicalScoreExists(
            userId,
            beatmapMd5,
            score,
            mode,
            mods,
            relaxType
        );
    }
}
