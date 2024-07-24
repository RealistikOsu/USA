import { FastifyReply, FastifyRequest } from 'fastify';

export const getSeasonalBackgrounds = async (request: FastifyRequest, reply: FastifyReply) => {
    const seasonalBackgroundRepository = request.requestContext.get('seasonalBackgroundRepository')!;

    const seasonals = await seasonalBackgroundRepository.getSeasonalBackgrounds();
    return seasonals.map(seasonal => seasonal.url);
}