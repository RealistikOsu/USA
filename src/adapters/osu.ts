import { assertNever } from "../asserts";
import { config } from "../config";
import { Beatmap, User } from "../database";

export type RelaxType = 0 | 1 | 2;
export type OsuMode = 0 | 1 | 2 | 3;
export type OsuModeString = "std" | "taiko" | "ctb" | "mania";
export type ScoreSortColumn = "pp" | "score";

export function createOsuBeatmapEmbed(beatmap: Beatmap) {
    const url = `${config.serverBaseUrl}/beatmaps/${beatmap.beatmap_id}`;
    return `[${url} ${beatmap.song_name}]`;
}

export function createOsuUserEmbed(user: User) {
    const url = `${config.serverBaseUrl}/users/${user.id}`;
    return `[${url} ${user.username}]`;
}

export function formatRelaxType(relaxType: RelaxType): "VN" | "RX" | "AP" {
    if (relaxType === 0) {
        return "VN";
    } else if (relaxType === 1) {
        return "RX";
    } else if (relaxType === 2) {
        return "AP";
    }
    return assertNever(relaxType);
}

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
    if (relaxType === 1) {
        return "scores_relax";
    }

    if (relaxType === 2) {
        return "scores_ap";
    }

    return "scores";
}

export const RELAX_OFFSET = 1073741823;
export const AP_OFFSET = 2000000000;

export function approximateRelaxTypeFromScoreId(scoreId: number): RelaxType {
    if (scoreId >= AP_OFFSET) {
        return 2;
    } else if (scoreId > RELAX_OFFSET) {
        return 1;
    } else {
        return 0;
    }
}

export function userStatsTableFromRelaxType(
    relaxType: RelaxType
): "users_stats" | "rx_stats" | "ap_stats" {
    switch (relaxType) {
        case 1:
            return "rx_stats";
        case 2:
            return "ap_stats";
        case 0:
            return "users_stats";
        default:
            return assertNever(relaxType);
    }
}

export function sortColumnFromRelaxType(relaxType: RelaxType): ScoreSortColumn {
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

            return (100.0 * (count100s * 0.5 + count300s)) / totalHits;
        }
        case 2: {
            // catch
            const totalHits =
                count300s + count100s + count50s + countKatus + countMisses;

            return (100.0 * (count300s + count100s + count50s)) / totalHits;
        }
        case 3: {
            // mania
            const totalHits =
                count300s +
                count100s +
                count50s +
                countGekis +
                countKatus +
                countMisses;

            return (
                (100.0 *
                    (count50s * 50.0 +
                        count100s * 100.0 +
                        countKatus * 200.0 +
                        (count300s + countGekis) * 300)) /
                (totalHits * 300.0)
            );
        }
        default:
            return assertNever(mode);
    }
}
