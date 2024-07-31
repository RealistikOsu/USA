export type RelaxType = 0 | 1 | 2;
export type OsuMode = 0 | 1 | 2 | 3;
export type OsuModeString = "std" | "taiko" | "ctb" | "mania";

export function relaxTypeFromMods(mods: number) {
    if ((mods & 128) > 0) {
        // 128 = relax
        return 1;
    }

    if ((mods & 8192) > 0) {
        // 8192 = autopilot
        return 2;
    }

    return 0;
}

export function scoresTableFromRelaxType(
    relaxType: RelaxType
): "scores" | "scores_relax" | "scores_ap" {
    if (relaxType == 1) {
        return "scores_relax";
    }

    if (relaxType == 2) {
        return "scores_ap";
    }

    return "scores";
}

export function approximateRelaxTypeFromScoreId(scoreId: number): RelaxType {
    if (scoreId > 10000000) {
        return 1;
    } else if (scoreId > 20000000) {
        return 2;
    } else {
        return 0;
    }
}

export function userStatsTableFromRelaxType(
    relaxType: number
): "users_stats" | "rx_stats" | "ap_stats" {
    switch (relaxType) {
        case 1:
            return "rx_stats";
        case 2:
            return "ap_stats";
        default:
            return "users_stats";
    }
}

export function sortColumnFromRelaxType(relaxType: RelaxType): "pp" | "score" {
    if (relaxType > 0) {
        return "pp";
    }

    return "score";
}

export function modeSuffixFromMode(mode: OsuMode): OsuModeString {
    switch (mode) {
        case 1:
            return "taiko";
        case 2:
            return "ctb";
        case 3:
            return "mania";
        default:
            return "std";
    }
}

export function calculateAccuracy(
    count300s: number,
    count100s: number,
    count50s: number,
    countGekis: number,
    countKatus: number,
    countMisses: number,
    mode: OsuMode
): number {
    switch (mode) {
        case 0: {
            // osu!
            const totalHits = count300s + count100s + count50s + countMisses;

            return (
                (100.0 *
                    (count300s * 300.0 + count100s * 100.0 + count50s * 50.0)) /
                (totalHits * 300.0)
            );
        }
        case 1: {
            // taiko
            const totalHits = count300s + count100s + countMisses;
        }
    }
}
