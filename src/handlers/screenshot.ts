import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { Logger } from "../logger";
import { AuthenticateRequestParameters } from "../services/authentication";

const logger: Logger = new Logger({
    name: "ScreenshotHandler",
});

async function retrieveScreenshotFileFromForm(
    request: FastifyRequest
): Promise<Buffer | null> {
    const parts = request.parts();

    for await (const part of parts) {
        if (part.fieldname === "ss" && part.type === "file") {
            return await part.toBuffer();
        }
    }

    return null;
}

export const screenshotUploadHandler = async (
    request: FastifyRequest<{ Querystring: AuthenticateRequestParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const screenshotService = request.requestContext.get("screenshotService")!;

    const user = await authenticationService.authenticateUserFromQuery(
        request.query
    );
    if (user === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const screenshotFile = await retrieveScreenshotFileFromForm(request);
    if (!screenshotFile) {
        return shutUpErrorResponse();
    }

    const screenshotUrl = await screenshotService.createScreenshot(
        user.id,
        screenshotFile
    );
    if (typeof screenshotUrl === "string") {
        logger.info("Failed to upload screenshot with service error.", {
            userId: user.id,
            error: screenshotUrl,
        });
        return shutUpErrorResponse();
    }

    return screenshotUrl.fileName;
};

function shutUpErrorResponse() {
    return "https://youtu.be/r0lDBzKCGAM?si=DfTu78wM63TF-oCZ&t=25";
}
