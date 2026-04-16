// eslint-disable-next-line check-file/no-index
import tracer from "dd-trace";
tracer.init();

import { configDotenv } from "dotenv";
configDotenv();

import { createApp } from "./app";
import { config } from "./config";
import { Logger } from "./logger";

async function main() {
    const logger: Logger = new Logger();
    const server = await createApp();

    server.listen(
        {
            port: config.serverPort,
            host: "0.0.0.0",
        },
        (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            logger.info("USA is listening!", {
                address: address,
                port: config.serverPort,
            });
        }
    );
}

main();
