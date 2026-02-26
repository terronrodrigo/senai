import { verifyToken } from '../lib/auth.js';

export async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return reply.code(401).send({ error: 'Token required' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
  request.user = { id: payload.sub, role: payload.role, email: payload.email };
}

export function requireRole(...roles) {
  return async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
}
