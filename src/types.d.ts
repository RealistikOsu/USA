declare namespace NodeJS {
    interface ProcessEnv {
        readonly SERVER_PORT: string;

        readonly DATABASE_HOST: string;
        readonly DATABASE_PORT: string;
        readonly DATABASE_USER: string;
        readonly DATABASE_PASSWORD: string;
        readonly DATABASE_NAME: string;

        readonly OSU_API_V2_CLIENT_ID: string;
        readonly OSU_API_V2_CLIENT_SECRET: string;

        readonly PERFORMANCE_SERVICE_BASE_URL: string;
        readonly BEATMAPS_SERVICE_BASE_URL: string;
        readonly BEATMAP_DOWNLOAD_MIRROR_BASE_URL: string;

        readonly PATH_TO_REPLAYS: string;
        readonly PATH_TO_SCREENSHOTS: string;

        readonly LOGGER_MIN_LEVEL: string;
    }
}
