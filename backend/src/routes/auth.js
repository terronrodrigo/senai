import { query } from '../db/client.js';
import { hashPassword, verifyPassword, signToken, findUserByEmail } from '../lib/auth.js';
import { auditLog } from '../middleware/audit.js';

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'name', 'role'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      name: { type: 'string', minLength: 2 },
      role: { type: 'string', enum: ['aluno', 'docente', 'egresso', 'tecnico', 'consultor', 'admin_dr', 'admin_dn', 'empresa'] },
      region_id: { type: 'string', format: 'uuid' },
      phone: { type: 'string' },
      lgpd_consent: { type: 'boolean' },
    },
  },
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
};

export async function authRoutes(fastify) {
  fastify.post('/auth/register', {
    schema: registerSchema,
    handler: async (request, reply) => {
      const { email, password, name, role, region_id, phone, lgpd_consent } = request.body;
      const existing = await findUserByEmail(email);
      if (existing) {
        return reply.code(409).send({ error: 'Email already registered' });
      }
      const password_hash = await hashPassword(password);
      const r = await query(
        `INSERT INTO users (email, password_hash, name, role, region_id, phone, lgpd_consent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, role, region_id, created_at`,
        [email, password_hash, name, role, region_id || null, phone || null, lgpd_consent ? new Date() : null]
      );
      const user = r.rows[0];
      const token = signToken({ userId: user.id, role: user.role, email: user.email });
      await auditLog(request, 'user', user.id, 'register');
      return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, region_id: user.region_id } };
    },
  });

  fastify.post('/auth/login', {
    schema: loginSchema,
    handler: async (request, reply) => {
      const { email, password } = request.body;
      const user = await findUserByEmail(email);
      if (!user || !user.is_active) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });
      const token = signToken({ userId: user.id, role: user.role, email: user.email });
      await auditLog(request, 'user', user.id, 'login');
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, region_id: user.region_id },
      };
    },
  });

  fastify.get('/auth/me', {
    preHandler: [fastify.authenticate],
    handler: async (request) => {
      const r = await query(
        'SELECT id, email, name, role, region_id, created_at FROM users WHERE id = $1',
        [request.user.id]
      );
      return r.rows[0] || null;
    },
  });
}
