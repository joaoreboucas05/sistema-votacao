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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_super_secreto_para_sessao',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, sameSite: 'lax' }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
app.set('trust proxy', true);

// MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://santoantonioparoquia:paroquia@cluster0.i2ght.mongodb.net/votacao')
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Rotas da API (devem vir PRIMEIRO)
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// Rota curinga para o frontend (deve ser a ÚLTIMA)
// Se estiver usando Express 4:
//app.get('*', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'index.html'));
//});
// Se estiver usando Express 5, substitua a linha acima por:
app.get('/*splat', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
 });

app.listen(PORT, () => {
  console.log(`🚀 Servidor em ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
});
