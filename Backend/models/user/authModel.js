const { pool } = require('../../configs/db');
const { ROLES } = require('../../helpers/roles');

const publicColumns = 'user_id, email, full_name, role, kyc_status, biometric_enabled, status, created_at, updated_at';

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${publicColumns}, password_hash FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(userId) {
  const [rows] = await pool.execute(
    `SELECT ${publicColumns} FROM users WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function create({ email, passwordHash, fullName }) {
  await pool.execute(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    [email, passwordHash, fullName, ROLES.CUSTOMER]
  );
  return findByEmail(email);
}

module.exports = { findByEmail, findById, create };
