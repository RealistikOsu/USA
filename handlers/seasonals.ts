import { FastifyReply, FastifyRequest } from 'fastify';
import { getEnabledSeasonalBGs } from '../repositories/seasonal_bgs';

export const getSeasonals = async (request: FastifyRequest, reply: FastifyReply) => {
    const database = request.requestContext.get('database')!;

    const seasonals = await getEnabledSeasonalBGs(database);
    return seasonals.map(seasonal => seasonal.url);
}