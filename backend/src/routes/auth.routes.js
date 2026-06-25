const router = require('express').Router();
const User = require('../models/User.model');
const { login, changePassword } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { loginRules } = require('../middleware/leadValidators');
const { updateProfileRules } = require('../middleware/employeeValidators');
const asyncHandler = require('../utils/asyncHandler');

router.post('/login', loginRules, validate, login);
const auth = require('../middleware/auth');

// Change password (logged-in user)
router.patch('/change-password', auth, changePassword);

router.patch('/profile', auth, updateProfileRules, validate, asyncHandler(async (req, res) => {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone },
        { new: true }
    );
    res.json({
        message: 'Profile updated',
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            phone: user.phone,
        },
    });
}));

// Push token save karo
router.post('/push-token', auth, asyncHandler(async (req, res) => {
    const { pushToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { pushToken });
    res.json({ message: 'Push token saved' });
}));

module.exports = router;
