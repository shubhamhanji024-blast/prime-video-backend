const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const Subscription = require('../models/Subscription');
const { protect } = require('./authRoutes');

// @route   POST /api/watchlist/add
// @desc    Add a movie to the user's watchlist
// @access  Private
router.post('/watchlist/add', protect, async (req, res) => {
  const { movieId, title, posterUrl, genre, year, rating, description } = req.body;

  try {
    if (!movieId || !title || !posterUrl) {
      return res.status(400).json({ message: 'Movie ID, title, and poster URL are required' });
    }

    // Retrieve the user's subscription status
    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription) {
      return res.status(403).json({
        message: 'No active subscription found. Please subscribe to a plan to add movies to your watchlist.',
      });
    }

    // Check if the subscription is expired
    const isExpired = new Date() > subscription.expiryDate;
    if (isExpired || subscription.status === 'Expired') {
      // Auto-update status to Expired just in case
      if (subscription.status !== 'Expired') {
        subscription.status = 'Expired';
        await subscription.save();
      }
      return res.status(403).json({
        message: 'Your subscription has expired! Please renew your subscription to add movies to your watchlist.',
        isExpired: true,
      });
    }

    // Check if the movie is already in the watchlist
    const alreadyInWatchlist = await Watchlist.findOne({ userId: req.user._id, movieId });
    if (alreadyInWatchlist) {
      return res.status(400).json({ message: 'This movie is already in your watchlist' });
    }

    // Count the current watchlist size
    const watchlistCount = await Watchlist.countDocuments({ userId: req.user._id });

    // Enforce watchlist limit from subscription details
    if (watchlistCount >= subscription.watchlistLimit) {
      return res.status(400).json({
        message: `Watchlist capacity reached! Your ${subscription.planName} plan allows a maximum of ${subscription.watchlistLimit} movies. Please upgrade to a higher plan to add more.`,
      });
    }

    // Create the watchlist entry
    const watchlistItem = await Watchlist.create({
      userId: req.user._id,
      movieId,
      title,
      posterUrl,
      genre,
      year,
      rating,
      description,
    });

    res.status(201).json({
      message: 'Added to watchlist successfully',
      watchlistItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/watchlist
// @desc    Get user's watchlist
// @access  Private
router.get('/watchlist', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const count = await Watchlist.countDocuments({ userId: req.user._id });
    res.json({
      count,
      watchlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/watchlist/:movieId
// @desc    Remove a movie from user's watchlist
// @access  Private
router.delete('/watchlist/:movieId', protect, async (req, res) => {
  const { movieId } = req.params;

  try {
    const result = await Watchlist.findOneAndDelete({ userId: req.user._id, movieId });

    if (!result) {
      return res.status(404).json({ message: 'Movie not found in your watchlist' });
    }

    res.json({
      message: 'Removed from watchlist successfully',
      movieId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
