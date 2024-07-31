import { v2 } from "osu-api-extended";
import { response as _OsuBeatmapset } from "osu-api-extended/dist/types/v2_beatmap_set_details";

import {
    osuApiBeatmapAndSetToRippleBeatmap,
    osuApiBeatmapToRippleBeatmap,
    RIPPLE_APPROVED,
    RIPPLE_LOVED,
    RIPPLE_PENDING,
    RIPPLE_QUALIFIED,
    RIPPLE_RANKED,
} from "../adapters/beatmap";
import { Beatmap } from "../database";
import { Logger } from "../logger";
import { BeatmapRepository } from "../resources/beatmap";
import { ErrorOr, ServiceError } from "./_common";

const logger: Logger = new Logger({
    name: "BeatmapService",
});

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const NEVER = 9e15;

export interface ExtraBeatmapData {
    beatmapSetId: number;
    fileName: string;
}

interface OsuBeatmapset extends _OsuBeatmapset {
    error?: string;
}

const OSU_MAP_NOT_FOUND_RESPONSE = "Specified beatmap couldn't be found.";

export class BeatmapService {
    constructor(private beatmapRepository: BeatmapRepository) {}

    private async discoverNewBeatmapSet(
        beatmapSetId: number
    ): Promise<Beatmap[]> {
        // Beatmap set discovery
        const banchoBeatmapset: OsuBeatmapset = await v2.beatmap.set.details(
            beatmapSetId.toString()
        );
        const banchoBeatmaps = banchoBeatmapset.beatmaps;

        const existingBeatmaps =
            await this.beatmapRepository.fromBeatmapSetId(beatmapSetId);

        if (
            banchoBeatmapset.error === OSU_MAP_NOT_FOUND_RESPONSE ||
            banchoBeatmaps.length == 0
        ) {
            logger.debug(
                "Beatmap set has been unsubmitted. Deleting all child difficulties",
                {
                    beatmapSetId: beatmapSetId,
                }
            );
            await this.beatmapRepository.deleteByBeatmapSetId(beatmapSetId);
            return [];
        }

        // Check if we have any beatmaps in the database that are not in the api and delete them.
        for (const existingBeatmap of existingBeatmaps) {
            let found = false;
            for (const banchoMap of banchoBeatmaps) {
                if (existingBeatmap.beatmap_id === banchoMap.id) {
                    found = true;
                }
            }

            if (!found) {
                logger.debug(
                    "Beatmap has been unsubmitted. Deleting difficulty.",
                    {
                        beatmapId: existingBeatmap.beatmap_id,
                    }
                );
                await this.beatmapRepository.deleteByBeatmapId(
                    existingBeatmap.beatmap_id
                );
            }
        }

        for (const banchoMap of banchoBeatmaps) {
            const updatedBeatmap = osuApiBeatmapAndSetToRippleBeatmap(
                banchoBeatmapset,
                banchoMap
            );

            // Check if the old map is here.
            let oldBeatmap;
            for (const existingBeatmap of existingBeatmaps) {
                if (existingBeatmap.beatmap_id === banchoMap.id) {
                    oldBeatmap = existingBeatmap;
                    break;
                }
            }

            if (oldBeatmap !== undefined) {
                updatedBeatmap.playcount = oldBeatmap.playcount;
                updatedBeatmap.passcount = oldBeatmap.passcount;
                updatedBeatmap.rating = oldBeatmap.rating;

                if (oldBeatmap.ranked_status_freezed) {
                    updatedBeatmap.ranked_status_freezed = true;
                    updatedBeatmap.ranked = oldBeatmap.ranked;
                }
            }

            await this.beatmapRepository.createOrUpdate(updatedBeatmap);
        }

        logger.debug("Discovered new beatmap set.", {
            beatmapSetId: beatmapSetId,
        });

        return await this.beatmapRepository.fromBeatmapSetId(beatmapSetId);
    }

    private async tryUpdateBeatmap(
        beatmap: Beatmap
    ): Promise<ErrorOr<Beatmap>> {
        if (beatmap.ranked_status_freezed) {
            return beatmap;
        }

        // Check for updates.
        let requiredTimeGap = NEVER;
        const timeSinceUpdate =
            Math.floor(Date.now() / 1000) - beatmap.latest_update;

        switch (beatmap.ranked) {
            case RIPPLE_RANKED:
            case RIPPLE_LOVED:
            case RIPPLE_APPROVED:
                requiredTimeGap = ONE_DAY;
                break;
            case RIPPLE_QUALIFIED:
                requiredTimeGap = FIVE_MINUTES;
                break;
            case RIPPLE_PENDING:
                requiredTimeGap = TEN_MINUTES;
                break;
        }

        if (timeSinceUpdate < requiredTimeGap) {
            return beatmap;
        }

        logger.debug("Checking for a beatmap update from the osu!api.", {
            beatmapMd5: beatmap.beatmap_md5,
            beatmapId: beatmap.beatmap_id,
            requiredTimeGap: requiredTimeGap,
        });

        const updatedBeatmap = await this.getBeatmapFromOsuApi(
            beatmap.beatmap_id
        );

        if (updatedBeatmap === null) {
            logger.debug("Beatmap has been unsubmittied.", {
                beatmapId: beatmap.beatmap_id,
            });
            await this.beatmapRepository.deleteByBeatmapId(beatmap.beatmap_id);
            return ServiceError.BEATMAP_UNSUBMITTED;
        } else if (updatedBeatmap.beatmap_md5 !== beatmap.beatmap_md5) {
            logger.debug("Beatmap has been updated.", {
                beatmapId: beatmap.beatmap_id,
                beatmapMd5: beatmap.beatmap_md5,
                newBeatmapMd5: updatedBeatmap.beatmap_md5,
            });

            updatedBeatmap.playcount = beatmap.playcount;
            updatedBeatmap.passcount = beatmap.passcount;
            updatedBeatmap.rating = beatmap.rating;

            if (beatmap.ranked_status_freezed) {
                updatedBeatmap.ranked_status_freezed = true;
                updatedBeatmap.ranked = beatmap.ranked;
            }

            await this.beatmapRepository.createOrUpdate(updatedBeatmap);
            return ServiceError.BEATMAP_UPDATE_REQUIRED;
        }

        logger.debug("Beatmap is up-to-date.", {
            beatmapId: beatmap.beatmap_id,
        });
        return beatmap;
    }

    async findByBeatmapMd5(
        beatmapMd5: string,
        extra?: ExtraBeatmapData
    ): Promise<ErrorOr<Beatmap>> {
        let beatmap = await this.beatmapRepository.findByMd5(beatmapMd5);

        if (beatmap === null) {
            if (extra === undefined) {
                logger.debug(
                    "Fetching a single beatmap from the osu!api by checksum.",
                    {
                        beatmapMd5: beatmapMd5,
                    }
                );

                beatmap = await this.getBeatmapFromOsuApiByChecksum(beatmapMd5);

                if (beatmap === null) {
                    return ServiceError.BEATMAP_UNSUBMITTED;
                }
                await this.beatmapRepository.create(beatmap);
                return beatmap;
            } else {
                // Optimisation: Avoid osu!api calls if we have a fairly recent filename lookup.
                const fileNameBeatmap =
                    await this.beatmapRepository.fromFileName(extra.fileName);
                if (
                    fileNameBeatmap !== null &&
                    fileNameBeatmap.latest_update -
                        Math.floor(Date.now() / 1000) <
                        ONE_DAY
                ) {
                    return ServiceError.BEATMAP_UPDATE_REQUIRED;
                }

                const updatedSet = await this.discoverNewBeatmapSet(
                    extra.beatmapSetId
                );

                if (updatedSet.length === 0) {
                    return ServiceError.BEATMAP_UNSUBMITTED;
                }

                for (const banchoMap of updatedSet) {
                    if (banchoMap.beatmap_md5 === beatmapMd5) {
                        return banchoMap;
                    } else if (banchoMap.file_name === extra.fileName) {
                        return ServiceError.BEATMAP_UPDATE_REQUIRED;
                    }
                }
                return ServiceError.BEATMAP_UNSUBMITTED;
            }
        }

        return await this.tryUpdateBeatmap(beatmap);
    }

    async findByBeatmapId(
        beatmapId: number,
        extra?: ExtraBeatmapData
    ): Promise<ErrorOr<Beatmap>> {
        let beatmap = await this.beatmapRepository.findByBeatmapId(beatmapId);

        if (beatmap === null) {
            if (extra === undefined) {
                logger.debug(
                    "Fetching a single beatmap from the osu!api by beatmap ID.",
                    {
                        beatmapId: beatmapId,
                    }
                );

                beatmap = await this.getBeatmapFromOsuApi(beatmapId);

                if (beatmap === null) {
                    return ServiceError.BEATMAP_UNSUBMITTED;
                }
                await this.beatmapRepository.create(beatmap);
                return beatmap;
            } else {
                const updatedSet = await this.discoverNewBeatmapSet(
                    extra.beatmapSetId
                );

                if (updatedSet.length === 0) {
                    return ServiceError.BEATMAP_UNSUBMITTED;
                }

                for (const banchoMap of updatedSet) {
                    if (banchoMap.beatmap_id === beatmapId) {
                        return banchoMap;
                    }
                }
                return ServiceError.BEATMAP_UNSUBMITTED;
            }
        }

        return await this.tryUpdateBeatmap(beatmap);
    }

    private async getBeatmapFromOsuApi(
        beatmapId: number
    ): Promise<Beatmap | null> {
        const beatmap = await v2.beatmap.id.details(beatmapId);

        if (beatmap === null) {
            return null;
        }

        return osuApiBeatmapToRippleBeatmap(beatmap);
    }

    private async getBeatmapFromOsuApiByChecksum(
        beatmapMd5: string
    ): Promise<Beatmap | null> {
        const beatmap = await v2.beatmap.id.lookup({ checksum: beatmapMd5 });

        if (beatmap === null) {
            return null;
        }

        return osuApiBeatmapToRippleBeatmap(beatmap);
    }
}
