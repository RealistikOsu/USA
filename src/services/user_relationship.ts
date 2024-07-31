import { UserRelationshipRepository } from "../resources/user_relationship";

export class UserRelationshipService {
    constructor(
        private userRelationshipRepository: UserRelationshipRepository
    ) {}

    async getOwnFriendsList(userId: number): Promise<number[]> {
        const friendsList =
            await this.userRelationshipRepository.fetchManyByUserId(userId);

        return friendsList.map((friend) => friend.user2);
    }
}
