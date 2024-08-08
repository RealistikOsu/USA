import * as fs from "fs";
import { Redis } from "ioredis";

export interface SavedScreenshot {
    rawBody: Buffer;
}

export class ScreenshotRepository {
    constructor(private redis: Redis) {}

    async placeScreenshotLock(userId: number) {
        await this.redis.set(`usa:screenshot_lock:${userId}`, "1", "EX", 10);
    }

    async isScreenshotLocked(userId: number): Promise<boolean> {
        return (await this.redis.exists(`usa:screenshot_lock:${userId}`)) === 1;
    }

    async createFromName(name: string, format: "png" | "jpg", rawBody: Buffer) {
        const path = createScreenshotPath(name, format);
        fs.writeFileSync(path, rawBody);
    }
}

function createScreenshotPath(name: string, format: "png" | "jpg") {
    return `${process.env.PATH_TO_SCREENSHOTS}/${name}.${format}`;
}
