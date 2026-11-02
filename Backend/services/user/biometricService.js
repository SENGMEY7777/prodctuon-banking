const crypto = require('crypto');
const biometricModel = require('../../models/user/biometricModel');

const sessionMinutes = () => Number(process.env.BIOMETRIC_SESSION_MINUTES || 5);
const proofMaxAgeMs = 2 * 60 * 1000;

function biometricProviderSecret() {
  if (!process.env.BIOMETRIC_PROVIDER_SECRET) {
    const error = new Error('BIOMETRIC_PROVIDER_SECRET is not configured');
    error.status = 500;
    throw error;
  }
  return process.env.BIOMETRIC_PROVIDER_SECRET;
}

function verifyProviderProof(userId, credentialId, timestamp, signature) {
  const proofTime = new Date(timestamp).getTime();
  if (!Number.isFinite(proofTime) || Math.abs(Date.now() - proofTime) > proofMaxAgeMs) return false;
  const expected = crypto
    .createHmac('sha256', biometricProviderSecret())
    .update(`${userId}:${credentialId}:${new Date(timestamp).toISOString()}`)
    .digest('hex');
  const received = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}

async function enroll(user, input) {
  await biometricModel.upsertCredential({ userId: user.user_id, ...input });
  await biometricModel.setBiometricEnabled(user.user_id, true);
  return { message: 'Biometric credential enrolled', credentialId: input.credentialId };
}

async function authenticateAndStepUp(user, { credentialId, verificationTimestamp, verificationSignature }) {
  const credential = await biometricModel.findActiveCredential(user.user_id, credentialId);
  // The face-comparison provider signs this short-lived proof. Face images and
  // biometric templates are never accepted by or stored in this application.
  if (!credential || !verifyProviderProof(user.user_id, credentialId, verificationTimestamp, verificationSignature)) {
    const error = new Error('Biometric authentication failed');
    error.status = 401;
    throw error;
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + sessionMinutes() * 60 * 1000);
  await biometricModel.createSession({ sessionId, userId: user.user_id, expiresAt });
  return { biometricSessionToken: sessionId, expiresAt: expiresAt.toISOString() };
}

async function validateSession(user, biometricSessionToken) {
  const session = await biometricModel.findValidSession(biometricSessionToken, user.user_id);
  if (!session) {
    const error = new Error('Biometric session expired or is invalid');
    error.status = 403;
    throw error;
  }
  return { valid: true, expiresAt: new Date(session.expires_at).toISOString() };
}

async function revoke(actor, { credentialId, userId }) {
  const targetUserId = userId || actor.user_id;
  const revoked = await biometricModel.revokeCredentials(targetUserId, credentialId);
  await biometricModel.setBiometricEnabled(targetUserId, await biometricModel.hasActiveCredentials(targetUserId));
  await biometricModel.expireSessions(targetUserId);
  return { message: 'Biometric credential revoked', revokedCredentials: revoked };
}

module.exports = { enroll, authenticateAndStepUp, validateSession, revoke };
