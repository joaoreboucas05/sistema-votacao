const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  imagemUrl: { type: String, required: true },
  votos: { type: Number, default: 0 }
});

module.exports = mongoose.model('Work', workSchema);
