import express from 'express';
import { 
  createAd, 
  getAds, 
  getAdBySlug, 
  getUserAds, 
  updateAd, 
  deleteAd 
} from '../controllers/adController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../utils/imageUpload.js';

const router = express.Router();

// Public routes
// GET /api/ads - Get all ads with search and filters
router.get('/', getAds);

// GET /api/ads/:slug - Get single ad by slug
router.get('/:slug', getAdBySlug);

// Protected routes (require authentication)
// POST /api/ads - Create new ad
router.post('/', 
  authenticateToken, 
  upload.array('images', 4), 
  createAd
);

// GET /api/ads/user/my-ads - Get user's ads
router.get('/user/my-ads', authenticateToken, getUserAds);

// PUT /api/ads/:id - Update ad
router.put('/:id', 
  authenticateToken, 
  upload.array('images', 4), 
  updateAd
);

// DELETE /api/ads/:id - Delete ad
router.delete('/:id', authenticateToken, deleteAd);

export default router;