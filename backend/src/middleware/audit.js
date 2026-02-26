import { query } from '../db/client.js';

export async function auditLog(request, resourceType, resourceId, action) {
  const userId = request.user?.id || null;
  const ip = request.ip;
  const ua = request.headers['user-agent'];
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resourceType, resourceId, ip, ua]
    );
  } catch (err) {
    console.error('Audit log failed', err);
  }
}
