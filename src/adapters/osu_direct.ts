import { CheesegullBeatmap, CheesegullBeatmapset } from "./cheesegull";

export function osuDirectBeatmapsetFromCheesegullBeatmapset(beatmapset: CheesegullBeatmapset): string {
    const difficultySortedBeatmaps = beatmapset.beatmaps.sort((a, b) => a.difficultyRating - b.difficultyRating);
    return difficultySortedBeatmaps.map(beatmap => osuDirectBeatmapFromCheesegullBeatmap(beatmap)).join(",");
}

export function osuDirectBeatmapFromCheesegullBeatmap(beatmap: CheesegullBeatmap): string {
    return `[${beatmap.difficultyRating.toFixed(2)}⭐] ${beatmap.version} {{cs: ${beatmap.circleSize} / od: ${beatmap.overallDifficulty} / ar: ${beatmap.approachRate} / hp: ${beatmap.healthPoints}}}`
}