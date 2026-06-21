const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const timelineSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['created', 'status_changed', 'note_added',
      'followup_added', 'assigned', 'appointment_set'],
  },
  description: String,
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  // PRIMARY phone — must be exactly 10 digits, unique across the whole collection
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'Phone must be exactly 10 digits'],
    unique: true,   // ← database-level uniqueness guarantee
  },

  secondaryPhone: { type: String, default: '', trim: true },
  email: { type: String, trim: true },
  city: { type: String, trim: true },
  source: { type: String, default: 'Unknown' },
  campaign: { type: String },
  message: { type: String },
  car: { type: String },

  status: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold', 'Follow Up', 'Booked'],
    default: 'Cold',
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPinned: { type: Boolean, default: false },
  notes: [noteSchema],
  timeline: [timelineSchema],
}, { timestamps: true });

// Extra compound index: fast lookup by phone + secondaryPhone together
leadSchema.index({ secondaryPhone: 1 }, { sparse: true });

leadSchema.index({ assignedTo: 1, createdAt: -1 });
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ status: 1, updatedAt: -1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);