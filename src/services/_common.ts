export enum ServiceError {
    BEATMAP_UNSUBMITTED = "beatmap.unsubmitted",
    BEATMAP_UPDATE_REQUIRED = "beatmap.update_required"
}

export type ErrorOr<T> = T | ServiceError;
