const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  appointmentDate: { type: String, required: true }, // e.g. "2024-06-25"
  appointmentTime: { type: String, required: true }, // e.g. "16:00"
  description: { type: String, default: '' },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
