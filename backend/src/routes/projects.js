import { query } from '../db/client.js';
import { publish } from '../lib/queue.js';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

export async function projectsRoutes(fastify) {
  fastify.get('/challenges/:challengeId/projects', {
    handler: async (request) => {
      const r = await query(
        `SELECT p.*, t.name as team_name, t.leader_id
         FROM projects p
         JOIN teams t ON t.id = p.team_id
         WHERE p.challenge_id = $1
         ORDER BY p.submitted_at DESC NULLS LAST`,
        [request.params.challengeId]
      );
      return r.rows;
    },
  });

  fastify.get('/teams/:teamId/project', {
    config: { requireAuth: true },
    handler: async (request, reply) => {
      const r = await query(
        'SELECT * FROM projects WHERE team_id = $1 ORDER BY created_at DESC LIMIT 1',
        [request.params.teamId]
      );
      return r.rows[0] || null;
    },
  });

  fastify.post('/teams/:teamId/project', {
    config: { requireAuth: true },
    handler: async (request, reply) => {
      const { teamId } = request.params;
      const userId = request.user.id;
      const member = await query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, userId]
      );
      if (!member.rows[0]) return reply.code(403).send({ error: 'Not a team member' });

      const r = await query(
        `INSERT INTO projects (team_id, challenge_id, title, summary, status)
         SELECT $1, t.challenge_id, $2, $3, 'draft'
         FROM teams t WHERE t.id = $1
         RETURNING *`,
        [teamId, request.body.title || 'Projeto', request.body.summary || null]
      );
      if (!r.rows[0]) return reply.code(404).send({ error: 'Team not found' });
      return r.rows[0];
    },
  });

  fastify.patch('/projects/:id', {
    config: { requireAuth: true },
    handler: async (request, reply) => {
      const id = request.params.id;
      const b = request.body;
      const allowed = ['title', 'summary', 'file_technical_pdf', 'file_prior_art_pdf', 'file_pitch_video', 'file_bmc'];
      const set = [];
      const params = [id];
      let i = 2;
      for (const k of allowed) {
        if (b[k] !== undefined) {
          set.push(`${k} = $${i}`);
          params.push(b[k]);
          i++;
        }
      }
      if (set.length === 0) return reply.code(400).send({ error: 'No fields to update' });
      set.push('updated_at = NOW()');
      const r = await query(
        `UPDATE projects SET ${set.join(', ')} WHERE id = $1 RETURNING *`,
        params
      );
      if (!r.rows[0]) return reply.code(404).send({ error: 'Project not found' });
      return r.rows[0];
    },
  });

  fastify.post('/projects/:id/submit', {
    config: { requireAuth: true },
    handler: async (request, reply) => {
      const id = request.params.id;
      const r = await query(
        'SELECT p.*, t.challenge_id FROM projects p JOIN teams t ON t.id = p.team_id WHERE p.id = $1',
        [id]
      );
      const project = r.rows[0];
      if (!project) return reply.code(404).send({ error: 'Project not found' });
      if (project.status !== 'draft') return reply.code(400).send({ error: 'Project already submitted' });
      if (!project.file_technical_pdf || !project.file_prior_art_pdf || !project.file_pitch_video || !project.file_bmc) {
        return reply.code(400).send({ error: 'All required files must be uploaded before submit' });
      }
      await query(
        `UPDATE projects SET status = 'submitted', submitted_at = NOW(), processing_status = 'pending' WHERE id = $1`,
        [id]
      );
      await publish('projectProcess', { projectId: id });
      return { ok: true, message: 'Submitted; processing in background' };
    },
  });

  // Upload de arquivo (multipart) - salva em disco/EFS e enfileira processamento
  fastify.post('/projects/:id/upload', {
    config: { requireAuth: true },
    handler: async (request, reply) => {
      const id = request.params.id;
      const data = await request.file();
      if (!data) return reply.code(400).send({ error: 'No file' });
      const field = data.fieldname; // technical_pdf, prior_art_pdf, pitch_video, bmc
      const ext = path.extname(data.filename) || path.extname(data.mimetype) || '';
      const buf = await data.toBuffer();
      if (buf.length > config.upload.maxSize) {
        return reply.code(413).send({ error: 'File too large (max 10MB)' });
      }
      const dir = path.join(UPLOAD_DIR, id);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `${field}${ext}`;
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, buf);
      const dbField = 'file_' + field;
      await query(
        `UPDATE projects SET ${dbField} = $1, processing_status = 'pending', updated_at = NOW() WHERE id = $2`,
        [filepath, id]
      );
      await publish('projectProcess', { projectId: id });
      return { ok: true, [dbField]: filepath };
    },
  });
}
