import cryptian from "cryptian";
import { FastifyRequest } from "fastify";

import { Beatmap } from "../database";

interface FormData {
    fields: ScoreSubmissionFormFields;
    files: ScoreSubmissionFormFiles;
}

interface ScoreSubmissionFormFiles {
    i: Buffer;
    score: Buffer;
}

interface ScoreSubmissionFormFields {
    x: string;
    ft: string;
    fs: string;
    bmk: string;
    sbk: string;
    iv: string;
    c1: string;
    st: string;
    pass: string;
    osuver: string;
    s: string;
    score: string;
}

interface ScoreSubmissionHeaders {
    token?: string;
    "user-agent": string;
}

async function getFormData(request: FastifyRequest): Promise<FormData> {
    const parts = request.parts();

    const fields: any = {};
    const files: any = {};

    for await (const part of parts) {
        if (part.type === "file") {
            const fileData = await part.toBuffer();
            files[part.fieldname as keyof ScoreSubmissionFormFiles] = fileData;
        } else {
            fields[part.fieldname as keyof ScoreSubmissionFormFields] =
                part.value;
        }
    }

    return {
        fields,
        files,
    };
}

interface ScoreData {
    beatmapMd5: string;
    username: string;
    scoreChecksum: string;
    count300s: number;
    count100s: number;
    count50s: number;
    countGekis: number;
    countKatus: number;
    countMisses: number;
    score: number;
    maxCombo: number;
    fullCombo: boolean;
    rank: string;
    mods: number;
    passed: boolean;
    mode: number;
    // some unknown number here, maybe timestamp?
    osuVersion: string;
}

interface ScoreSubmissionData {
    scoreData: ScoreData;
    clientHash: string;
}

function decryptScoreSubmissionData(formData: FormData): ScoreSubmissionData {
    const key = `osu!-scoreburgr---------${formData.fields.osuver}`;

    const rijndael = new cryptian.algorithm.Rijndael256();
    rijndael.setKey(Buffer.from(key, "ascii"));

    const cbcDecipher = new cryptian.mode.cbc.Decipher(
        rijndael,
        Buffer.from(formData.fields.iv, "base64")
    );

    const scoreData = cbcDecipher.transform(
        Buffer.from(formData.fields.score, "base64")
    );
    const clientHash = cbcDecipher.transform(
        Buffer.from(formData.fields.s, "base64")
    );

    const scoreDataArray = scoreData.toString().split(":");

    return {
        scoreData: {
            beatmapMd5: scoreDataArray[0],
            username: scoreDataArray[1].trimEnd(), // trim supporter "pace"
            scoreChecksum: scoreDataArray[2],
            count300s: parseInt(scoreDataArray[3]),
            count100s: parseInt(scoreDataArray[4]),
            count50s: parseInt(scoreDataArray[5]),
            countGekis: parseInt(scoreDataArray[6]),
            countKatus: parseInt(scoreDataArray[7]),
            countMisses: parseInt(scoreDataArray[8]),
            score: parseInt(scoreDataArray[9]),
            maxCombo: parseInt(scoreDataArray[10]),
            fullCombo: scoreDataArray[11] === "True",
            rank: scoreDataArray[12],
            mods: parseInt(scoreDataArray[13]),
            passed: scoreDataArray[14] === "True",
            mode: parseInt(scoreDataArray[15]),
            // skipped value here
            osuVersion: scoreDataArray[17],
            // skipped value here
        },
        clientHash: clientHash.toString(),
    };
}

export const submitScore = async (
    request: FastifyRequest<{ Headers: ScoreSubmissionHeaders }>
) => {
    const beatmapService = request.requestContext.get("beatmapService")!;
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;

    const formData = await getFormData(request);
    const { scoreData, clientHash } = decryptScoreSubmissionData(formData);

    const authenticatedUser = await authenticationService.authenticateUser(
        scoreData.username,
        formData.fields.pass
    );
    if (!authenticatedUser) {
        return emptyErrorResponse();
    }

    const beatmapResult = await beatmapService.findByBeatmapMd5(
        scoreData.beatmapMd5
    );
    if (typeof beatmapResult === "string") {
        return beatmapErrorResponse();
    }

    const beatmap = beatmapResult as Beatmap;

    const accuracy = calculateAccuracy();
};

function beatmapErrorResponse() {
    return "error: beatmap";
}

function emptyErrorResponse() {
    return "";
}
