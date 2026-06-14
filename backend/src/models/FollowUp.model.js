const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead', required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', followUpSchema);