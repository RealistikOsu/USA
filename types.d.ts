declare namespace NodeJS {
    interface ProcessEnv {
        readonly SERVER_PORT: string;

        readonly DATABASE_HOST: string;
        readonly DATABASE_PORT: string;
        readonly DATABASE_USER: string;
        readonly DATABASE_PASSWORD: string;
        readonly DATABASE_NAME: string;
    }
}