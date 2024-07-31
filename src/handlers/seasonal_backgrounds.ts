import { FastifyRequest } from "fastify";

export const getSeasonalBackgrounds = async (request: FastifyRequest) => {
    const seasonalBackgroundRepository = request.requestContext.get(
        "seasonalBackgroundRepository"
    )!;

    const seasonals = await seasonalBackgroundRepository.getWhereEnabled();
    return seasonals.map((seasonal) => seasonal.url);
};
