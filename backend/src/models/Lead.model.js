const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const timelineSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['created', 'status_changed', 'note_added',
      'followup_added', 'assigned']
  },
  description: String,
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  secondaryPhone: { type: String, default: '' },
  email: { type: String },
  city: { type: String },
  source: { type: String, default: 'Unknown' },
  campaign: { type: String },
  message: { type: String },
  car: { type: String },
  visitorDate: { type: String },

  status: {
    type: String,
    enum: [
      'New Lead', 'Contacted', 'Follow Up',
      'Interested', 'Visitor', 'Booked',
      'Uninterested', 'No Response'
    ],
    default: 'New Lead',
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPinned: { type: Boolean, default: false },
  notes: [noteSchema],
  timeline: [timelineSchema],
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);