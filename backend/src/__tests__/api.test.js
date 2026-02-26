/**
 * Testes de integração da API.
 * Requer: PostgreSQL, Redis e RabbitMQ (ex.: docker-compose up -d).
 * Rodar com: npm run test -- --testPathPattern=api
 */
import { jest } from '@jest/globals';
import { buildApp } from '../app.js';

jest.mock('../db/client.js', () => ({
  query: jest.fn(() => Promise.resolve({ rows: [] })),
  getPool: jest.fn(() => ({ connect: () => Promise.resolve({ query: () => Promise.resolve({ rows: [] }), release: () => {} }) })),
}));
jest.mock('../lib/redis.js', () => ({
  getRedis: jest.fn(),
  cacheGet: jest.fn(() => Promise.resolve(null)),
  cacheSet: jest.fn(() => Promise.resolve()),
  CACHE_TTL: {},
}));
jest.mock('../lib/queue.js', () => ({ publish: jest.fn(() => Promise.resolve()), getChannel: jest.fn(), consume: jest.fn(), QUEUES: {} }));

describe('API (mocked deps)', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health returns 200 and status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});
