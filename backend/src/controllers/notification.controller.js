const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const sendPushNotification = require('../utils/sendPushNotification');

const VALID_TYPES = ['info', 'success', 'warning', 'alert'];

// --- ADMIN: Send notification to one user OR all users ---
exports.sendNotification = asyncHandler(async (req, res) => {
  const { title, message, target } = req.body;
  let { type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }
  if (!target) {
    return res.status(400).json({ message: 'Target is required (all or a user id)' });
  }
  if (type && !VALID_TYPES.includes(type)) type = 'info';

  // Broadcast to everyone (saare active users, admin ko chhod ke)
  if (target === 'all') {
    const users = await User.find({ isActive: true, _id: { $ne: req.user._id } })
      .select('_id pushToken');  // ← pushToken bhi select karo

    if (!users.length) {
      return res.status(400).json({ message: 'No recipients found' });
    }

    const docs = users.map((u) => ({
      user: u._id,
      title: title.trim(),
      message: message.trim(),
      type: type || 'info',
      createdBy: req.user._id,
      broadcast: true,
    }));
    await Notification.insertMany(docs);

    // Push notifications sabko bhejo (ek fail ho toh baki rok mat)
    await Promise.allSettled(
      users
        .filter((u) => u.pushToken)
        .map((u) => sendPushNotification(u.pushToken, title.trim(), message.trim()))
    );

    return res.status(201).json({
      message: `Notification sent to ${docs.length} user(s)`,
      count: docs.length,
    });
  }

  // Single user
  const recipient = await User.findById(target).select('_id isActive pushToken'); // ← pushToken
  if (!recipient) {
    return res.status(404).json({ message: 'User not found' });
  }

  await Notification.create({
    user: recipient._id,
    title: title.trim(),
    message: message.trim(),
    type: type || 'info',
    createdBy: req.user._id,
    broadcast: false,
  });

  // Push notification single user ko
  if (recipient.pushToken) {
    await sendPushNotification(recipient.pushToken, title.trim(), message.trim());
  }

  res.status(201).json({ message: 'Notification sent', count: 1 });
});

// --- Current user ki notifications ---
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.json({ notifications, unreadCount });
});

// --- Sirf unread count ---
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });
  res.json({ unreadCount });
});

// --- Ek notification ko read mark karo ---
exports.markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notif) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ message: 'Marked as read', notification: notif });
});

// --- Saari read mark karo ---
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ message: 'All notifications marked as read' });
});

// --- Ek notification delete karo ---
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notif) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ message: 'Notification deleted' });
});