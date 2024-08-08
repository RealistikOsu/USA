import { modeSuffixFromMode, OsuMode, RelaxType } from "./osu";

export function redisLeaderboardForMode(
    mode: OsuMode,
    relaxType: RelaxType
): string {
    let leaderboardName: string;

    switch (relaxType) {
        case 0:
            leaderboardName = "leaderboard";
            break;
        case 1:
            leaderboardName = "leaderboard_relax";
            break;
        case 2:
            leaderboardName = "leaderboard_ap";
            break;
    }

    return `ripple:${leaderboardName}:${modeSuffixFromMode(mode)}`;
}
