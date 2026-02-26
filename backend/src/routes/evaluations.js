import { query } from '../db/client.js';

export async function evaluationsRoutes(fastify) {
  fastify.get('/projects/:projectId/evaluations', {
    config: { requireAuth: true, roles: ['admin_dn', 'admin_dr', 'docente'] },
    handler: async (request) => {
      const r = await query(
        `SELECT e.*, u.name as evaluator_name
         FROM evaluations e
         JOIN users u ON u.id = e.evaluator_id
         WHERE e.project_id = $1`,
        [request.params.projectId]
      );
      return r.rows;
    },
  });

  fastify.post('/projects/:projectId/evaluations', {
    config: { requireAuth: true, roles: ['admin_dn', 'admin_dr', 'docente'] },
    schema: {
      body: {
        type: 'object',
        required: ['scores_json'],
        properties: {
          scores_json: { type: 'object' },
          comments: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const { projectId } = request.params;
      const { scores_json, comments } = request.body;
      const evaluatorId = request.user.id;

      const proj = await query('SELECT id, challenge_id FROM projects WHERE id = $1', [projectId]);
      if (!proj.rows[0]) return reply.code(404).send({ error: 'Project not found' });

      const criteria = await query(
        'SELECT criteria_json FROM challenges WHERE id = $1',
        [proj.rows[0].challenge_id]
      );
      const criteriaList = criteria.rows[0]?.criteria_json || [];
      let total = 0;
      for (const c of criteriaList) {
        const w = (c.weight || 1) / 100;
        const s = scores_json[c.id] ?? scores_json[c.name] ?? 0;
        total += Number(s) * w;
      }

      const r = await query(
        `INSERT INTO evaluations (project_id, evaluator_id, scores_json, total_score, comments)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (project_id, evaluator_id) DO UPDATE SET
           scores_json = EXCLUDED.scores_json,
           total_score = EXCLUDED.total_score,
           comments = EXCLUDED.comments,
           updated_at = NOW()
         RETURNING *`,
        [projectId, evaluatorId, JSON.stringify(scores_json), total, comments || null]
      );
      return r.rows[0];
    },
  });

  fastify.get('/challenges/:challengeId/ranking', {
    handler: async (request) => {
      const r = await query(
        `SELECT p.id as project_id, p.title, t.name as team_name,
                AVG(e.total_score) as avg_score,
                COUNT(e.id) as evaluations_count
         FROM projects p
         JOIN teams t ON t.id = p.team_id
         LEFT JOIN evaluations e ON e.project_id = p.id
         WHERE p.challenge_id = $1 AND p.status = 'submitted'
         GROUP BY p.id, p.title, t.name
         ORDER BY avg_score DESC NULLS LAST`,
        [request.params.challengeId]
      );
      return r.rows.map((row, i) => ({ ...row, rank: i + 1 }));
    },
  });
}
