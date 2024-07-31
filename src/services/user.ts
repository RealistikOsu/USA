import { getCurrentUnixTimestamp } from "../adapters/datetime";
import { UserRepository } from "../resources/user";

export class UserService {
    constructor(private userRepository: UserRepository) { }

    async updateLatestActivityToCurrentTime(userId: number) {
        await this.userRepository.updateUserById(userId, {
            latest_activity: getCurrentUnixTimestamp(),
        });
    }
}