import axios from "axios";

export interface CheesegullBeatmap {
    id: number;
    beatmapsetId: number;
    version: string;
    checksum: string;
    mode: number;
    bpm: number;
    approachRate: number;
    overallDifficulty: number;
    circleSize: number;
    healthPoints: number;
    totalLength: number;
    hitLength: number;
    playCount: number;
    passCount: number;
    maxCombo: number;
    difficultyRating: number;
}

interface _CheesegullBeatmap {
    BeatmapID: number;
    ParentSetID: number;
    DiffName: string;
    FileMD5: string;
    Mode: number;
    BPM: number;
    AR: number;
    OD: number;
    CS: number;
    HP: number;
    TotalLength: number;
    HitLength: number;
    Playcount: number;
    Passcount: number;
    MaxCombo: number;
    DifficultyRating: number;
}

export interface CheesegullBeatmapset {
    id: number;
    beatmaps: CheesegullBeatmap[];
    rankedStatus: number;
    approvedDate: Date;
    lastUpdate: Date;
    lastChecked: Date;
    artist: string;
    title: string;
    creator: string;
    source: string;
    tags: string;
    hasVideo: boolean;
    genre: number | null;
    language: number | null;
    favourites: number;
}

interface _CheesegullBeatmapset {
    SetID: number;
    ChildrenBeatmaps: _CheesegullBeatmap[];
    RankedStatus: number;
    ApprovedDate: Date;
    LastUpdate: Date;
    LastChecked: Date;
    Artist: string;
    Title: string;
    Creator: string;
    Source: string;
    Tags: string;
    HasVideo: boolean;
    Genre: number | null;
    Language: number | null;
    Favourites: number;
}

export interface BeatmapSearchParameters {
    amount: number;
    offset: number;
    mode?: number;
    query?: string;
    status?: number;
}

const beatmapServiceInstance = axios.create({
    baseURL: process.env.BEATMAPS_SERVICE_BASE_URL,
});

export async function searchCheesegullBeatmapsets(
    params: BeatmapSearchParameters
): Promise<CheesegullBeatmapset[]> {
    const response = await beatmapServiceInstance.get("/search", { params });

    const beatmapsets = response.data as _CheesegullBeatmapset[];
    return beatmapsets.map((beatmapset) =>
        cheesegullBeatmapsetFromResponse(beatmapset)
    );
}

export async function getCheesegullBeatmapset(
    beatmapsetId: number
): Promise<CheesegullBeatmapset> {
    const response = await beatmapServiceInstance.get(`/s/${beatmapsetId}`);
    return cheesegullBeatmapsetFromResponse(response.data);
}

function cheesegullBeatmapsetFromResponse(
    response: _CheesegullBeatmapset
): CheesegullBeatmapset {
    return {
        id: response.SetID,
        beatmaps: response.ChildrenBeatmaps.map((beatmap) =>
            cheesegullBeatmapFromResponse(beatmap)
        ),
        rankedStatus: response.RankedStatus,
        approvedDate: response.ApprovedDate,
        lastUpdate: response.LastUpdate,
        lastChecked: response.LastChecked,
        artist: response.Artist,
        title: response.Title,
        creator: response.Creator,
        source: response.Source,
        tags: response.Tags,
        hasVideo: response.HasVideo,
        genre: response.Genre,
        language: response.Language,
        favourites: response.Favourites,
    };
}

function cheesegullBeatmapFromResponse(
    response: _CheesegullBeatmap
): CheesegullBeatmap {
    return {
        id: response.BeatmapID,
        beatmapsetId: response.ParentSetID,
        version: response.DiffName,
        checksum: response.FileMD5,
        mode: response.Mode,
        bpm: response.BPM,
        approachRate: response.AR,
        overallDifficulty: response.OD,
        circleSize: response.CS,
        healthPoints: response.HP,
        totalLength: response.TotalLength,
        hitLength: response.HitLength,
        passCount: response.Passcount,
        playCount: response.Playcount,
        maxCombo: response.MaxCombo,
        difficultyRating: response.DifficultyRating,
    };
}
