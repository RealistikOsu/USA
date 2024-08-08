export enum ServiceError {
    BEATMAP_UNSUBMITTED = "beatmap.unsubmitted",
    BEATMAP_UPDATE_REQUIRED = "beatmap.update_required",

    REPLAY_NOT_FOUND = "replay.not_found",

    SCORE_NOT_FOUND = "score.not_found",

    USER_NOT_FOUND = "user.not_found",

    ALREADY_FAVOURITED = "already_favourited",

    SCREENSHOT_INVALID_FILE_TYPE = "screenshot.invalid_file_type",
    SCREENSHOT_LOCK_FAILED = "screenshot.lock_failed",
    SCREENSHOT_INVALID_FILE_SIZE = "screenshot.invalid_file_size",
}

export type ErrorOr<T> = T | ServiceError;
