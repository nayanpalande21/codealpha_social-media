const express = require('express');
const router = express.Router();

const Follow = require('../models/Follow');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/follow/:userId
// @desc    Follow a user
router.post('/:userId', authMiddleware, async (req, res, next) => {
  try {
    const targetId = req.params.userId;

    if (targetId === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
    if (existing) {
      return res.status(409).json({ message: 'Already following this user.' });
    }

    await Follow.create({ follower: req.user._id, following: targetId });

    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });

    res.status(201).json({ message: `You are now following ${targetUser.username}.` });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/follow/:userId
// @desc    Unfollow a user
router.delete('/:userId', authMiddleware, async (req, res, next) => {
  try {
    const targetId = req.params.userId;

    const existing = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: targetId,
    });

    if (!existing) {
      return res.status(404).json({ message: 'You are not following this user.' });
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });

    res.json({ message: 'Unfollowed successfully.' });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/follow/:userId/followers
// @desc    List a user's followers
router.get('/:userId/followers', authMiddleware, async (req, res, next) => {
  try {
    const follows = await Follow.find({ following: req.params.userId }).populate(
      'follower',
      'username profilePicture fullName'
    );
    res.json({ followers: follows.map((f) => f.follower) });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/follow/:userId/following
// @desc    List who a user is following
router.get('/:userId/following', authMiddleware, async (req, res, next) => {
  try {
    const follows = await Follow.find({ follower: req.params.userId }).populate(
      'following',
      'username profilePicture fullName'
    );
    res.json({ following: follows.map((f) => f.following) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
