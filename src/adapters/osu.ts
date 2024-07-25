export type RelaxType = 0 | 1 | 2;
export type OsuMode = 0 | 1 | 2 | 3;

export function relaxTypeFromMods(mods: number) {
    if ((mods & 128) > 0) { // 128 = relax
        return 1;
    }

    if ((mods & 8192) > 0) { // 8192 = autopilot
        return 2;
    }

    return 0;
}

export function scoresTableFromRelaxType(relaxType: RelaxType): "scores" | "scores_relax" | "scores_ap" {
    if (relaxType == 1) {
        return "scores_relax";
    }

    if (relaxType == 2) {
        return "scores_ap";
    }

    return "scores";
}

export function sortColumnFromRelaxType(relaxType: RelaxType): "pp" | "score" {
    if (relaxType > 0) {
        return "pp";
    }

    return "score";
}