import { ScoreWithRankAndUsername } from "../resources/score";
import { RelaxType } from "./osu";

export function formatLeaderboardScore(
  relaxType: RelaxType,
  score: ScoreWithRankAndUsername
): string {
  const displayedScore = relaxType > 0 ? Math.round(score.pp) : score.score;

  return `${score.id}|${score.username}|${displayedScore}|${score.max_combo}|${score["50_count"]}|${score["100_count"]}|${score["300_count"]}|${score.misses_count}|${score.katus_count}|${score.gekis_count}|${score.full_combo ? 1 : 0}|${score.mods}|${score.userid}|${score.rank}|${score.time}|1`;
}
