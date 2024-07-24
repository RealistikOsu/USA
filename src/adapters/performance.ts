import axios from 'axios';

// I preferred my class.

export interface PerformanceResult {
    stars: number;
    pp: number;
    ar: number;
    od: number;
    max_combo: number;
}

export interface PerformanceRequest {
    beatmap_id: number;
    mode: number;
    mods: number;
    max_combo: number;
    accuracy: number;
    miss_count: number;
    passed_objects?: number;
}

async function makePerformanceRequest(requests: PerformanceRequest[]): Promise<PerformanceResult[]> {
    const http = axios.create();

    const response = await http.post(`${process.env.PERFORMANCE_SERVICE_BASE_URL}/api/v1/calculate`, requests, {
        timeout: 1000,
    });

    return response.data;
}

export async function getPerformanceSingle(
    beatmap_id: number,
    mode: number,
    mods: number,
    max_combo: number,
    accuracy: number,
    miss_count: number,
    passed_objects: number,
): Promise<PerformanceResult> {
    const request: PerformanceRequest = {
        beatmap_id,
        mode,
        mods,
        max_combo,
        accuracy,
        miss_count,
        passed_objects,
    };
    
    const responses = await makePerformanceRequest([request]);
    return responses[0];
}

export async function getPerformanceBatch(
    requests: PerformanceRequest[],
): Promise<PerformanceResult[]> {
    return makePerformanceRequest(requests);
}
