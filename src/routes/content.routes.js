const express = require('express');
const router = express.Router();
const {
  upload,
  getMyContent,
  getAllContent,
  getPendingContent,
  getContentById,
} = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');
const { validateContentUpload } = require('../middlewares/validate.middleware');

// POST /api/content/upload — Teacher only
router.post(
  '/upload',
  authenticate,
  authorize('teacher'),
  uploadSingle('file'),
  validateContentUpload,
  upload
);

// GET /api/content/my — Teacher views their own content
router.get('/my', authenticate, authorize('teacher'), getMyContent);

// GET /api/content/pending — Principal only
router.get('/pending', authenticate, authorize('principal'), getPendingContent);

// GET /api/content — Principal sees all content
router.get('/', authenticate, authorize('principal'), getAllContent);

// GET /api/content/:id — Both roles (teacher sees only their own)
router.get('/:id', authenticate, authorize('principal', 'teacher'), getContentById);

module.exports = router;
