// Top-level app controller: navigation between views, search, bootstrapping

function navigateTo(view) {
  document.getElementById('feed-view').classList.add('hidden');
  document.getElementById('explore-view').classList.add('hidden');
  document.getElementById('profile-view').classList.add('hidden');

  if (view === 'feed') {
    document.getElementById('feed-view').classList.remove('hidden');
    loadFeed();
    loadStoriesBar();
  } else if (view === 'explore') {
    document.getElementById('explore-view').classList.remove('hidden');
    loadExplore();
  } else if (view === 'profile') {
    document.getElementById('profile-view').classList.remove('hidden');
  }
}

function initNav() {
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.dataset.nav;
      if (target === 'my-profile') {
        navigateToProfile(currentUser.username);
      } else {
        navigateTo(target);
      }
    });
  });

  document.getElementById('logout-btn').addEventListener('click', logout);
}

function initSidebar() {
  document.getElementById('sidebar-avatar').src = currentUser.profilePicture;
  document.getElementById('sidebar-username').textContent = currentUser.username;
  document.getElementById('sidebar-fullname').textContent = currentUser.fullName || '';
  document.getElementById('nav-avatar').src = currentUser.profilePicture;
  loadSuggestions();
}

async function loadSuggestions() {
  const list = document.getElementById('suggestions-list');
  list.innerHTML = '';
  try {
    const { users } = await api.searchUsers('');
    const filtered = users.filter((u) => u.username !== currentUser.username).slice(0, 5);
    filtered.forEach((u) => {
      const row = document.createElement('div');
      row.className = 'suggestion-row';
      row.innerHTML = `
        <div class="suggestion-row-user" style="cursor:pointer;">
          <img src="${u.profilePicture}" alt="${u.username}" />
          <div>
            <div class="username">${escapeHtml(u.username)}</div>
            <div class="subtext">Suggested for you</div>
          </div>
        </div>
        <button class="follow-link-btn">Follow</button>
      `;
      row.querySelector('.suggestion-row-user').addEventListener('click', () => navigateToProfile(u.username));
      row.querySelector('.follow-link-btn').addEventListener('click', async () => {
        try {
          await api.followUser(u._id);
          row.remove();
          showToast(`Following ${u.username}`);
        } catch (err) {
          showToast(err.message);
        }
      });
      list.appendChild(row);
    });
  } catch (err) {
    // suggestions are non-critical — fail silently
  }
}

function initSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) {
      results.classList.remove('open');
      results.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const { users } = await api.searchUsers(q);
        results.innerHTML = '';
        if (users.length === 0) {
          results.innerHTML = '<div class="search-result-row"><span>No users found</span></div>';
        } else {
          users.forEach((u) => {
            const row = document.createElement('div');
            row.className = 'search-result-row';
            row.style.cursor = 'pointer';
            row.innerHTML = `<img src="${u.profilePicture}" alt="${u.username}" /><span>${escapeHtml(u.username)}</span>`;
            row.addEventListener('click', () => {
              navigateToProfile(u.username);
              input.value = '';
              results.classList.remove('open');
            });
            results.appendChild(row);
          });
        }
        results.classList.add('open');
      } catch (err) {
        // ignore search errors silently
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search')) {
      results.classList.remove('open');
    }
  });
}

function enterApp() {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
  initSidebar();
  navigateTo('feed');
}

// ============ BOOTSTRAP ============
document.addEventListener('DOMContentLoaded', () => {
  initAuthView();
  initNav();
  initSearch();
  initNewPostModal();
  initPostDetailModal();
  initEditProfileModal();
  initModalCloseButtons();
  tryAutoLogin();
});
