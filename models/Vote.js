const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  workId: { type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: true },
  voterId: { type: String, required: true, unique: true }, // cada pessoa votará uma única vez
  votedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vote', voteSchema);