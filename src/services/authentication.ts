import { usernameToUsernameSafe } from "../adapters/user";
import { UserRepository } from "../resources/user";
import { compare } from "bcrypt";

export class AuthenticationService {
    constructor(private userRepository: UserRepository) { }

    async canAuthenticateUser(username: string, password: string): Promise<boolean> {
        const user = await this.userRepository.findByUsernameSafe(usernameToUsernameSafe(username));
        if (user === null) {
            return false;
        }

        const correctPassword = await compare(password, user.password_md5);
        if (!correctPassword) {
            return false;
        }

        return true;
    }
}