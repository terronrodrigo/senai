import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../auth.js';

jest.mock('../../config.js', () => ({ config: { jwt: { secret: 'test-secret', expiresIn: '1h' } } }));

describe('auth', () => {
  describe('hashPassword', () => {
    it('returns a hash different from the plain password', async () => {
      const hash = await hashPassword('senha123');
      expect(hash).not.toBe('senha123');
      expect(hash.length).toBeGreaterThan(20);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const hash = await bcrypt.hash('senha123', 10);
      const ok = await verifyPassword('senha123', hash);
      expect(ok).toBe(true);
    });
    it('returns false for wrong password', async () => {
      const hash = await bcrypt.hash('senha123', 10);
      const ok = await verifyPassword('outra', hash);
      expect(ok).toBe(false);
    });
  });

  describe('signToken and verifyToken', () => {
    it('signs and verifies payload', () => {
      const payload = { userId: 'uuid-1', role: 'aluno', email: 'a@b.com' };
      const token = signToken(payload);
      expect(typeof token).toBe('string');
      const decoded = verifyToken(token);
      expect(decoded.sub).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.email).toBe(payload.email);
    });
    it('returns null for invalid token', () => {
      expect(verifyToken('invalid')).toBeNull();
      expect(verifyToken('')).toBeNull();
    });
  });
});
