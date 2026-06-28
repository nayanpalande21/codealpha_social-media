// Handles login / register form interactions

let currentUser = null;

function showAuthError(elId, message) {
  const el = document.getElementById(elId);
  el.textContent = message;
  el.classList.add('visible');
}

function clearAuthError(elId) {
  const el = document.getElementById(elId);
  el.textContent = '';
  el.classList.remove('visible');
}

function initAuthView() {
  const loginCard = document.getElementById('login-card');
  const registerCard = document.getElementById('register-card');
  const registerFooter = document.getElementById('register-footer');
  const loginFooter = document.querySelector('.auth-footer-card:not(#register-footer)');

  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginCard.classList.add('hidden');
    loginFooter.classList.add('hidden');
    registerCard.classList.remove('hidden');
    registerFooter.classList.remove('hidden');
  });

  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerCard.classList.add('hidden');
    registerFooter.classList.add('hidden');
    loginCard.classList.remove('hidden');
    loginFooter.classList.remove('hidden');
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError('login-error');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const data = await api.login({ email, password });
      setToken(data.token);
      currentUser = data.user;
      enterApp();
    } catch (err) {
      showAuthError('login-error', err.message);
    }
  });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError('register-error');
    const email = document.getElementById('register-email').value.trim();
    const fullName = document.getElementById('register-fullname').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      const data = await api.register({ email, fullName, username, password });
      setToken(data.token);
      currentUser = data.user;
      enterApp();
    } catch (err) {
      showAuthError('register-error', err.message);
    }
  });
}

function showAuthView() {
  document.getElementById('auth-view').classList.remove('hidden');
  document.getElementById('app-view').classList.add('hidden');
}

async function tryAutoLogin() {
  const token = getToken();
  if (!token) {
    showAuthView();
    return;
  }
  try {
    const data = await api.me();
    currentUser = data.user;
    enterApp();
  } catch (err) {
    clearToken();
    showAuthView();
  }
}

function logout() {
  clearToken();
  currentUser = null;
  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
  showAuthView();
}
