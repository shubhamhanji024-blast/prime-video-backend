const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One subscription profile per user
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      enum: {
        values: ['Mini', 'Family', 'Ultra'],
        message: '{VALUE} is not a valid plan name',
      },
    },
    cost: {
      type: Number,
      required: true,
    },
    streamingQuality: {
      type: String,
      required: true,
    },
    maxDevices: {
      type: Number,
      required: true,
    },
    validityDays: {
      type: Number,
      required: true,
      default: 30,
    },
    watchlistLimit: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Expired'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property to check if subscription is currently expired based on date
subscriptionSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryDate;
});

// Enforce virtual fields to serialize into JSON
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
