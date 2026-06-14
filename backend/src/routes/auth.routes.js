const router = require('express').Router();
const { login } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { loginRules } = require('../middleware/leadValidators');
const { loginLimiter } = require('../middleware/rateLimiters');

router.post('/login', loginLimiter, loginRules, validate, login);

module.exports = router;