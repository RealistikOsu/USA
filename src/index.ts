import { createApp } from './app';
import { configDotenv } from 'dotenv';

configDotenv();

async function main() {
    const server = await createApp();

    server.listen({ port: parseInt(process.env.SERVER_PORT) }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    
        console.log(`Server listening at ${address}`);
    });
}

main();