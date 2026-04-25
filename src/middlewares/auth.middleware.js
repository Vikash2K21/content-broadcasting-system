const { verifyToken } = require('../utils/jwt.util');
const { errorResponse } = require('../utils/response.util');
const UserModel = require('../models/user.model');

/**
 * Protect routes — requires valid JWT in Authorization header.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token.', 401);
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 'User not found.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

/**
 * Restrict access to specific roles.
 * Usage: authorize('principal') or authorize('teacher') or authorize('principal', 'teacher')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}.`,
        403
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
