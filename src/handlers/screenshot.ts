import { HttpStatusCode } from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

import { Logger } from "../logger";
import { AuthenticateRequestParameters } from "../services/authentication";

const logger: Logger = new Logger({
    name: "ScreenshotHandler",
});

interface FormData {
    fields: ScreenshotFormFields;
    files: ScreenshotFormFiles;
}

interface ScreenshotFormFiles {
    ss: Buffer;
}

interface ScreenshotFormFields {
    u: string;
    p: string;
}

async function getFormData(request: FastifyRequest): Promise<FormData> {
    const parts = request.parts();

    // TODO: figure out how to type these better without abusing `as`
    const fields: any = {};
    const files: any = {};

    for await (const part of parts) {
        if (part.type === "file") {
            const fileData = await part.toBuffer();
            files[part.fieldname as keyof ScreenshotFormFiles] = fileData;
        } else {
            fields[part.fieldname as keyof ScreenshotFormFields] = part.value;
        }
    }

    return {
        fields,
        files,
    };
}

export const screenshotUploadHandler = async (
    request: FastifyRequest<{ Querystring: AuthenticateRequestParameters }>,
    reply: FastifyReply
) => {
    const authenticationService = request.requestContext.get(
        "authenticationService"
    )!;
    const screenshotService = request.requestContext.get("screenshotService")!;

    const formData = await getFormData(request);

    const user = await authenticationService.authenticateUser(
        formData.fields.u,
        formData.fields.p
    );
    if (user === null) {
        reply.code(HttpStatusCode.Unauthorized);
        reply.send();
        return;
    }

    const screenshotFile = formData.files.ss;
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

    logger.info("Uploaded a new screenshon", {
        fileName: screenshotUrl.fileName,
    });

    return screenshotUrl.fileName;
};

function shutUpErrorResponse() {
    return "https://youtu.be/r0lDBzKCGAM?si=DfTu78wM63TF-oCZ&t=25";
}
