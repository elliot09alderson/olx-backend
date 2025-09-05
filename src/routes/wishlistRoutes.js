import express from 'express';
import {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  isInWishlist,
  getWishlistCount
} from '../controllers/wishlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticateToken);

// GET /api/wishlist - Get user's wishlist
router.get('/', getUserWishlist);

// GET /api/wishlist/count - Get wishlist count
router.get('/count', getWishlistCount);

// GET /api/wishlist/check/:adId - Check if ad is in wishlist
router.get('/check/:adId', isInWishlist);

// POST /api/wishlist/:adId - Add ad to wishlist
router.post('/:adId', addToWishlist);

// DELETE /api/wishlist/:adId - Remove ad from wishlist
router.delete('/:adId', removeFromWishlist);

export default router;