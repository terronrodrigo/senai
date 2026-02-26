import { query } from '../db/client.js';
import { cacheGet, cacheSet, CACHE_TTL } from '../lib/redis.js';

export async function learningRoutes(fastify) {
  fastify.get('/learning/modules', {
    handler: async () => {
      const cacheKey = 'learning:modules';
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
      const r = await query(
        'SELECT id, title, slug, description, order_index FROM learning_modules WHERE is_published = true ORDER BY order_index'
      );
      await cacheSet(cacheKey, r.rows, CACHE_TTL.challengeList);
      return r.rows;
    },
  });

  fastify.get('/learning/modules/:slug', {
    handler: async (request, reply) => {
      const r = await query(
        'SELECT * FROM learning_modules WHERE slug = $1 AND is_published = true',
        [request.params.slug]
      );
      if (!r.rows[0]) return reply.code(404).send({ error: 'Module not found' });
      return r.rows[0];
    },
  });

  fastify.post('/learning/modules/:moduleId/complete', {
    config: { requireAuth: true },
    handler: async (request, reply) => {
      const { moduleId } = request.params;
      const userId = request.user.id;
      await query(
        `INSERT INTO user_learning_progress (user_id, module_id, score) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, module_id) DO UPDATE SET completed_at = NOW(), score = EXCLUDED.score`,
        [userId, moduleId, request.body.score ?? null]
      );
      return { ok: true };
    },
  });

  fastify.get('/learning/me/progress', {
    config: { requireAuth: true },
    handler: async (request) => {
      const r = await query(
        `SELECT ulp.*, lm.title, lm.slug FROM user_learning_progress ulp
         JOIN learning_modules lm ON lm.id = ulp.module_id
         WHERE ulp.user_id = $1`,
        [request.user.id]
      );
      return r.rows;
    },
  });
}
