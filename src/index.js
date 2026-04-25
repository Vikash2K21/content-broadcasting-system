require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const approvalRoutes = require('./routes/approval.routes');
const broadcastRoutes = require('./routes/broadcast.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware');

const app = express();

// ─── Security & Parsing Middlewares ──────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static File Serving (uploaded content) ──────────────────────────────────
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'src/uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Content Broadcasting System is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/approval', approvalRoutes);

// ─── Public Broadcasting API ──────────────────────────────────────────────────
// As per spec: GET /content/live/teacher-1, /content/live/teacher-2, etc.
app.use('/content/live', broadcastRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Content Broadcasting System');
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('   Public API:');
  console.log(`   GET http://localhost:${PORT}/content/live/teacher-1`);
  console.log(`   GET http://localhost:${PORT}/content/live/teacher-2`);
  console.log('');
  console.log('   Private API:');
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/content/upload`);
  console.log(`   PATCH http://localhost:${PORT}/api/approval/:contentId`);
  console.log('');
});

module.exports = app;
