import { Logger as TSLogger, ILogObj, ISettingsParam } from "tslog";


export class Logger extends TSLogger<ILogObj> {
    constructor(settings?: ISettingsParam<ILogObj>) {
        super({
            minLevel: parseInt(process.env.LOGGER_MIN_LEVEL),
            ...settings,
        })
    }
}
