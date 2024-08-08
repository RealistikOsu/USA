import { Embed, Webhook } from "@vermaysha/discord-webhook";
import { Redis } from "ioredis";

import { getCurrentUnixTimestamp } from "../adapters/datetime";
import { assertNotNull } from "../asserts";
import { User } from "../database";
import { Logger } from "../logger";
import { BanLogRepository } from "../resources/ban_log";
import { UserRepository } from "../resources/user";
import { ServiceError } from "./_common";

// TODO: not this
const USER_PUBLIC_PRIVILEGE = 1;

const BOT_USER_ID = 999;

const logger = new Logger({
    name: "UserService",
});

const EDIT_COLOUR = "4360181";
const EDIT_ICON_URL =
    "https://cdn3.iconfinder.com/data/icons/bold-blue-glyphs-free-samples/32/Info_Circle_Symbol_Information_Letter-512.png";

export class UserService {
    constructor(
        private userRepository: UserRepository,
        private banLogRepository: BanLogRepository,
        private redis: Redis
    ) {}

    async updateLatestActivityToCurrentTime(userId: number) {
        await this.userRepository.updateUserById(userId, {
            latest_activity: getCurrentUnixTimestamp(),
        });
    }

    async restrict(userId: number, summary: string, detail: string) {
        const user = await this.userRepository.findById(userId);
        if (user === null) {
            return ServiceError.USER_NOT_FOUND;
        }

        // don't restrict if they're already restricted
        if ((user.privileges & USER_PUBLIC_PRIVILEGE) === 0) {
            return;
        }

        await this.userRepository.updateUserById(userId, {
            privileges: user.privileges & ~USER_PUBLIC_PRIVILEGE,
            ban_datetime: new Date(),
            ban_reason: summary,
        });

        await this.banLogRepository.create({
            from_id: BOT_USER_ID,
            to_id: user.id,
            summary,
            detail: `USA Autobahn: ${detail}`,
        });

        await this.redis.publish("peppy:ban", user.id.toString());

        await this.removeFromLeaderboards(user.id, user.country);
        await this.sendRestrictedWebhook(user, summary);

        logger.info(
            `${user.username} (${user.id}) has been restricted for ${summary}`
        );
    }

    async userIsRestricted(userId: number): Promise<boolean> {
        const user = await this.userRepository.findById(userId);
        assertNotNull(user);

        return (user.privileges & USER_PUBLIC_PRIVILEGE) === 0;
    }

    private async sendRestrictedWebhook(user: User, reason: string) {
        if (!process.env.ADMIN_WEBHOOK_URL) {
            return;
        }

        const webhook = new Webhook(process.env.ADMIN_WEBHOOK_URL);
        const embed = new Embed();

        embed.setTitle("User Edited!");
        embed.setColor(EDIT_COLOUR);
        embed.setDescription(
            `${user.username} (${user.id}) has just been restricted for ${reason}!`
        );
        embed.setAuthor({ name: "USA Score Server", icon_url: EDIT_ICON_URL });
        embed.setFooter({
            text: "This is an automated action performed by the server.",
        });

        webhook.addEmbed(embed);
        await webhook.send();
    }

    private async removeFromLeaderboards(userId: number, country: string) {
        for (const mode of ["std", "taiko", "ctb", "mania"]) {
            // TODO: less unchecked strings here
            await this.redis.zrem(`ripple:leaderboard:${mode}`, userId);
            await this.redis.zrem(`ripple:leaderboard_relax:${mode}`, userId);
            await this.redis.zrem(`ripple:leaderboard_ap:${mode}`, userId);

            await this.redis.zrem(
                `ripple:leaderboard:${mode}:${country}`,
                userId
            );
            await this.redis.zrem(
                `ripple:leaderboard_relax:${mode}:${country}`,
                userId
            );
            await this.redis.zrem(
                `ripple:leaderboard_ap:${mode}:${country}`,
                userId
            );
        }
    }
}
