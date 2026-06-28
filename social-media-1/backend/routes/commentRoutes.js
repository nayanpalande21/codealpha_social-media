const express = require('express');
const router = express.Router();

const Comment = require('../models/Comment');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/comments/:postId
// @desc    Add a comment to a post
router.post('/:postId', authMiddleware, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text: text.trim(),
    });

    post.commentsCount += 1;
    await post.save();

    const populated = await comment.populate('user', 'username profilePicture');
    res.status(201).json({ message: 'Comment added.', comment: populated });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/comments/:postId
// @desc    Get all comments for a post
router.get('/:postId', authMiddleware, async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePicture');

    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment (only by its owner)
router.delete('/:commentId', authMiddleware, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }
    if (!comment.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
