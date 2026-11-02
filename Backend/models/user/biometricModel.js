const { pool } = require('../../configs/db');

async function upsertCredential({ userId, credentialId, templateReference, deviceId }) {
  await pool.execute(
    `INSERT INTO biometric_credentials
       (user_id, credential_id, template_reference, device_id, status)
     VALUES (?, ?, ?, ?, 'ACTIVE')
     ON DUPLICATE KEY UPDATE
       template_reference = VALUES(template_reference),
       device_id = VALUES(device_id),
       status = 'ACTIVE',
       revoked_at = NULL,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, credentialId, templateReference, deviceId || null]
  );
}

async function findActiveCredential(userId, credentialId) {
  const [rows] = await pool.execute(
    `SELECT credential_id, template_reference, device_id
       FROM biometric_credentials
      WHERE user_id = ? AND credential_id = ? AND status = 'ACTIVE'
      LIMIT 1`,
    [userId, credentialId]
  );
  return rows[0] || null;
}

async function revokeCredentials(userId, credentialId) {
  const where = credentialId ? 'AND credential_id = ?' : '';
  const values = credentialId ? [userId, credentialId] : [userId];
  const [result] = await pool.execute(
    `UPDATE biometric_credentials
        SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND status = 'ACTIVE' ${where}`,
    values
  );
  return result.affectedRows;
}

async function hasActiveCredentials(userId) {
  const [rows] = await pool.execute(
    "SELECT 1 FROM biometric_credentials WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1",
    [userId]
  );
  return rows.length > 0;
}

async function createSession({ sessionId, userId, expiresAt }) {
  await pool.execute(
    `INSERT INTO biometric_sessions (session_id, user_id, expires_at)
     VALUES (?, ?, ?)`,
    [sessionId, userId, expiresAt]
  );
}

async function findValidSession(sessionId, userId) {
  const [rows] = await pool.execute(
    `SELECT session_id, expires_at
       FROM biometric_sessions
      WHERE session_id = ? AND user_id = ? AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1`,
    [sessionId, userId]
  );
  return rows[0] || null;
}

async function setBiometricEnabled(userId, enabled) {
  await pool.execute('UPDATE users SET biometric_enabled = ? WHERE user_id = ?', [enabled, userId]);
}

async function expireSessions(userId) {
  await pool.execute(
    'UPDATE biometric_sessions SET expires_at = CURRENT_TIMESTAMP WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP',
    [userId]
  );
}

module.exports = {
  upsertCredential,
  findActiveCredential,
  revokeCredentials,
  hasActiveCredentials,
  createSession,
  findValidSession,
  setBiometricEnabled,
  expireSessions
};
