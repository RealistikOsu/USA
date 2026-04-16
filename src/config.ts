export interface Config {
    serverPort: number;
    databaseHost: string;
    databasePort: number;
    databaseUser: string;
    databasePassword: string;
    databaseName: string;
    redisHost: string;
    redisPort: number;
    osuApiV2ClientId: number;
    osuApiV2ClientSecret: string;
    performanceServiceBaseUrl: string;
    beatmapsServiceBaseUrl: string;
    beatmapDownloadMirrorBaseUrl: string;
    pathToReplays: string;
    pathToScreenshots: string;
    loggerMinLevel: number;
    serverBaseUrl: string;
    serverVerifiedBadgeId: number;
    adminWebhookUrl: string | undefined;
}

function requireString(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === "") {
        throw new Error(`required env var ${name} is not set`);
    }
    return value;
}

function requireInt(name: string): number {
    const raw = requireString(name);
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`env var ${name} is not a valid integer: ${raw}`);
    }
    return parsed;
}

function optionalString(name: string): string | undefined {
    const value = process.env[name];
    if (value === undefined || value === "") {
        return undefined;
    }
    return value;
}

function loadConfig(): Config {
    return {
        serverPort: requireInt("SERVER_PORT"),
        databaseHost: requireString("DATABASE_HOST"),
        databasePort: requireInt("DATABASE_PORT"),
        databaseUser: requireString("DATABASE_USER"),
        databasePassword: requireString("DATABASE_PASSWORD"),
        databaseName: requireString("DATABASE_NAME"),
        redisHost: requireString("REDIS_HOST"),
        redisPort: requireInt("REDIS_PORT"),
        osuApiV2ClientId: requireInt("OSU_API_V2_CLIENT_ID"),
        osuApiV2ClientSecret: requireString("OSU_API_V2_CLIENT_SECRET"),
        performanceServiceBaseUrl: requireString(
            "PERFORMANCE_SERVICE_BASE_URL"
        ),
        beatmapsServiceBaseUrl: requireString("BEATMAPS_SERVICE_BASE_URL"),
        beatmapDownloadMirrorBaseUrl: requireString(
            "BEATMAP_DOWNLOAD_MIRROR_BASE_URL"
        ),
        pathToReplays: requireString("PATH_TO_REPLAYS"),
        pathToScreenshots: requireString("PATH_TO_SCREENSHOTS"),
        loggerMinLevel: requireInt("LOGGER_MIN_LEVEL"),
        serverBaseUrl: requireString("SERVER_BASE_URL"),
        serverVerifiedBadgeId: requireInt("SERVER_VERIFIED_BADGE_ID"),
        adminWebhookUrl: optionalString("ADMIN_WEBHOOK_URL"),
    };
}

export const config: Config = loadConfig();
