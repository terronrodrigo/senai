import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { query } from '../db/client.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload) {
  return jwt.sign(
    { sub: payload.userId, role: payload.role, email: payload.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}

export async function findUserByEmail(email) {
  const r = await query(
    'SELECT id, email, password_hash, name, role, region_id, is_active FROM users WHERE email = $1',
    [email]
  );
  return r.rows[0] || null;
}

export async function findUserById(id) {
  const r = await query(
    'SELECT id, email, name, role, region_id, is_active, created_at FROM users WHERE id = $1',
    [id]
  );
  return r.rows[0] || null;
}
