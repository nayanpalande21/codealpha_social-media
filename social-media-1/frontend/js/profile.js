// Handles profile view rendering and edit profile modal

let viewedProfileUser = null;

async function navigateToProfile(username) {
  navigateTo('profile');
  await loadProfile(username);
}

async function loadProfile(username) {
  const grid = document.getElementById('profile-grid');
  grid.innerHTML = '<div class="loading-state">Loading profile...</div>';

  try {
    const { user, isFollowing, isOwnProfile } = await api.getUserProfile(username);
    viewedProfileUser = user;

    document.getElementById('profile-avatar-img').src = user.profilePicture;
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-posts-count').textContent = user.postsCount;
    document.getElementById('profile-followers-count').textContent = user.followersCount;
    document.getElementById('profile-following-count').textContent = user.followingCount;
    document.getElementById('profile-fullname').textContent = user.fullName || '';
    document.getElementById('profile-bio').textContent = user.bio || '';

    const editBtn = document.getElementById('profile-edit-btn');
    const followBtn = document.getElementById('profile-follow-btn');

    if (isOwnProfile) {
      editBtn.classList.remove('hidden');
      followBtn.classList.add('hidden');
    } else {
      editBtn.classList.add('hidden');
      followBtn.classList.remove('hidden');
      setFollowButtonState(followBtn, isFollowing);
      followBtn.onclick = () => handleFollowToggle(user._id, followBtn);
    }

    await loadProfilePosts(user._id);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Couldn't load profile</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function setFollowButtonState(btn, isFollowing) {
  btn.textContent = isFollowing ? 'Following' : 'Follow';
  btn.classList.toggle('btn-primary', !isFollowing);
  btn.classList.toggle('btn-secondary', isFollowing);
}

async function handleFollowToggle(userId, btn) {
  const currentlyFollowing = btn.textContent.trim() === 'Following';
  try {
    if (currentlyFollowing) {
      await api.unfollowUser(userId);
      setFollowButtonState(btn, false);
      document.getElementById('profile-followers-count').textContent =
        parseInt(document.getElementById('profile-followers-count').textContent, 10) - 1;
    } else {
      await api.followUser(userId);
      setFollowButtonState(btn, true);
      document.getElementById('profile-followers-count').textContent =
        parseInt(document.getElementById('profile-followers-count').textContent, 10) + 1;
    }
  } catch (err) {
    showToast(err.message);
  }
}

async function loadProfilePosts(userId) {
  const grid = document.getElementById('profile-grid');
  try {
    const { posts } = await api.getUserPosts(userId);
    if (posts.length === 0) {
      grid.innerHTML = `<div class="empty-state"><h3>No posts yet</h3><p>When this user shares photos, they'll appear here.</p></div>`;
      return;
    }
    grid.innerHTML = '';
    posts.forEach((post) => {
      const item = document.createElement('div');
      item.className = 'profile-grid-item';
      item.innerHTML = `<img src="${post.imageUrl}" alt="Post" loading="lazy" />`;
      item.addEventListener('click', () => openPostDetail(post._id));
      grid.appendChild(item);
    });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function initEditProfileModal() {
  document.getElementById('profile-edit-btn').addEventListener('click', () => {
    document.getElementById('edit-profile-picture').value = viewedProfileUser.profilePicture || '';
    document.getElementById('edit-fullname').value = viewedProfileUser.fullName || '';
    document.getElementById('edit-bio').value = viewedProfileUser.bio || '';
    openModal('edit-profile-modal');
  });

  document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError('edit-profile-error');

    const profilePicture = document.getElementById('edit-profile-picture').value.trim();
    const fullName = document.getElementById('edit-fullname').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();

    try {
      const { user } = await api.updateProfile({ profilePicture, fullName, bio });
      currentUser.profilePicture = user.profilePicture;
      document.getElementById('nav-avatar').src = user.profilePicture;
      document.getElementById('sidebar-avatar').src = user.profilePicture;
      closeModal('edit-profile-modal');
      showToast('Profile updated');
      loadProfile(user.username);
    } catch (err) {
      showAuthError('edit-profile-error', err.message);
    }
  });
}
