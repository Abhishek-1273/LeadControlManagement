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
    unique: true,
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
    enum: ['New', 'Interested', 'Contacted', 'Not Interested', 'Pending', 'Booked', 'Deleted'],
    default: 'New',
  },

  // Bumped only on creation and explicit status change (see updateStatus in
  // lead.controller.js) — NOT on every save. Drives the "moves to top of
  // its filter" ordering, kept separate from `updatedAt` (which also
  // changes on pin/unpin, notes, follow-ups, assignment, etc. — none of
  // which should reorder the list).
  statusUpdatedAt: { type: Date, default: Date.now },

  // Soft-delete fields
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  statusBeforeDelete: { type: String, default: null },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPinned: { type: Boolean, default: false },
  notes: [noteSchema],
  timeline: [timelineSchema],
}, { timestamps: true });

// Indexes
leadSchema.index({ secondaryPhone: 1 }, { sparse: true });
leadSchema.index({ assignedTo: 1, createdAt: -1 });
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ status: 1, updatedAt: -1 });
leadSchema.index({ assignedTo: 1, statusUpdatedAt: -1 });
leadSchema.index({ createdAt: -1 });

// ─── Auto-assign hook ────────────────────────────────────────────────────────
// Runs AFTER a brand-new lead is saved (isNew = true).
// If assignedTo is already set (admin manually assigned), skip.
leadSchema.post('save', async function (doc) {
  if (!doc.wasNew) return;           // only on first insert
  if (doc.assignedTo) return;        // already manually assigned

  try {
    const { getNextEmployee } = require('../utils/autoAssign');
    const employeeId = await getNextEmployee();
    if (!employeeId) return;         // no active employees — leave unassigned

    await doc.constructor.findByIdAndUpdate(doc._id, {
      assignedTo: employeeId,
      $push: {
        timeline: {
          type: 'assigned',
          description: 'Auto-assigned via round-robin',
        },
      },
    });
  } catch (err) {
    // Never crash the main flow because of assignment failure
    console.error('[AutoAssign] Error:', err.message);
  }
});

// We need to know if this was a new document inside post('save'),
// but `this.isNew` is already false by then. So we store it in pre('save').
leadSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

module.exports = mongoose.model('Lead', leadSchema);