import { createApp } from './app';
import { configDotenv } from 'dotenv';

import { Logger, ILogObj } from "tslog";

configDotenv();

async function main() {
    const logger: Logger<ILogObj> = new Logger();
    const server = await createApp();

    server.listen({ port: parseInt(process.env.SERVER_PORT) }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    
        logger.info("USA is listening!", {
            address: address,
            port: process.env.SERVER_PORT
        })
    });
}

main();