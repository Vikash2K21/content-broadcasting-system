const AuthService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response.util');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await AuthService.register({ name, email, password, role });
    return successResponse(res, result, 'User registered successfully.', 201);
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }
    const result = await AuthService.login({ email, password });
    return successResponse(res, result, 'Login successful.');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

const me = async (req, res) => {
  return successResponse(res, req.user, 'User profile fetched.');
};

module.exports = { register, login, me };
