import { CheesegullBeatmap, CheesegullBeatmapset } from "./cheesegull";

export function osuDirectBeatmapsetFromCheesegullBeatmapset(
  beatmapset: CheesegullBeatmapset
): string {
  const difficultySortedBeatmaps = beatmapset.beatmaps.sort(
    (a, b) => a.difficultyRating - b.difficultyRating
  );
  const formattedBeatmaps = difficultySortedBeatmaps
    .map((beatmap) => osuDirectBeatmapFromCheesegullBeatmap(beatmap))
    .join(",");

  // TODO: replace placeholder values
  return `${beatmapset.id}.osz|${beatmapset.artist}|${beatmapset.title}|${beatmapset.creator}|${beatmapset.rankedStatus}|10.0|${beatmapset.lastUpdate}|${beatmapset.id}|0|${beatmapset.hasVideo ? 1 : 0}|0|0|0|${formattedBeatmaps}`;
}

export function osuDirectBeatmapFromCheesegullBeatmap(
  beatmap: CheesegullBeatmap
): string {
  return `[${beatmap.difficultyRating.toFixed(2)}⭐] ${beatmap.version} {{cs: ${beatmap.circleSize} / od: ${beatmap.overallDifficulty} / ar: ${beatmap.approachRate} / hp: ${beatmap.healthPoints}}}`;
}

export function osuDirectBeatmapsetCardFromCheesegullBeatmapset(
  beatmapset: CheesegullBeatmapset
): string {
  return `${beatmapset.id}.osz|${beatmapset.artist}|${beatmapset.title}|${beatmapset.creator}|${beatmapset.rankedStatus}|10.0|${beatmapset.lastUpdate}|${beatmapset.id}|0|${beatmapset.hasVideo ? 1 : 0}|0|0|0`;
}
