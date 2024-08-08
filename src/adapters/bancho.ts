import { Redis } from "ioredis";

export async function sendBanchoMessage(
    channel: string,
    content: string,
    redis: Redis
) {
    const message = JSON.stringify({ to: channel, message: content });
    await redis.publish("peppy:bot_msg", message);
}
