import { query } from '../db/client.js';
import { cacheGet, cacheSet, CACHE_TTL } from '../lib/redis.js';

const challengeSchema = {
  body: {
    type: 'object',
    required: ['type', 'title', 'description'],
    properties: {
      type: { type: 'string', enum: ['grand_prix', 'desafio_integradores', 'inova_senai'] },
      title: { type: 'string' },
      description: { type: 'string' },
      origin: { type: 'string' },
      region_id: { type: 'string', format: 'uuid' },
      max_teams_per_challenge: { type: 'integer' },
      registration_start: { type: 'string', format: 'date-time' },
      registration_end: { type: 'string', format: 'date-time' },
      submission_start: { type: 'string', format: 'date-time' },
      submission_end: { type: 'string', format: 'date-time' },
      evaluation_start: { type: 'string', format: 'date-time' },
      evaluation_end: { type: 'string', format: 'date-time' },
      criteria_json: { type: 'array' },
    },
  },
};

export async function challengesRoutes(fastify) {
  fastify.get('/challenges', {
    handler: async (request) => {
      const cacheKey = 'challenges:list:' + (request.query.status || 'all');
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;

      const status = request.query.status;
      let q = `
        SELECT c.*, r.name as region_name,
               (SELECT COUNT(*) FROM teams t WHERE t.challenge_id = c.id) as teams_count,
               (SELECT COUNT(*) FROM projects p WHERE p.challenge_id = c.id AND p.status = 'submitted') as projects_count
        FROM challenges c
        LEFT JOIN regions r ON r.id = c.region_id
        WHERE 1=1
      `;
      const params = [];
      if (status) {
        params.push(status);
        q += ` AND c.status = $${params.length}`;
      }
      q += ' ORDER BY c.created_at DESC';
      const r = await query(q, params);
      const data = r.rows;
      await cacheSet(cacheKey, data, CACHE_TTL.challengeList);
      return data;
    },
  });

  fastify.get('/challenges/:id', {
    handler: async (request, reply) => {
      const r = await query(
        `SELECT c.*, r.name as region_name,
                (SELECT COUNT(*) FROM teams t WHERE t.challenge_id = c.id) as teams_count
         FROM challenges c
         LEFT JOIN regions r ON r.id = c.region_id
         WHERE c.id = $1`,
        [request.params.id]
      );
      if (!r.rows[0]) return reply.code(404).send({ error: 'Challenge not found' });
      return r.rows[0];
    },
  });

  fastify.post('/challenges', {
    config: { requireAuth: true, roles: ['admin_dn', 'admin_dr', 'empresa'] },
    schema: challengeSchema,
    handler: async (request, reply) => {
      const u = request.user;
      const b = request.body;
      const r = await query(
        `INSERT INTO challenges (
          type, title, description, origin, region_id, created_by, status,
          max_teams_per_challenge, registration_start, registration_end,
          submission_start, submission_end, evaluation_start, evaluation_end, criteria_json
        ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          b.type, b.title, b.description, b.origin || null, b.region_id || null, u.id,
          b.max_teams_per_challenge ?? 100,
          b.registration_start || null, b.registration_end || null,
          b.submission_start || null, b.submission_end || null,
          b.evaluation_start || null, b.evaluation_end || null,
          b.criteria_json ? JSON.stringify(b.criteria_json) : null,
        ]
      );
      return r.rows[0];
    },
  });

  fastify.patch('/challenges/:id', {
    config: { requireAuth: true, roles: ['admin_dn', 'admin_dr'] },
    handler: async (request, reply) => {
      const id = request.params.id;
      const b = request.body;
      const allowed = ['title', 'description', 'status', 'registration_start', 'registration_end', 'submission_start', 'submission_end', 'evaluation_start', 'evaluation_end', 'criteria_json', 'max_teams_per_challenge'];
      const set = [];
      const params = [id];
      let i = 2;
      for (const k of allowed) {
        if (b[k] !== undefined) {
          set.push(`${k} = $${i}`);
          params.push(k === 'criteria_json' && typeof b[k] === 'object' ? JSON.stringify(b[k]) : b[k]);
          i++;
        }
      }
      if (set.length === 0) return reply.code(400).send({ error: 'No fields to update' });
      set.push('updated_at = NOW()');
      const r = await query(
        `UPDATE challenges SET ${set.join(', ')} WHERE id = $1 RETURNING *`,
        params
      );
      if (!r.rows[0]) return reply.code(404).send({ error: 'Challenge not found' });
      return r.rows[0];
    },
  });
}
