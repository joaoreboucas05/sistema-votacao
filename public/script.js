const API_BASE = '/api';
let voterId = localStorage.getItem('voterId');
if (!voterId) {
  voterId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  localStorage.setItem('voterId', voterId);
}

let userHasVoted = false;
let votedWorkId = null;
let currentUser = null;

// ==================== LOGIN / LOGOUT ====================
async function checkAuth() {
  try {
    const res = await fetch('/auth/me');
    const data = await res.json();
    currentUser = data.user;
    updateUIForUser();
  } catch (err) {
    console.error('Erro ao verificar login:', err);
  }
}

function updateUIForUser() {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addBtn = document.getElementById('add-work-btn');
  const userSpan = document.getElementById('user-info');

  if (currentUser) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    addBtn.style.display = 'inline-block';
    userSpan.innerHTML = `👋 Olá, ${currentUser.displayName || currentUser.name.givenName || 'Artista'} | `;
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    addBtn.style.display = 'none';
    userSpan.innerHTML = '';
  }
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
  window.location.href = '/auth/logout';
});

// ==================== VOTAÇÃO ====================
async function loadUserVoteStatus() {
  try {
    const res = await fetch(`${API_BASE}/user/vote-status/${voterId}`);
    const data = await res.json();
    userHasVoted = data.hasVoted;
    votedWorkId = data.workId;
    const msgDiv = document.getElementById('status-message');
    if (userHasVoted) msgDiv.innerHTML = `✅ Você já votou. Seu voto foi registrado.`;
    else msgDiv.innerHTML = `✨ Você ainda não votou. Escolha sua obra favorita!`;
  } catch (err) {
    console.error(err);
  }
}

async function fetchWorks() {
  try {
    const res = await fetch(`${API_BASE}/works`);
    const works = await res.json();
    renderGallery(works);
  } catch (err) {
    document.getElementById('gallery').innerHTML = '<div class="loading">⚠️ Falha ao carregar obras.</div>';
  }
}

function renderGallery(works) {
  const gallery = document.getElementById('gallery');
  if (!works.length) {
    gallery.innerHTML = '<div class="loading">Nenhuma obra encontrada.</div>';
    return;
  }
  gallery.innerHTML = '';
  works.forEach(work => {
    const card = document.createElement('div');
    card.className = 'card';
    const isVotedByUser = userHasVoted && votedWorkId === work._id;
    const disableButton = userHasVoted;
    card.innerHTML = `
      <img class="card-img" src="${work.imagemUrl}" alt="${work.titulo}" loading="lazy">
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(work.titulo)}</h3>
        <div class="card-author">✍️ ${escapeHtml(work.autor)}</div>
        <div class="card-footer">
          <div class="votes-count">👍 <span>${work.votos}</span> voto${work.votos !== 1 ? 's' : ''}</div>
          <button class="vote-btn" data-id="${work._id}" ${disableButton ? 'disabled' : ''}>
            ${isVotedByUser ? '✓ Votado' : 'Votar'}
          </button>
        </div>
      </div>
    `;
    gallery.appendChild(card);
  });
  if (!userHasVoted) {
    document.querySelectorAll('.vote-btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const workId = btn.getAttribute('data-id');
        confirmVote(workId);
      });
    });
  }
}

async function confirmVote(workId) {
  if (!confirm('Você só pode votar UMA vez. Confirma?')) return;
  try {
    const res = await fetch(`${API_BASE}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId, voterId })
    });
    if (res.status === 409) {
      alert('Você já votou anteriormente.');
      location.reload();
      return;
    }
    if (!res.ok) throw new Error('Erro ao votar');
    userHasVoted = true;
    votedWorkId = workId;
    document.getElementById('status-message').innerHTML = `🎉 Obrigado pelo seu voto!`;
    fetchWorks();
  } catch (err) {
    alert(err.message);
  }
}

// ==================== MODAL DE ADICIONAR OBRA ====================
// ========== ADICIONAR OBRA - VERSÃO CORRIGIDA ==========
const form = document.getElementById('add-work-form');
const modal = document.getElementById('modal');
const addBtn = document.getElementById('add-work-btn');
const closeSpan = document.querySelector('.close');
const imgInput = document.getElementById('imagem-input');
const previewDiv = document.getElementById('image-preview');

addBtn?.addEventListener('click', () => {
  modal.style.display = 'block';
});
closeSpan?.addEventListener('click', () => {
  modal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

imgInput?.addEventListener('change', function(e) {
  previewDiv.innerHTML = '';
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = document.createElement('img');
      img.src = ev.target.result;
      previewDiv.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

// 👇🏻 SUBSTITUA A FUNÇÃO ANTERIOR POR ESTA:
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    alert('Você precisa estar logado para adicionar uma obra.');
    return;
  }

  // Coleta manual dos campos
  const titulo = document.querySelector('input[name="titulo"]')?.value;
  const autor = document.querySelector('input[name="autor"]')?.value;
  const imagemFile = imgInput?.files[0];

  if (!titulo || !autor || !imagemFile) {
    alert('Todos os campos e a imagem são obrigatórios.');
    return;
  }

  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('autor', autor);
  formData.append('imagem', imagemFile);

  try {
    const res = await fetch('/api/works', {
      method: 'POST',
      body: formData,
      credentials: 'include'
      // Não coloque headers! O navegador define o boundary automaticamente.
    });

    if (res.status === 401) {
      alert('Login necessário. Faça login com Google primeiro.');
      return;
    }

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Erro no servidor');
    }

    const newWork = await res.json();
    alert(`Obra "${newWork.titulo}" adicionada com sucesso!`);
    modal.style.display = 'none';
    form.reset();
    previewDiv.innerHTML = '';
    fetchWorks(); // recarrega a galeria
  } catch (err) {
    console.error('Erro no upload:', err);
    alert('Erro ao enviar: ' + err.message);
  }
});

// ========== LIGHTBOX / MODAL DE IMAGEM ==========
const imageModal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const modalCaption = document.getElementById('imageModalCaption');
const closeModalBtn = document.querySelector('.image-modal-close');

// Função para abrir o modal com a imagem clicada
function openImageModal(imgSrc, imgAlt) {
  modalImg.src = imgSrc;
  modalCaption.textContent = imgAlt || 'Imagem da obra';
  imageModal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // evita rolagem do fundo
}

// Fechar modal ao clicar no X
closeModalBtn.onclick = function() {
  imageModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Fechar modal ao clicar fora da imagem (no fundo escuro)
imageModal.onclick = function(event) {
  if (event.target === imageModal) {
    imageModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Tecla ESC fecha o modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && imageModal.style.display === 'block') {
    imageModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
});

// ==================== INIT ====================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

async function init() {
  await checkAuth();
  await loadUserVoteStatus();
  await fetchWorks();
}
init();
