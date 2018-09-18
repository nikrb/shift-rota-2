const mongoose = require('mongoose');

const ShiftHistorySchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  start_time: Date,
  end_time: Date,
  deleted_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ShiftHistory', ShiftHistorySchema);
