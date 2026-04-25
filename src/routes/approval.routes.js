const express = require('express');
const router = express.Router();
const { processApproval } = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateApproval } = require('../middlewares/validate.middleware');

// PATCH /api/approval/:contentId — Principal only
router.patch(
  '/:contentId',
  authenticate,
  authorize('principal'),
  validateApproval,
  processApproval
);

module.exports = router;
