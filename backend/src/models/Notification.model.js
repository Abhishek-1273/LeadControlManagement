const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Jis user ko notification mili hai
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'alert'],
      default: 'info',
    },
    isRead: { type: Boolean, default: false },
    // Admin jisne bheji
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // true = sabko bheji gayi thi (broadcast)
    broadcast: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Recent notifications jaldi nikalne ke liye
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
