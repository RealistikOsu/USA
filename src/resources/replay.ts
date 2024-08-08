import * as fs from "fs";

export interface ReplayWithoutHeaders {
    rawBody: Buffer;
}

export class ReplayRepository {
    constructor() {}

    async getFromScoreId(
        scoreId: number
    ): Promise<ReplayWithoutHeaders | null> {
        const replayPath = createReplayPath(scoreId);

        if (!fs.existsSync(replayPath)) {
            return null;
        }

        const rawBody = fs.readFileSync(replayPath);
        return { rawBody };
    }

    createFromScoreId(scoreId: number, replay: ReplayWithoutHeaders) {
        fs.writeFileSync(createReplayPath(scoreId), replay.rawBody);
    }
}

function createReplayPath(scoreId: number): string {
    return `${process.env.PATH_TO_REPLAYS}/replay_${scoreId}.osr`;
}
