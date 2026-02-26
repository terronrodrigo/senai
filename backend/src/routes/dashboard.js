import { query } from '../db/client.js';
import { cacheGet, cacheSet, CACHE_TTL } from '../lib/redis.js';

export async function dashboardRoutes(fastify) {
  // Visão nacional (DN) - métricas agregadas
  fastify.get('/dashboard/national', {
    config: { requireAuth: true, roles: ['admin_dn'] },
    handler: async (request) => {
      const cacheKey = 'dashboard:national';
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;

      const [challenges, projects, teams, byRegion, byType] = await Promise.all([
        query('SELECT COUNT(*) as total FROM challenges'),
        query('SELECT COUNT(*) as total FROM projects WHERE status = $1', ['submitted']),
        query('SELECT COUNT(*) as total FROM teams'),
        query(
          `SELECT r.name as region_name, COUNT(DISTINCT c.id) as challenges, COUNT(DISTINCT p.id) as projects
           FROM regions r
           LEFT JOIN challenges c ON c.region_id = r.id
           LEFT JOIN projects p ON p.challenge_id = c.id AND p.status = 'submitted'
           GROUP BY r.id, r.name`
        ),
        query(
          `SELECT type, COUNT(*) as total FROM challenges GROUP BY type`
        ),
      ]);

      const data = {
        totalChallenges: parseInt(challenges.rows[0].total, 10),
        totalProjects: parseInt(projects.rows[0].total, 10),
        totalTeams: parseInt(teams.rows[0].total, 10),
        byRegion: byRegion.rows,
        byType: byType.rows,
      };
      await cacheSet(cacheKey, data, CACHE_TTL.dashboard);
      return data;
    },
  });

  // Visão regional (DR)
  fastify.get('/dashboard/regional/:regionId', {
    config: { requireAuth: true, roles: ['admin_dn', 'admin_dr'] },
    handler: async (request, reply) => {
      const regionId = request.params.regionId;
      if (request.user.role === 'admin_dr' && request.user.region_id !== regionId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
      const cacheKey = `dashboard:region:${regionId}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;

      const r = await query(
        `SELECT c.id, c.type, c.title, c.status,
                (SELECT COUNT(*) FROM teams t WHERE t.challenge_id = c.id) as teams_count,
                (SELECT COUNT(*) FROM projects p WHERE p.challenge_id = c.id AND p.status = 'submitted') as projects_count
         FROM challenges c
         WHERE c.region_id = $1
         ORDER BY c.created_at DESC`,
        [regionId]
      );
      const data = { challenges: r.rows };
      await cacheSet(cacheKey, data, CACHE_TTL.dashboard);
      return data;
    },
  });

  // Jornada do aluno (acompanhamento individual)
  fastify.get('/dashboard/me', {
    config: { requireAuth: true },
    handler: async (request) => {
      const userId = request.user.id;
      const r = await query(
        `SELECT t.id as team_id, t.name as team_name, c.id as challenge_id, c.title as challenge_title, c.type,
                p.id as project_id, p.title as project_title, p.status as project_status
         FROM team_members tm
         JOIN teams t ON t.id = tm.team_id
         JOIN challenges c ON c.id = t.challenge_id
         LEFT JOIN projects p ON p.team_id = t.id
         WHERE tm.user_id = $1
         ORDER BY t.created_at DESC`,
        [userId]
      );
      return { teams: r.rows };
    },
  });
}
