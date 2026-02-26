import Redis from 'ioredis';
import { config } from '../config.js';

let client = null;

export function getRedis() {
  if (!client) {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    });
    client.on('error', (err) => console.error('Redis error', err));
  }
  return client;
}

const CACHE_TTL = {
  dashboard: 300,      // 5 min
  challengeList: 60,
  userSession: 86400,  // 24h
};

export async function cacheGet(key) {
  const redis = getRedis();
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  const redis = getRedis();
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.setex(key, ttlSeconds, str);
  } else {
    await redis.set(key, str);
  }
}

export { CACHE_TTL };
