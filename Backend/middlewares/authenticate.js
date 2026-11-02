const jwt = require('jsonwebtoken');
const userModel = require('../models/user/authModel');
const { isRole } = require('../helpers/roles');

async function authenticate(req, _res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      const error = new Error('Authentication token is required');
      error.status = 401;
      throw error;
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      const error = new Error('User is not authorized');
      error.status = 401;
      throw error;
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.status = 401;
      error.message = 'Invalid or expired token';
    }
    next(error);
  }
}

const authorize = (...roles) => (req, _res, next) => {
  if (!isRole(req.user.role) || !roles.includes(Number(req.user.role))) {
    const error = new Error('You do not have permission to access this resource');
    error.status = 403;
    return next(error);
  }
  next();
};

module.exports = { authenticate, authorize };
