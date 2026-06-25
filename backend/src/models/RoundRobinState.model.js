const mongoose = require('mongoose');

// Single-document counter. Atomic $inc ensures no race condition
// even when multiple leads arrive at the same time.
const roundRobinSchema = new mongoose.Schema({
  _id:   { type: String, default: 'singleton' },
  index: { type: Number, default: 0 },
});

module.exports = mongoose.model('RoundRobinState', roundRobinSchema);