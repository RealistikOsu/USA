import * as fs from "fs";

import { config } from "../config";

export interface ReplayWithoutHeaders {
    rawBody: Buffer;
}

export class ReplayRepository {
    constructor() {}

    async getFromScoreId(
        scoreId: number
    ): Promise<ReplayWithoutHeaders | null> {
        const replayPath = createReplayPath(scoreId);

        try {
            await fs.promises.access(replayPath);
        } catch {
            return null;
        }

        const rawBody = await fs.promises.readFile(replayPath);
        return { rawBody };
    }

    async createFromScoreId(scoreId: number, replay: ReplayWithoutHeaders) {
        await fs.promises.writeFile(
            createReplayPath(scoreId),
            new Uint8Array(replay.rawBody)
        );
    }
}

function createReplayPath(scoreId: number): string {
    return `${config.pathToReplays}/replay_${scoreId}.osr`;
}
