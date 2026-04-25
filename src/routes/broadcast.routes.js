const express = require('express');
const router = express.Router();
const { getLiveContent, listTeachers } = require('../controllers/broadcast.controller');
const rateLimit = require('express-rate-limit');

// Rate limiter for public API (bonus feature)
const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,                  // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

// GET /content/live — List teachers with their live endpoints
router.get('/', publicApiLimiter, listTeachers);

// GET /content/live/:teacherIdentifier — Get live content for a teacher
// teacherIdentifier can be: UUID | teacher-1 | teacher-2 | ...
// Optional: ?subject=maths
router.get('/:teacherIdentifier', publicApiLimiter, getLiveContent);

module.exports = router;
