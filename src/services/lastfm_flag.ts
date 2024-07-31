import { LastfmFlagRepository } from "../resources/lastfm_flag";

export class LastfmFlagService {
    constructor(private lastfmFlagRepository: LastfmFlagRepository) {}

    async create(userId: number, flagsEnum: number, flagsText: string) {
        const timestamp = new Date().getUTCSeconds();

        await this.lastfmFlagRepository.create({
            user_id: userId,
            flag_enum: flagsEnum,
            flag_text: flagsText,
            timestamp: timestamp,
        });
    }
}
