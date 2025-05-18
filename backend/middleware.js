import jwt from 'jsonwebtoken';
import Joi from 'joi';

/**
 * Authenticate using JWT from Authorization header.
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing or invalid' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Authorize based on user roles.
 */
export const authorizeRoles = (...roles) => (req, res, next) => {
  const { role } = req.user || {};
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  next();
};

/**
 * Validate request body against a Joi schema.
 */
export const validateBody = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    next();
  } catch (validationError) {
    const details = validationError.details.map((d) => d.message);
    return res.status(400).json({ message: 'Validation error', details });
  }
};

/**
 * Global error handler for Express.
 */
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
};
