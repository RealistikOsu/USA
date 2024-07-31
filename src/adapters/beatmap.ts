import { response as OsuBeatmap } from "osu-api-extended/dist/types/v2_beatmap_id_details";
import { response as OsuBeatmapset } from "osu-api-extended/dist/types/v2_beatmap_set_details";

import { Beatmap } from "../database";

export function formatLeaderboardBeatmap(
  beatmap: Beatmap,
  scoreCount: number,
  rating: number
): string {
  return `${beatmap.ranked}|false|${beatmap.beatmap_id}|${beatmap.beatmapset_id}|${scoreCount}|0|\n0\n${beatmap.song_name}\n${rating.toFixed(1)}`;
}

export function osuApiStatusFromDirectStatus(status: number): number {
  switch (status) {
    case 0: // ranked
      return 1;
    case 2: // pending
      return 0;
    case 3: // qualified
      return 3;
    case 5: // graveyard
      return 0;
    case 7: // ranked (played)
      return 1;
    case 8: // loved
      return 4;
    default:
      throw new Error(`Invalid direct status ${status}`);
  }
}

export const RIPPLE_UNSUBMITTED = -1;
export const RIPPLE_PENDING = 0;
export const RIPPLE_UPDATE_AVAILABLE = 1;
export const RIPPLE_RANKED = 2;
export const RIPPLE_APPROVED = 3;
export const RIPPLE_QUALIFIED = 4;
export const RIPPLE_LOVED = 5;

export type RippleStatus = -1 | 0 | 1 | 2 | 3 | 4 | 5;

export const OSU_API_PENDING = 0;
export const OSU_API_RANKED = 1;
export const OSU_API_APPROVED = 2;
export const OSU_API_QUALIFIED = 3;
export const OSU_API_LOVED = 4;

export type OsuApiStatus = 0 | 1 | 2 | 3 | 4;

export function hasLeaderboard(beatmap: Beatmap): boolean {
  return beatmap.ranked >= RIPPLE_RANKED;
}

export function osuApiStatusAsRippleStatus(status: number): RippleStatus {
  switch (status) {
    case OSU_API_RANKED:
      return RIPPLE_RANKED;
    case OSU_API_APPROVED:
      return RIPPLE_APPROVED;
    case OSU_API_QUALIFIED:
      return RIPPLE_QUALIFIED;
    case OSU_API_LOVED:
      return RIPPLE_LOVED;
    default:
      return RIPPLE_PENDING;
  }
}

export function osuApiModeAsInteger(mode: string): number {
  switch (mode) {
    case "osu":
      return 0;
    case "taiko":
      return 1;
    case "fruits":
      return 2;
    case "mania":
      return 3;
    default:
      throw new Error(`Invalid mode string: ${mode}`);
  }
}

export function formatRippleBeatmapSongName(
  artist: string,
  title: string,
  difficulty: string
): string {
  return `${artist} - ${title} [${difficulty}]`;
}

export function formatRippleBeatmapFilename(
  artist: string,
  title: string,
  difficulty: string,
  creator: string
): string {
  return `${artist} - ${title} (${creator}) [${difficulty}].osu`;
}

export function osuApiBeatmapToRippleBeatmap(beatmap: OsuBeatmap): Beatmap {
  return {
    beatmap_id: beatmap.id,
    beatmapset_id: beatmap.beatmapset_id,
    beatmap_md5: beatmap.checksum,
    song_name: formatRippleBeatmapSongName(
      beatmap.beatmapset.artist,
      beatmap.beatmapset.title,
      beatmap.version
    ),
    ar: beatmap.ar,
    od: beatmap.accuracy,
    mode: osuApiModeAsInteger(beatmap.mode),
    rating: 10,
    difficulty_std: beatmap.difficulty_rating,
    difficulty_taiko: beatmap.difficulty_rating,
    difficulty_ctb: beatmap.difficulty_rating,
    difficulty_mania: beatmap.difficulty_rating,
    max_combo: beatmap.max_combo,
    hit_length: beatmap.hit_length,
    bpm: beatmap.bpm,
    playcount: beatmap.playcount,
    passcount: beatmap.passcount,
    ranked: osuApiStatusAsRippleStatus(beatmap.ranked),
    latest_update: new Date().getUTCSeconds(),
    ranked_status_freezed: false,
    pp_100: 0,
    pp_99: 0,
    pp_98: 0,
    pp_95: 0,
    disable_pp: false,
    file_name: formatRippleBeatmapFilename(
      beatmap.beatmapset.artist,
      beatmap.beatmapset.title,
      beatmap.version,
      beatmap.beatmapset.creator
    ),
    rankedby: "",
    priv_crawler: false,
  };
}

export function osuApiBeatmapAndSetToRippleBeatmap(
  beatmapset: OsuBeatmapset,
  beatmap: OsuBeatmapset["beatmaps"][0]
): Beatmap {
  return {
    beatmap_id: beatmap.id,
    beatmapset_id: beatmap.beatmapset_id,
    beatmap_md5: beatmap.checksum,
    song_name: formatRippleBeatmapSongName(
      beatmapset.artist,
      beatmapset.title,
      beatmap.version
    ),
    ar: beatmap.ar,
    od: beatmap.accuracy,
    mode: osuApiModeAsInteger(beatmap.mode),
    rating: 10,
    difficulty_std: beatmap.difficulty_rating,
    difficulty_taiko: beatmap.difficulty_rating,
    difficulty_ctb: beatmap.difficulty_rating,
    difficulty_mania: beatmap.difficulty_rating,
    max_combo: beatmap.max_combo,
    hit_length: beatmap.hit_length,
    bpm: beatmap.bpm,
    playcount: beatmap.playcount,
    passcount: beatmap.passcount,
    ranked: osuApiStatusAsRippleStatus(beatmap.ranked),
    latest_update: new Date().getUTCSeconds(),
    ranked_status_freezed: false,
    pp_100: 0,
    pp_99: 0,
    pp_98: 0,
    pp_95: 0,
    disable_pp: false,
    file_name: formatRippleBeatmapFilename(
      beatmapset.artist,
      beatmapset.title,
      beatmap.version,
      beatmapset.creator
    ),
    rankedby: "",
    priv_crawler: false,
  };
}
