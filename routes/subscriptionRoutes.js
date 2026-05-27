const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { protect } = require('./authRoutes');

// Helper metadata for plans
const PLAN_DETAILS = {
  Mini: {
    cost: 2.99,
    streamingQuality: 'SD (480p)',
    maxDevices: 1,
    validityDays: 30,
    watchlistLimit: 5,
  },
  Family: {
    cost: 7.99,
    streamingQuality: 'Full HD (1080p)',
    maxDevices: 4,
    validityDays: 30,
    watchlistLimit: 15,
  },
  Ultra: {
    cost: 14.99,
    streamingQuality: 'Ultra HD (4K)',
    maxDevices: 6,
    validityDays: 30,
    watchlistLimit: 50,
  },
};

// @route   POST /api/subscribe
// @desc    Create a new subscription
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  const { planName, testExpiry } = req.body; // testExpiry: boolean to set a 2-minute expiry for testing

  try {
    if (!planName || !PLAN_DETAILS[planName]) {
      return res.status(400).json({ message: 'Invalid subscription plan selected' });
    }

    // Check for existing subscription for this user
    const existingSub = await Subscription.findOne({ userId: req.user._id });
    
    if (existingSub) {
      // Check if the current subscription is still active
      const isExpired = new Date() > existingSub.expiryDate;
      if (!isExpired && existingSub.status === 'Active') {
        return res.status(400).json({
          message: `You already have an active ${existingSub.planName} subscription. Please renew or wait until it expires.`,
        });
      }
    }

    const details = PLAN_DETAILS[planName];
    
    // Calculate expiry date
    let expiryDate;
    if (testExpiry) {
      // 2 minutes for easy testing
      expiryDate = new Date(Date.now() + 2 * 60 * 1000);
    } else {
      expiryDate = new Date(Date.now() + details.validityDays * 24 * 60 * 60 * 1000);
    }

    let subscription;
    if (existingSub) {
      // Update existing subscription
      existingSub.planName = planName;
      existingSub.cost = details.cost;
      existingSub.streamingQuality = details.streamingQuality;
      existingSub.maxDevices = details.maxDevices;
      existingSub.validityDays = details.validityDays;
      existingSub.watchlistLimit = details.watchlistLimit;
      existingSub.expiryDate = expiryDate;
      existingSub.status = 'Active';
      subscription = await existingSub.save();
    } else {
      // Create new subscription record
      subscription = await Subscription.create({
        userId: req.user._id,
        planName,
        cost: details.cost,
        streamingQuality: details.streamingQuality,
        maxDevices: details.maxDevices,
        validityDays: details.validityDays,
        watchlistLimit: details.watchlistLimit,
        expiryDate,
        status: 'Active',
      });
    }

    res.status(201).json({
      message: `Successfully subscribed to the ${planName} plan!`,
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/subscription/renew
// @desc    Renew the existing subscription automatically
// @access  Private
router.put('/subscription/renew', protect, async (req, res) => {
  const { testExpiry } = req.body; // Can pass testExpiry true to extend by 2 mins for testing

  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found to renew. Please subscribe first.' });
    }

    const details = PLAN_DETAILS[subscription.planName];
    let newExpiryDate;

    // Check if current subscription is already expired
    const isExpired = new Date() > subscription.expiryDate;

    if (testExpiry) {
      // Extend 2 minutes from now (or from current expiry date if not expired)
      const baseDate = isExpired ? new Date() : subscription.expiryDate;
      newExpiryDate = new Date(baseDate.getTime() + 2 * 60 * 1000);
    } else {
      // Extend 30 days from now (or from current expiry date if not expired)
      const baseDate = isExpired ? new Date() : subscription.expiryDate;
      newExpiryDate = new Date(baseDate.getTime() + details.validityDays * 24 * 60 * 60 * 1000);
    }

    subscription.expiryDate = newExpiryDate;
    subscription.status = 'Active'; // Reactivate subscription
    const updatedSub = await subscription.save();

    res.json({
      message: `Successfully renewed your ${subscription.planName} plan!`,
      subscription: updatedSub,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/subscription/simulate-expiry
// @desc    Testing endpoint: Force a subscription to expire immediately
// @access  Private
router.put('/subscription/simulate-expiry', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found.' });
    }
    // Set expiry to 1 second ago
    subscription.expiryDate = new Date(Date.now() - 1000);
    subscription.status = 'Expired';
    const updatedSub = await subscription.save();

    res.json({
      message: 'Subscription has been set to expired for testing.',
      subscription: updatedSub,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
