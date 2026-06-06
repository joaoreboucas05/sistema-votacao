const express = require('express');
const router = express.Router();
const Work = require('../models/Work');
const Vote = require('../models/Vote');
const upload = require('../middleware/upload');
const path = require('path');

// GET todas as obras (público)
router.get('/works', async (req, res) => {
  try {
    const works = await Work.find().sort({ votos: -1 });
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST nova obra – somente para usuários autenticados
router.post('/works', 
  (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Login necessário' });
    next();

    console.log('Body:', req.body);
console.log('File:', req.file);
  },
  upload.single('imagem'),
  async (req, res) => {
    try {
      const { titulo, autor } = req.body;
      if (!titulo || !autor || !req.file) {
        return res.status(400).json({ error: 'Todos os campos e a imagem são obrigatórios' });
      }

      const imagemUrl = `/uploads/${req.file.filename}`;

      const newWork = new Work({
        titulo,
        autor,
        imagemUrl,
        votos: 0
      });

      await newWork.save();
      res.status(201).json(newWork);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    
  }
);

// Verificar voto (público)
router.get('/user/vote-status/:voterId', async (req, res) => {
  try {
    const vote = await Vote.findOne({ voterId: req.params.voterId });
    if (vote) res.json({ hasVoted: true, workId: vote.workId });
    else res.json({ hasVoted: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar voto (público)
router.post('/vote', async (req, res) => {
  const { workId, voterId } = req.body;
  if (!workId || !voterId) return res.status(400).json({ error: 'Dados incompletos' });
  try {
    const existingVote = await Vote.findOne({ voterId });
    if (existingVote) return res.status(409).json({ error: 'Já votou' });

    const newVote = new Vote({ workId, voterId });
    await newVote.save();
    await Work.findByIdAndUpdate(workId, { $inc: { votos: 1 } });
    const updatedWork = await Work.findById(workId);
    res.json({ success: true, work: updatedWork });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Voto duplicado' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
