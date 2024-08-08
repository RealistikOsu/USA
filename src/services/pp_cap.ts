import { OsuMode, RelaxType } from "../adapters/osu";
import { PpLimitRepository } from "../resources/pp_limit";

// TODO: not this
const FLASHLIGHT = 1 << 10;

export class PpCapService {
    constructor(private ppLimitRepository: PpLimitRepository) {}

    async ppExceedsPpCap(
        pp: number,
        mode: OsuMode,
        relaxType: RelaxType,
        mods: number
    ): Promise<boolean> {
        const ppLimit = await this.ppLimitRepository.getByModeAndRelaxType(
            mode,
            relaxType
        );

        let ppCap: number;
        if ((mods & FLASHLIGHT) > 0) {
            ppCap = ppLimit.flashlight_pp;
        } else {
            ppCap = ppLimit.pp;
        }

        return pp > ppCap;
    }
}
