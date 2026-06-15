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
    return res.status(401).json({ message: 'Email or password is wrong' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'Account inactive hai' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Email or password is wrong' });
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

// Change Password (logged-in user)
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Current and new password are required' });
  }
  if (String(newPassword).length < 6) {
    return res
      .status(400)
      .json({ message: 'New password must be at least 6 characters' });
  }
  if (currentPassword === newPassword) {
    return res
      .status(400)
      .json({ message: 'New password must be different from current password' });
  }

  // req.user comes from auth middleware (password excluded) -> reload with password
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword; // pre-save hook will hash it
  await user.save();

  res.json({ message: 'Password changed successfully' });
});
