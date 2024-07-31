import { OsuMode, RelaxType, sortColumnFromRelaxType } from "../adapters/osu";
import {
  FetchManyScoresParameters,
  FindByUserIdParameters,
  ScoreRepository,
  ScoreWithRankAndUsername,
} from "../resources/score";

export interface Leaderboard {
  scoreCount: number;
  scores: ScoreWithRankAndUsername[];
  personalBest: ScoreWithRankAndUsername | null;
}

export interface FetchLeaderboardParameters {
  beatmapMd5: string;
  playMode: OsuMode;
  relaxType: RelaxType;
  requesteeUserId: number;
  modsFilter?: number;
  countryFilter?: string;
  userIdsFilter?: number[];
  leaderboardSize: number;
}

export class LeaderboardService {
  constructor(private scoreRepository: ScoreRepository) {}

  async fetchByBeatmapMd5(
    params: FetchLeaderboardParameters
  ): Promise<Leaderboard> {
    const fetchManyScoresParameters: FetchManyScoresParameters = {
      beatmapMd5: params.beatmapMd5,
      playMode: params.playMode,
      requesteeUserId: params.requesteeUserId,
      relaxType: params.relaxType,
      modsFilter: params.modsFilter,
      countryFilter: params.countryFilter,
      userIdsFilter: params.userIdsFilter,
      bestScoresOnly: params.modsFilter === undefined, // mod leaderboard requires non-bests
      scoreLimit: params.leaderboardSize,
      sortColumn: sortColumnFromRelaxType(params.relaxType),
    };

    const findByUserIdParameters: FindByUserIdParameters = {
      beatmapMd5: params.beatmapMd5,
      playMode: params.playMode,
      userId: params.requesteeUserId,
      relaxType: params.relaxType,
      modsFilter: params.modsFilter,
      bestScoresOnly: params.modsFilter === undefined, // mod leaderboard requires non-bests
      sortColumn: sortColumnFromRelaxType(params.relaxType),
    };

    const scores = await this.scoreRepository.fetchManyWithRankAndUsername(
      fetchManyScoresParameters
    );
    const personalBest =
      await this.scoreRepository.findByUserIdWithRankAndUsername(
        findByUserIdParameters
      );
    const scoreCount = await this.scoreRepository.fetchScoreCount(
      fetchManyScoresParameters
    );

    return {
      scores,
      personalBest,
      scoreCount,
    };
  }
}
