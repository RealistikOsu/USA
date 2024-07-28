import { usernameToUsernameSafe } from "../adapters/user";
import { User } from "../database";
import { UserRepository } from "../resources/user";
import { compare } from "bcrypt";

export interface AuthenticateRequestParameters {
    u?: string;
    h?: string;
    us?: string;
    ha?: string;
}

interface AuthenticateParameters {
    username: string;
    password: string;
}

export class AuthenticationService {
    constructor(private userRepository: UserRepository) { }

    private async canAuthenticateUser(username: string, password: string): Promise<boolean> {
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

    async authenticateUser(
        query: AuthenticateRequestParameters,
        userRepository: UserRepository
    ): Promise<User | null> {
        const possibilities = [
            { username: query.u, password: query.h },
            { username: query.us, password: query.ha },
        ]
    
        const validPossibilities = possibilities.filter(a => a.username !== undefined && a.password !== undefined);
        if (validPossibilities.length !== 1) {
            return null;
        }

        const validPossibility = validPossibilities[0] as AuthenticateParameters;
    
        const authResult = await this.canAuthenticateUser(
            validPossibility.username,
            validPossibility.password,
        )
    
        if (!authResult) {
            return null;
        }
        return await userRepository.findByUsernameSafe(usernameToUsernameSafe(validPossibility.username));
    }
}