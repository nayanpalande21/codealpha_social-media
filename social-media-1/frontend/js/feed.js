// Handles feed rendering, likes, comments, and post creation

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function heartIconSvg(filled) {
  return filled
    ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 3.7 8 3.1 10 4.3 12 7c2-2.7 4-3.9 6.5-3.3C22 4.5 23.5 8 22 11.7 19.5 16.4 12 21 12 21z"/></svg>`
    : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 3.7 8 3.1 10 4.3 12 7c2-2.7 4-3.9 6.5-3.3C22 4.5 23.5 8 22 11.7 19.5 16.4 12 21 12 21z"/></svg>`;
}

function commentIconSvg() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5A8.5 8.5 0 1 1 21 11.5z"/></svg>`;
}

function renderPostCard(post) {
  const isLiked = post.likes && post.likes.includes(currentUser.id);
  const wrapper = document.createElement('div');
  wrapper.className = 'post-card';
  wrapper.dataset.postId = post._id;

  wrapper.innerHTML = `
    <div class="post-header">
      <div class="post-header-user" data-username="${post.user.username}">
        <img src="${post.user.profilePicture}" alt="${post.user.username}" />
        <span class="username">${escapeHtml(post.user.username)}</span>
      </div>
      ${post.user._id === currentUser.id ? `<button class="delete-post-btn" title="Delete post" style="color:var(--text-secondary);">&times;</button>` : ''}
    </div>
    <img class="post-image" src="${post.imageUrl}" alt="Post" loading="lazy" />
    <div class="post-actions">
      <div class="post-actions-left">
        <button class="icon-btn like-btn ${isLiked ? 'liked' : ''}">${heartIconSvg(isLiked)}</button>
        <button class="icon-btn comment-toggle-btn">${commentIconSvg()}</button>
      </div>
    </div>
    <div class="post-likes">${post.likesCount || 0} likes</div>
    ${post.caption ? `<div class="post-caption"><span class="username">${escapeHtml(post.user.username)}</span>${escapeHtml(post.caption)}</div>` : ''}
    <div class="post-comments-preview">
      <button class="comment-toggle-btn">${post.commentsCount > 0 ? `View all ${post.commentsCount} comments` : 'Add a comment'}</button>
    </div>
    <div class="post-timestamp">${timeAgo(post.createdAt)}</div>
    <form class="post-add-comment" data-post-id="${post._id}">
      <input type="text" placeholder="Add a comment..." maxlength="500" />
      <button type="submit">Post</button>
    </form>
  `;

  // Like toggle
  wrapper.querySelector('.like-btn').addEventListener('click', async () => {
    try {
      const res = await api.toggleLike(post._id);
      const btn = wrapper.querySelector('.like-btn');
      btn.classList.toggle('liked', res.liked);
      btn.innerHTML = heartIconSvg(res.liked);
      wrapper.querySelector('.post-likes').textContent = `${res.likesCount} likes`;
    } catch (err) {
      showToast(err.message);
    }
  });

  // Open comments modal
  wrapper.querySelectorAll('.comment-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => openPostDetail(post._id));
  });

  // Open profile on username click
  wrapper.querySelector('.post-header-user').addEventListener('click', () => {
    navigateToProfile(post.user.username);
  });

  // Inline quick comment
  const commentForm = wrapper.querySelector('.post-add-comment');
  const commentInput = commentForm.querySelector('input');
  const commentSubmitBtn = commentForm.querySelector('button');
  commentInput.addEventListener('input', () => {
    commentSubmitBtn.classList.toggle('active', commentInput.value.trim().length > 0);
  });
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;
    try {
      await api.addComment(post._id, text);
      commentInput.value = '';
      commentSubmitBtn.classList.remove('active');
      const preview = wrapper.querySelector('.post-comments-preview button');
      const newCount = (post.commentsCount || 0) + 1;
      post.commentsCount = newCount;
      preview.textContent = `View all ${newCount} comments`;
      showToast('Comment added');
    } catch (err) {
      showToast(err.message);
    }
  });

  // Delete post
  const deleteBtn = wrapper.querySelector('.delete-post-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return;
      try {
        await api.deletePost(post._id);
        wrapper.remove();
        showToast('Post deleted');
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  return wrapper;
}

async function loadFeed() {
  const container = document.getElementById('feed-posts');
  container.innerHTML = '<div class="loading-state">Loading feed...</div>';
  try {
    const { posts } = await api.getFeed();
    container.innerHTML = '';
    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No posts yet</h3>
          <p>Follow people or create your first post to see content here.</p>
        </div>`;
      return;
    }
    posts.forEach((post) => container.appendChild(renderPostCard(post)));
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Couldn't load feed</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

async function loadExplore() {
  const container = document.getElementById('explore-posts');
  container.innerHTML = '<div class="loading-state">Loading explore...</div>';
  try {
    const { posts } = await api.getExplore();
    container.innerHTML = '';
    if (posts.length === 0) {
      container.innerHTML = `<div class="empty-state"><h3>Nothing here yet</h3><p>Be the first to share a post.</p></div>`;
      return;
    }
    posts.forEach((post) => container.appendChild(renderPostCard(post)));
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Couldn't load explore</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

async function loadStoriesBar() {
  const bar = document.getElementById('stories-bar');
  bar.innerHTML = '';
  try {
    const { users } = await api.searchUsers('');
    const list = [currentUser, ...users.filter((u) => u.username !== currentUser.username)];
    list.slice(0, 10).forEach((u) => {
      const item = document.createElement('div');
      item.className = 'story-item';
      item.innerHTML = `
        <div class="story-ring"><img src="${u.profilePicture}" alt="${u.username}" /></div>
        <span>${escapeHtml(u.username)}</span>
      `;
      item.addEventListener('click', () => navigateToProfile(u.username));
      bar.appendChild(item);
    });
  } catch (err) {
    // stories are decorative — fail silently
  }
}

// ============ NEW POST MODAL ============
function initNewPostModal() {
  document.getElementById('new-post-btn').addEventListener('click', () => openModal('new-post-modal'));

  document.getElementById('new-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError('new-post-error');
    const imageUrl = document.getElementById('post-image-url').value.trim();
    const caption = document.getElementById('post-caption').value.trim();

    try {
      await api.createPost({ imageUrl, caption });
      closeModal('new-post-modal');
      document.getElementById('new-post-form').reset();
      showToast('Post shared!');
      navigateTo('feed');
    } catch (err) {
      showAuthError('new-post-error', err.message);
    }
  });
}

// ============ POST DETAIL / COMMENTS MODAL ============
let activePostDetailId = null;

async function openPostDetail(postId) {
  activePostDetailId = postId;
  openModal('post-detail-modal');
  await loadPostDetailComments();
}

async function loadPostDetailComments() {
  const container = document.getElementById('post-detail-comments');
  container.innerHTML = '<div class="loading-state">Loading comments...</div>';
  try {
    const { comments } = await api.getComments(activePostDetailId);
    if (comments.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:30px;"><p>No comments yet.</p></div>';
      return;
    }
    container.innerHTML = '';
    comments.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'comment-line';
      row.innerHTML = `<span class="username">${escapeHtml(c.user.username)}</span>${escapeHtml(c.text)}`;
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function initPostDetailModal() {
  document.getElementById('post-detail-comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('post-detail-comment-input');
    const text = input.value.trim();
    if (!text || !activePostDetailId) return;
    try {
      await api.addComment(activePostDetailId, text);
      input.value = '';
      await loadPostDetailComments();
    } catch (err) {
      showToast(err.message);
    }
  });
}

// ============ TOAST ============
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ============ MODAL HELPERS ============
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
function initModalCloseButtons() {
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}
