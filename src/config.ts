import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
    typeof v === "string" && v === "" ? undefined : v;

const EnvSchema = z.object({
    SERVER_PORT: z.coerce.number().int(),
    DATABASE_HOST: z.string().min(1),
    DATABASE_PORT: z.coerce.number().int(),
    DATABASE_USER: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    DATABASE_NAME: z.string().min(1),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int(),
    OSU_API_V2_CLIENT_ID: z.coerce.number().int(),
    OSU_API_V2_CLIENT_SECRET: z.string().min(1),
    PERFORMANCE_SERVICE_BASE_URL: z.string().min(1),
    BEATMAPS_SERVICE_BASE_URL: z.string().min(1),
    BEATMAP_DOWNLOAD_MIRROR_BASE_URL: z.string().min(1),
    PATH_TO_REPLAYS: z.string().min(1),
    PATH_TO_SCREENSHOTS: z.string().min(1),
    LOGGER_MIN_LEVEL: z.coerce.number().int(),
    SERVER_BASE_URL: z.string().min(1),
    SERVER_VERIFIED_BADGE_ID: z.coerce.number().int(),
    ADMIN_WEBHOOK_URL: z.preprocess(emptyToUndefined, z.string().optional()),
});

function loadConfig() {
    const env = EnvSchema.parse(process.env);
    return {
        serverPort: env.SERVER_PORT,
        databaseHost: env.DATABASE_HOST,
        databasePort: env.DATABASE_PORT,
        databaseUser: env.DATABASE_USER,
        databasePassword: env.DATABASE_PASSWORD,
        databaseName: env.DATABASE_NAME,
        redisHost: env.REDIS_HOST,
        redisPort: env.REDIS_PORT,
        osuApiV2ClientId: env.OSU_API_V2_CLIENT_ID,
        osuApiV2ClientSecret: env.OSU_API_V2_CLIENT_SECRET,
        performanceServiceBaseUrl: env.PERFORMANCE_SERVICE_BASE_URL,
        beatmapsServiceBaseUrl: env.BEATMAPS_SERVICE_BASE_URL,
        beatmapDownloadMirrorBaseUrl: env.BEATMAP_DOWNLOAD_MIRROR_BASE_URL,
        pathToReplays: env.PATH_TO_REPLAYS,
        pathToScreenshots: env.PATH_TO_SCREENSHOTS,
        loggerMinLevel: env.LOGGER_MIN_LEVEL,
        serverBaseUrl: env.SERVER_BASE_URL,
        serverVerifiedBadgeId: env.SERVER_VERIFIED_BADGE_ID,
        adminWebhookUrl: env.ADMIN_WEBHOOK_URL,
    };
}

export type Config = ReturnType<typeof loadConfig>;
export const config: Config = loadConfig();
