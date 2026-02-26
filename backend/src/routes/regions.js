import { query } from '../db/client.js';
import { cacheGet, cacheSet, CACHE_TTL } from '../lib/redis.js';

export async function regionsRoutes(fastify) {
  fastify.get('/regions', {
    handler: async () => {
      const cacheKey = 'regions:all';
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
      const r = await query('SELECT id, name, code FROM regions ORDER BY name');
      await cacheSet(cacheKey, r.rows, CACHE_TTL.challengeList);
      return r.rows;
    },
  });
}
