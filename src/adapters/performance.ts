import axios from "axios";

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

const performanceServiceInstance = axios.create({
    baseURL: process.env.PERFORMANCE_SERVICE_BASE_URL,
});

async function requestPerformances(
    requests: PerformanceRequest[]
): Promise<PerformanceResult[]> {
    const response = await performanceServiceInstance.post(
        "/api/v1/calculate",
        requests,
        {
            timeout: 1000,
        }
    );

    return response.data;
}

export async function calculatePerformance(
    beatmap_id: number,
    mode: number,
    mods: number,
    max_combo: number,
    accuracy: number,
    miss_count: number,
    passed_objects?: number
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

    const responses = await requestPerformances([request]);
    return responses[0];
}

export async function calculatePerformances(
    requests: PerformanceRequest[]
): Promise<PerformanceResult[]> {
    return requestPerformances(requests);
}
