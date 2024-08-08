import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { AuthenticateRequestParameters } from "../services/authentication";

enum LastFMFlags {
    timeWarp = 1 << 1,
    incorrectModValue = 1 << 2,
    multipleOsuClients = 1 << 3,
    checksumFail = 1 << 4,
    flashlightChecksumFail = 1 << 5,

    osuExeChecksumFail = 1 << 6,
    missingProcess = 1 << 7,

    flashlightRemover = 1 << 8,
    autospinHack = 1 << 9,
    windowOverlay = 1 << 10,
    fastPress = 1 << 11,

    mouseDiscrepency = 1 << 12,
    kbDiscrepency = 1 << 13,

    lfFlagPresent = 1 << 14,
    osuDebugged = 1 << 15,
    extraThreads = 1 << 16,

    hqOsuAssembly = 1 << 17,
    hqOsuFile = 1 << 18,
    hqRelife = 1 << 19,

    aqnSql2Lib = 1 << 20,
    aqnLibeay32 = 1 << 21,
    aqnMenuSound = 1 << 22,
}

interface LastFMParameters extends AuthenticateRequestParameters {
    b: string;
}

function getFlagMessage(flag: number): string {
    switch (flag) {
        case LastFMFlags.timeWarp:
            return "[LIKELY] Timewarp flag triggered (audio is desynced from expected position)! May be caused by lag on the user's end.";
        case LastFMFlags.incorrectModValue:
            return "[MIXED] The score's mod value didn't match enabled mods (possible sign of a mod remover such as Hidden remover).";
        case LastFMFlags.multipleOsuClients:
            return "[MIXED] The user had multiple instances of osu! open.";
        case LastFMFlags.checksumFail:
            return "[LIKELY] The score related memory has been edited in a weird manner.";
        case LastFMFlags.flashlightChecksumFail:
            return "[UNKNOWN] FL Checksum fail occurrence is unknown.";
        case LastFMFlags.flashlightRemover:
            return "[CERTAIN] User is using a flashlight remover.";
        case LastFMFlags.windowOverlay:
            return "[LIKELY] A transparent window is overlaying the osu! client.";
        case LastFMFlags.fastPress:
            return "[LIKELY] User is consistently hitting notes with a low latency in mania.";
        case LastFMFlags.mouseDiscrepency:
            return "[LIKELY] Something is altering the mouse position the mouse info on the position received by the game.";
        case LastFMFlags.kbDiscrepency:
            return "[LIKELY] Something is altering the keyboard presses received by the game.";
        case LastFMFlags.lfFlagPresent:
            return "[UNKNOWN] LF flag is present. Occurrence of this is unknown.";
        case LastFMFlags.osuDebugged:
            return "[LIKELY] osu! is being debugged. Console attached to the process has been detected.";
        case LastFMFlags.extraThreads:
            return "[LIKELY] A foreign thread has been detected attached to osu! This is a method usually used by cheats to run.";
        case LastFMFlags.hqOsuAssembly:
            return "[CERTAIN] The HQOsu assembly has been detected.";
        case LastFMFlags.hqOsuFile:
            return "[MIXED] The presence of HQOsu files has been detected.";
        case LastFMFlags.hqRelife:
            return "[MIXED] HQOsu Relife traces found in registry. This means that the user has used the multiaccounting tool in the past, but may not be using it now.";
        case LastFMFlags.aqnSql2Lib:
            return "[CERTAIN] Ancient AQN library SQL2Lib detected.";
        case LastFMFlags.aqnLibeay32:
            return "[CERTAIN] Use of ancient AQN version detected through library libeay32.dll";
        case LastFMFlags.aqnMenuSound:
            return "[CERTAIN] Use of ancient AQN version detected through menu sound.";
        default:
            return `Unknown flag: ${flag}`;
    }
}

function getFlagsExplanation(lastfmFlags: number): string[] {
    const flags: string[] = [];

    let curBit = 0b1;
    while (curBit < lastfmFlags) {
        if (lastfmFlags & curBit) {
            const message = getFlagMessage(curBit);
            flags.push(message);
        }

        curBit <<= 1;
    }

    return flags;
}

export const getLastFM = async (
    request: FastifyRequest<{ Querystring: LastFMParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const lastfmFlagService = request.requestContext.get("lastfmFlagService")!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );
    if (user === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    if (!request.query.b.startsWith("a")) {
        return createShutUpResponse();
    }

    const lastfmFlags = parseInt(request.query.b.slice(1));
    const flagsExplanation = getFlagsExplanation(lastfmFlags);

    const explanationString = flagsExplanation.join("\n");

    await lastfmFlagService.create(user.id, lastfmFlags, explanationString);
    return createShutUpResponse();
};

function createShutUpResponse(): string {
    return "-3";
}
