const router = require('express').Router();
const User = require('../models/User.model');
const { login, changePassword } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { loginRules } = require('../middleware/leadValidators');
const { loginLimiter } = require('../middleware/rateLimiters');

router.post('/login', loginLimiter, loginRules, validate, login);
const auth = require('../middleware/auth');

// Change password (logged-in user)
router.patch('/change-password', auth, changePassword);

router.patch('/profile', auth, async (req, res) => {
    const { name, phone } = req.body;
    try {
        await User.findByIdAndUpdate(req.user._id, { name, phone });
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Push token save karo
router.post('/push-token', auth, async (req, res) => {
  try {
    const { pushToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { pushToken });
    res.json({ message: 'Push token saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
