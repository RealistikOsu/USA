// eslint-disable-next-line check-file/no-index
import { configDotenv } from "dotenv";
configDotenv();

import { createApp } from "./app";
import { Logger } from "./logger";

async function main() {
    const logger: Logger = new Logger();
    const server = await createApp();

    server.listen(
        { port: parseInt(process.env.SERVER_PORT) },
        (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            logger.info("USA is listening!", {
                address: address,
                port: process.env.SERVER_PORT,
            });
        }
    );
}

main();
