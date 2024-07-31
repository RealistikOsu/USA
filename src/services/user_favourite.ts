import { UserFavouriteRepository } from "../resources/user_favourite";
import { ErrorOr, ServiceError } from "./_common";

export class UserFavouriteService {
    constructor(private userFavouriteRepository: UserFavouriteRepository) {}

    async addNewFavourite(
        userId: number,
        beatmapSetId: number
    ): Promise<ErrorOr<void>> {
        if (
            await this.userFavouriteRepository.fromUserIdAndBeatmapSetId(
                userId,
                beatmapSetId
            )
        ) {
            return ServiceError.ALREADY_FAVOURITED;
        }
        await this.userFavouriteRepository.createFavourite(
            userId,
            beatmapSetId
        );
    }

    async getFavouriteSets(userId: number): Promise<number[]> {
        return (await this.userFavouriteRepository.fromUserId(userId)).map(
            (favourite) => favourite.beatmapset_id
        );
    }
}
