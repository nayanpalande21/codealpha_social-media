const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Follow = require('../models/Follow');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/users/search?q=term
// @desc    Search users by username
router.get('/search', authMiddleware, async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
    })
      .select('username fullName profilePicture')
      .limit(20);

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/users/:username
// @desc    Get a user's public profile + whether current user follows them
router.get('/:username', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isFollowing = await Follow.exists({
      follower: req.user._id,
      following: user._id,
    });

    res.json({
      user,
      isFollowing: Boolean(isFollowing),
      isOwnProfile: user._id.equals(req.user._id),
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/users/me
// @desc    Update the logged-in user's profile
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { fullName, bio, profilePicture } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(fullName !== undefined && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(profilePicture !== undefined && { profilePicture }),
      },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated.', user: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
