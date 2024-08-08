import { Logger } from "../logger";
import { ScreenshotRepository } from "../resources/screenshots";
import { ErrorOr, ServiceError } from "./_common";

const logger: Logger = new Logger({
    name: "ScreenshotService",
});

export class ScreenshotService {
    constructor(private screenshotRepository: ScreenshotRepository) {}

    async createScreenshot(
        userId: number,
        rawBody: Buffer
    ): Promise<ErrorOr<ScreenshotFileName>> {
        const fileType = determineValidFileType(rawBody);
        if (!fileType) {
            logger.info("User tried to upload an invalid file type.", {
                userId: userId,
            });
            return ServiceError.SCREENSHOT_INVALID_FILE_TYPE;
        }

        // Lock check.
        if (await this.screenshotRepository.isScreenshotLocked(userId)) {
            logger.info("User tried to upload a screenshot while locked.", {
                userId: userId,
            });
            return ServiceError.SCREENSHOT_LOCK_FAILED;
        }
        await this.screenshotRepository.placeScreenshotLock(userId);

        // Filesize check.
        if (!determineValidFileSize(rawBody)) {
            logger.info(
                "User tried to upload a screenshot that is too large.",
                {
                    userId: userId,
                    size: rawBody.length,
                }
            );
            return ServiceError.SCREENSHOT_INVALID_FILE_SIZE;
        }

        const name = generateRandomString(16);
        await this.screenshotRepository.createFromName(name, fileType, rawBody);

        logger.info("User uploaded a screenshot.", {
            userId: userId,
            name: name,
            fileType: fileType,
        });
        return {
            fileName: `${name}.${fileType}`,
        };
    }
}

interface ScreenshotFileName {
    fileName: string;
}

const PNG_SIGNATURE = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
function determineValidFileType(rawImage: Buffer): "jpg" | "png" | null {
    if (rawImage.slice(0, 8).equals(PNG_SIGNATURE)) {
        return "png";
    } else if (rawImage.slice(0, 3).equals(JPEG_SIGNATURE)) {
        return "jpg";
    } else {
        return null;
    }
}

const MINIMUM_FILE_SIZE = 67; // Smallest possible PNG file.
const MAXIMUM_FILE_SIZE = 20 * 1024 * 1024; // 20MB
function determineValidFileSize(rawImage: Buffer): boolean {
    return (
        rawImage.length >= MINIMUM_FILE_SIZE &&
        rawImage.length <= MAXIMUM_FILE_SIZE
    );
}

// TODO: Move
function generateRandomString(n: number): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < n; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }

    return result;
}
