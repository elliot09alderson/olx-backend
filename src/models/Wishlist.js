import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true
  }
}, {
  timestamps: true
});

// Create compound index to ensure a user can't add the same ad to wishlist twice
wishlistSchema.index({ user: 1, ad: 1 }, { unique: true });

// Index for better query performance
wishlistSchema.index({ user: 1, createdAt: -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;