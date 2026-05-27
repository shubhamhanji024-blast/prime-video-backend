const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    posterUrl: {
      type: String,
      required: [true, 'Movie poster URL is required'],
    },
    genre: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
    },
    rating: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user cannot add the same movie to their watchlist multiple times
watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
