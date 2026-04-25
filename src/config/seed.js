require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('./database');

const seed = async () => {
  try {
    const salt = await bcrypt.genSalt(10);

    const principalHash = await bcrypt.hash('principal123', salt);
    const teacher1Hash = await bcrypt.hash('teacher123', salt);
    const teacher2Hash = await bcrypt.hash('teacher123', salt);

    // Upsert principal
    await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Principal Admin', 'principal@school.com', principalHash, 'principal']
    );

    // Upsert teachers
    await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Teacher One', 'teacher1@school.com', teacher1Hash, 'teacher']
    );

    await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Teacher Two', 'teacher2@school.com', teacher2Hash, 'teacher']
    );

    console.log('✅ Seed completed successfully');
    console.log('');
    console.log('Demo Credentials:');
    console.log('  Principal → email: principal@school.com | password: principal123');
    console.log('  Teacher 1 → email: teacher1@school.com  | password: teacher123');
    console.log('  Teacher 2 → email: teacher2@school.com  | password: teacher123');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

seed().catch(console.error);
