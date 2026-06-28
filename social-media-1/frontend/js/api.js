// Centralized API helper. Every backend call goes through here.

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('ig_token');
}

function setToken(token) {
  localStorage.setItem('ig_token', token);
}

function clearToken() {
  localStorage.removeItem('ig_token');
}

async function apiRequest(path, { method = 'GET', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

const api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  me: () => apiRequest('/auth/me'),

  // Users
  getUserProfile: (username) => apiRequest(`/users/${username}`),
  updateProfile: (payload) => apiRequest('/users/me', { method: 'PUT', body: payload }),
  searchUsers: (q) => apiRequest(`/users/search?q=${encodeURIComponent(q)}`),

  // Posts
  createPost: (payload) => apiRequest('/posts', { method: 'POST', body: payload }),
  getFeed: () => apiRequest('/posts/feed'),
  getExplore: () => apiRequest('/posts/explore'),
  getUserPosts: (userId) => apiRequest(`/posts/user/${userId}`),
  toggleLike: (postId) => apiRequest(`/posts/${postId}/like`, { method: 'PUT' }),
  deletePost: (postId) => apiRequest(`/posts/${postId}`, { method: 'DELETE' }),

  // Comments
  getComments: (postId) => apiRequest(`/comments/${postId}`),
  addComment: (postId, text) => apiRequest(`/comments/${postId}`, { method: 'POST', body: { text } }),
  deleteComment: (commentId) => apiRequest(`/comments/${commentId}`, { method: 'DELETE' }),

  // Follow
  followUser: (userId) => apiRequest(`/follow/${userId}`, { method: 'POST' }),
  unfollowUser: (userId) => apiRequest(`/follow/${userId}`, { method: 'DELETE' }),
  getFollowers: (userId) => apiRequest(`/follow/${userId}/followers`),
  getFollowing: (userId) => apiRequest(`/follow/${userId}/following`),
};
