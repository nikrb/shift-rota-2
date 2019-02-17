const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  start_time: Date,
  end_time: Date,
  notes: String,
});

module.exports = mongoose.model('Shift', ShiftSchema);
