const { query } = require('../config/database');

class UserModel {
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create({ name, email, passwordHash, role }) {
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );
    return result.rows[0];
  }

  static async findAllTeachers() {
    const result = await query(
      `SELECT id, name, email, created_at FROM users WHERE role = 'teacher' ORDER BY name`,
      []
    );
    return result.rows;
  }
}

module.exports = UserModel;
