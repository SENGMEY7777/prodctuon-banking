const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/user/authModel');

const tokenSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }
  return process.env.JWT_SECRET;
};

const createToken = (user) => jwt.sign(
  { sub: user.user_id, role: user.role },
  tokenSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
);

async function register({ email, password, fullName }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) {
    const error = new Error('Email is already registered');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userModel.create({ email: normalizedEmail, passwordHash, fullName: fullName.trim() });
  delete user.password_hash;
  return { user, token: createToken(user) };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email.trim().toLowerCase());
  const validPassword = user && await bcrypt.compare(password, user.password_hash);
  if (!validPassword || user.status !== 'ACTIVE') {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }
  delete user.password_hash;
  return { user, token: createToken(user) };
}

module.exports = { register, login };
