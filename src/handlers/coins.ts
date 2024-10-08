import { FastifyRequest } from "fastify";

import { Logger } from "../logger";
import { AuthenticateRequestParameters } from "../services/authentication";

const logger: Logger = new Logger({
    name: "OsuCoinsHandler",
});

interface UserCoinsParameters extends AuthenticateRequestParameters {
    // check | use | recharge | earn
    action: string;
    // count
    c: string;
    // checksum (username + count + osuycoins)
    cs: string;
}

export const getUserCoins = async (
    request: FastifyRequest<{ Querystring: UserCoinsParameters }>,
): Promise<number> => {
    const userService = request.requestContext.get("userService")!;
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );

    if (user === null) {
        return 0;
    }

    if (request.query.action === "earn") {
        // inshallah we shall not trust the client
        // should we cap this? idk
        let newCoins = user.coins + 1;

        if (parseInt(request.query.c) !== newCoins) {
            logger.warn(
                `Mismatched coin count for user ${user.username} (${user.id})`
            );
            return user.coins;
        }

        await userService.updateUserCoins(user.id, newCoins);

        return newCoins;
    } else if (request.query.action === "use") {
        // inshallah we shall not trust the client
        let newCoins = Math.max(0, user.coins - 1);

        await userService.updateUserCoins(user.id, newCoins);
        return newCoins;
    } else if (request.query.action === "recharge") {
        let newCoins = Math.min(100, user.coins + 10);

        await userService.updateUserCoins(user.id, newCoins);
    }

    return user.coins;
};
