import { Redis } from "ioredis";

export async function notifyApiOfNewScore(scoreId: number, redis: Redis) {
    await redis.publish("api:score_submission", scoreId.toString());
}
