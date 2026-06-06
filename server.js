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

// Sessão (necessária para o Passport)
app.use(session({
  secret: 'segredo_super_secreto_para_sessao',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // em produção use true com HTTPS
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB
mongoose.connect('mongodb+srv://santoantonioparoquia:paroquia@cluster0.i2ght.mongodb.net/votacao', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Rotas
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// Frontend
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor em http://localhost:${PORT}`);
});