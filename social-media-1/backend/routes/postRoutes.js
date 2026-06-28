const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const User = require('../models/User');
const Follow = require('../models/Follow');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/posts
// @desc    Create a new post
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { imageUrl, caption } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required.' });
    }

    const post = await Post.create({
      user: req.user._id,
      imageUrl,
      caption,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    const populated = await post.populate('user', 'username profilePicture');
    res.status(201).json({ message: 'Post created.', post: populated });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/posts/feed
// @desc    Get posts from users the current user follows (+ their own)
router.get('/feed', authMiddleware, async (req, res, next) => {
  try {
    const following = await Follow.find({ follower: req.user._id }).select('following');
    const followingIds = following.map((f) => f.following);
    followingIds.push(req.user._id); // include own posts

    const posts = await Post.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePicture');

    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/posts/explore
// @desc    Get all posts (discovery feed)
router.get('/explore', authMiddleware, async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'username profilePicture');

    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get all posts by a specific user
router.get('/user/:userId', authMiddleware, async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePicture');

    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/posts/:id/like
// @desc    Like or unlike a post (toggle)
router.put('/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const alreadyLiked = post.likes.some((id) => id.equals(req.user._id));

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => !id.equals(req.user._id));
    } else {
      post.likes.push(req.user._id);
    }
    post.likesCount = post.likes.length;
    await post.save();

    res.json({ liked: !alreadyLiked, likesCount: post.likesCount });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post (only by its owner)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    if (!post.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own posts.' });
    }

    await post.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });

    res.json({ message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
