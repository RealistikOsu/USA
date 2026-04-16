import { ILogObj, ISettingsParam, Logger as TSLogger } from "tslog";

import { config } from "./config";

export class Logger extends TSLogger<ILogObj> {
    constructor(settings?: ISettingsParam<ILogObj>) {
        super({
            minLevel: config.loggerMinLevel,
            ...settings,
        });
    }
}
