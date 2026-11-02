const Joi = require('joi');
const authService = require('../../services/user/authService');
const biometricService = require('../../services/user/biometricService');
const { ROLES } = require('../../helpers/roles');

const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
  password: Joi.string().min(8).max(72).required(),
  fullName: Joi.string().trim().min(2).max(255).required()
})
  // Supports the existing client field without accepting unsafe password_hash.
  .rename('full_name', 'fullName', { alias: false, override: false });
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
const enrollmentSchema = Joi.object({
  credentialId: Joi.string().trim().max(255).required(),
  templateReference: Joi.string().trim().max(512).required(),
  deviceId: Joi.string().trim().max(255).optional()
});
const stepUpSchema = Joi.object({
  credentialId: Joi.string().trim().max(255).required(),
  verificationTimestamp: Joi.date().iso().required(),
  verificationSignature: Joi.string().hex().length(64).required()
});
const sessionSchema = Joi.object({ biometricSessionToken: Joi.string().uuid().required() });
const revokeSchema = Joi.object({
  credentialId: Joi.string().trim().max(255).optional(),
  userId: Joi.number().integer().positive().optional()
});

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const validationError = new Error('Validation failed');
    validationError.status = 400;
    validationError.errors = error.details.map((item) => ({
      field: item.path.join('.'),
      message: item.message.replaceAll('"', '')
    }));
    throw validationError;
  }
  return value;
};

async function register(req, res, next) {
  try {
    const result = await authService.register(validate(registerSchema, req.body));
    res.status(201).json({ message: 'Registration successful', ...result });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(validate(loginSchema, req.body));
    res.json({ message: 'Login successful', ...result });
  } catch (error) { next(error); }
}

function me(req, res) { res.json({ user: req.user }); }

async function enrollBiometric(req, res, next) {
  try { res.status(201).json(await biometricService.enroll(req.user, validate(enrollmentSchema, req.body))); } catch (error) { next(error); }
}

async function authenticateBiometric(req, res, next) {
  try { res.json(await biometricService.authenticateAndStepUp(req.user, validate(stepUpSchema, req.body))); } catch (error) { next(error); }
}

async function verifyBiometricSession(req, res, next) {
  try { res.json(await biometricService.validateSession(req.user, validate(sessionSchema, req.body).biometricSessionToken)); } catch (error) { next(error); }
}

async function revokeBiometric(req, res, next) {
  try {
    const input = validate(revokeSchema, req.body);
    if (input.userId && Number(req.user.role) !== ROLES.ADMIN) {
      const error = new Error('Only an administrator can revoke another user\'s credential');
      error.status = 403;
      throw error;
    }
    res.json(await biometricService.revoke(req.user, input));
  } catch (error) { next(error); }
}

module.exports = { register, login, me, enrollBiometric, authenticateBiometric, verifyBiometricSession, revokeBiometric };
