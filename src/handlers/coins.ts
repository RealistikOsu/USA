import { FastifyRequest } from "fastify";

import { Logger } from "../logger";
import { AuthenticateRequestParameters, AuthenticationService } from "../services/authentication";
import { UserService } from "../services/user";

const logger: Logger = new Logger({
    name: "OsuCoinsHandler",
});

interface UserCoinsParameters extends AuthenticateRequestParameters {
    action: "check" | "use" | "recharge" | "earn";
    // count
    c: number;
    // checksum (username + count + osuycoins)
    cs: string;
}

export const getUserCoins = async (
    request: FastifyRequest<{ Querystring: UserCoinsParameters }>,
): Promise<number> => {
    // i need me them typehints or i kms
    const userService: UserService = request.requestContext.get("userService")!;
    const authenticationService: AuthenticationService = request.requestContext.get(
        "authenticationService"
    )!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );

    if (user === null) {
        return 0;
    }

    if (request.query.action === "check") {
        return user.coins;
    }

    if (request.query.action === "use") {
        // inshallah we shall not trust the client
        let newCoins = Math.max(0, user.coins - 1);

        await userService.updateUserCoins(user.id, newCoins);
        return newCoins;
    }

    if (request.query.action === "recharge") {
        let newCoins = Math.min(100, user.coins + 10);

        await userService.updateUserCoins(user.id, newCoins);
    }


    // inshallah we shall not trust the client
    // should we cap this? idk
    let newCoins = user.coins + 1;
    await userService.updateUserCoins(user.id, newCoins);

    return newCoins;
};
