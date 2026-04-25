const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { generateToken } = require('../utils/jwt.util');

class AuthService {
  static async register({ name, email, password, role }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered.');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, passwordHash, role });
    const token = generateToken({ id: user.id, role: user.role });

    return { user, token };
  }

  static async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const token = generateToken({ id: user.id, role: user.role });
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, token };
  }
}

module.exports = AuthService;
