export enum ScoreStatus {
    QUIT = 0,
    FAILED = 1,
    SUBMITTED = 2,
    BEST = 3,
}

export function calculateScoreStatusForUser(
    score: number,
    pp: number,
    failed: boolean,
    exited: boolean,
    currentScore?: number,
    currentPp?: number
): ScoreStatus {
    if (failed) {
        return ScoreStatus.FAILED;
    }

    if (exited) {
        return ScoreStatus.QUIT;
    }

    const previousScoreExists =
        currentScore !== undefined && currentPp !== undefined;

    if (previousScoreExists) {
        if (pp > currentPp || (pp === currentPp && score > currentScore)) {
            // highest pp, or spin to win
            return ScoreStatus.BEST;
        }

        // previous score was better
        return ScoreStatus.SUBMITTED;
    }

    return ScoreStatus.BEST;
}
