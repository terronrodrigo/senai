import { query, getPool } from '../db/client.js';

export async function teamsRoutes(fastify) {
  fastify.get('/challenges/:challengeId/teams', {
    handler: async (request, reply) => {
      const r = await query(
        `SELECT t.*, u.name as leader_name, u.email as leader_email
         FROM teams t
         LEFT JOIN users u ON u.id = t.leader_id
         WHERE t.challenge_id = $1
         ORDER BY t.created_at DESC`,
        [request.params.challengeId]
      );
      return r.rows;
    },
  });

  fastify.post('/challenges/:challengeId/teams', {
    config: { requireAuth: true },
    schema: {
      body: {
        type: 'object',
        required: ['name', 'member_ids'],
        properties: {
          name: { type: 'string' },
          member_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
    },
    handler: async (request, reply) => {
      const { challengeId } = request.params;
      const { name, member_ids } = request.body;
      const userId = request.user.id;

      const ch = await query('SELECT id, max_teams_per_challenge FROM challenges WHERE id = $1', [challengeId]);
      if (!ch.rows[0]) return reply.code(404).send({ error: 'Challenge not found' });

      const count = await query('SELECT COUNT(*) FROM teams WHERE challenge_id = $1', [challengeId]);
      const max = ch.rows[0].max_teams_per_challenge ?? 100;
      if (parseInt(count.rows[0].count, 10) >= max) {
        return reply.code(400).send({ error: 'Max teams reached for this challenge' });
      }

      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        const t = await client.query(
          `INSERT INTO teams (challenge_id, name, leader_id) VALUES ($1, $2, $3) RETURNING *`,
          [challengeId, name, userId]
        );
        const teamId = t.rows[0].id;
        for (const uid of [...new Set([userId, ...(member_ids || [])])]) {
          await client.query(
            'INSERT INTO team_members (team_id, user_id, role_in_team) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [teamId, uid, uid === userId ? 'leader' : 'member']
          );
        }
        await client.query('COMMIT');
        const out = await query('SELECT * FROM teams WHERE id = $1', [teamId]);
        return out.rows[0];
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
  });
}
