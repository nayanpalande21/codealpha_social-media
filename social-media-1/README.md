# Instagrum — Mini Social Media App

A mini Instagram clone built with **Express.js + MongoDB** (backend) and **vanilla HTML/CSS/JavaScript** (frontend).

## Features
- User registration & login (JWT-based auth, passwords hashed with bcrypt)
- User profiles (avatar, bio, full name) — viewable and editable
- Create posts (image URL + caption)
- Like / unlike posts
- Comment on posts
- Follow / unfollow users
- Home feed (posts from people you follow), Explore feed (everyone), and user search

## Project structure
```
social-media/
├── backend/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── jwt.js         # JWT sign/verify helpers
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   └── Follow.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   └── followRoutes.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── css/
    │   ├── reset.css
    │   └── style.css
    ├── js/
    │   ├── api.js          # fetch wrapper for all API calls
    │   ├── auth.js          # login/register
    │   ├── feed.js           # posts, likes, comments
    │   ├── profile.js        # profile view + edit + follow
    │   └── app.js            # navigation + bootstrap
    └── index.html
```

## Setup

### 1. Install MongoDB
Make sure MongoDB is running locally (`mongodb://localhost:27017`), or update `MONGO_URI` in `backend/.env` to point to a MongoDB Atlas connection string.

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure environment variables
Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/social-media
JWT_SECRET=replace_this_with_a_long_random_string
```

### 4. Run the server
```bash
npm start
```
Or, for auto-restart on changes during development:
```bash
npm run dev
```

### 5. Open the app
Go to **http://localhost:5000** in your browser. The Express server serves the frontend directly — no separate frontend server needed.

## How to use
1. **Sign up** with an email, username, and password.
2. **Create a post** using the `+` icon — paste any image URL (e.g. from Unsplash) and add a caption.
3. **Search** for other users in the top search bar, visit their profile, and **follow** them.
4. Their posts will then show up in your **Home** feed. Use **Explore** to see everyone's posts.
5. **Like** and **comment** on posts directly from the feed.
6. Click your avatar to view/edit your own profile.

## API overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/users/:username` | Get a user's profile |
| PUT | `/api/users/me` | Update own profile |
| GET | `/api/users/search?q=` | Search users |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/feed` | Feed (following + self) |
| GET | `/api/posts/explore` | All posts |
| GET | `/api/posts/user/:userId` | Posts by a user |
| PUT | `/api/posts/:id/like` | Toggle like |
| DELETE | `/api/posts/:id` | Delete own post |
| POST | `/api/comments/:postId` | Add comment |
| GET | `/api/comments/:postId` | Get comments |
| DELETE | `/api/comments/:commentId` | Delete own comment |
| POST | `/api/follow/:userId` | Follow user |
| DELETE | `/api/follow/:userId` | Unfollow user |
| GET | `/api/follow/:userId/followers` | List followers |
| GET | `/api/follow/:userId/following` | List following |

## Notes
- Images are stored as **URLs only** (no file upload) — paste a link when creating a post or setting a profile picture.
- All protected routes require a `Authorization: Bearer <token>` header, handled automatically by the frontend once you log in (token is stored in `localStorage`).
