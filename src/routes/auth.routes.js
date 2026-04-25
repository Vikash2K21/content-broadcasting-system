const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRegister } = require('../middlewares/validate.middleware');

// POST /api/auth/register
router.post('/register', validateRegister, register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, me);

module.exports = router;
