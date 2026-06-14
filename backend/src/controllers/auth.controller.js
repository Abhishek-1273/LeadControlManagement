const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Defensive guard (route-level validation also runs first)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ message: 'Email ya password galat hai' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'Account inactive hai' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Email ya password galat hai' });
  }

  res.json({
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});