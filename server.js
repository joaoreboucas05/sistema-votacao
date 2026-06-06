const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// Forçar HTTPS em produção (se o header x-forwarded-proto indicar http)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// 2. Sessão (antes do passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_super_secreto_para_sessao',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: true,      // ← Mude para true (HTTPS em produção)
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// 3. Passport
app.use(passport.initialize());
app.use(passport.session());

// 4. Trust proxy (para Render usar HTTPS corretamente)
app.set('trust proxy', true);

// MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://santoantonioparoquia:paroquia@cluster0.i2ght.mongodb.net/votacao', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Rotas
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// Frontend (curinga para SPA)
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`🚀 Servidor em ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});
