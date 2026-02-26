import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import { authMiddleware, requireRole } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { challengesRoutes } from './routes/challenges.js';
import { teamsRoutes } from './routes/teams.js';
import { projectsRoutes } from './routes/projects.js';
import { evaluationsRoutes } from './routes/evaluations.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { learningRoutes } from './routes/learning.js';
import { aiRoutes } from './routes/ai.js';
import { regionsRoutes } from './routes/regions.js';

export async function buildApp() {
  const fastify = Fastify({ logger: config.nodeEnv !== 'production' });

  await fastify.register(cors, { origin: true });
  await fastify.register(compress, { global: true });
  await fastify.register(sensible);
  await fastify.register(rateLimit, {
    max: 300,
    timeWindow: '1 hour',
  });
  await fastify.register(multipart, {
    limits: { fileSize: config.upload.maxSize },
  });

  fastify.decorate('authenticate', async (request, reply) => {
    await authMiddleware(request, reply);
  });

  const authPreHandler = async (request, reply) => {
    const routeConfig = request.routeOptions?.config;
    if (!routeConfig?.requireAuth) return;
    await authMiddleware(request, reply);
    if (routeConfig.roles?.length) {
      await requireRole(...routeConfig.roles)(request, reply);
    }
  };

  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(challengesRoutes, { prefix: '/api' });
  await fastify.register(teamsRoutes, { prefix: '/api' });
  await fastify.register(projectsRoutes, { prefix: '/api' });
  await fastify.register(evaluationsRoutes, { prefix: '/api' });
  await fastify.register(dashboardRoutes, { prefix: '/api' });
  await fastify.register(learningRoutes, { prefix: '/api' });
  await fastify.register(aiRoutes, { prefix: '/api' });
  await fastify.register(regionsRoutes, { prefix: '/api' });

  fastify.addHook('preHandler', async (request, reply) => {
    const routeConfig = request.routeOptions?.config;
    if (routeConfig?.requireAuth) {
      await authPreHandler(request, reply);
    }
  });

  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return fastify;
}
