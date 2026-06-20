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

// "Today's follow-ups" queries filter by employee + date + isCompleted.
followUpSchema.index({ employee: 1, date: 1, isCompleted: 1 });
followUpSchema.index({ lead: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
