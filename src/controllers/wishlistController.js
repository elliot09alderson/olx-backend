import Wishlist from '../models/Wishlist.js';
import Ad from '../models/Ad.js';

// Add ad to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user._id;

    // Check if ad exists and is active
    const ad = await Ad.findById(adId);
    if (!ad || ad.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or not available'
      });
    }

    // Check if user is trying to add their own ad
    if (ad.user.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own ad to wishlist'
      });
    }

    // Check if already in wishlist
    const existingWishlistItem = await Wishlist.findOne({
      user: userId,
      ad: adId
    });

    if (existingWishlistItem) {
      return res.status(400).json({
        success: false,
        message: 'Ad is already in your wishlist'
      });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({
      user: userId,
      ad: adId
    });

    await wishlistItem.save();

    res.status(201).json({
      success: true,
      message: 'Ad added to wishlist successfully',
      data: wishlistItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove ad from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user._id;

    const wishlistItem = await Wishlist.findOneAndDelete({
      user: userId,
      ad: adId
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Ad removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's wishlist
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get wishlist with populated ad details
    const wishlistItems = await Wishlist.find({ user: userId })
      .populate({
        path: 'ad',
        populate: {
          path: 'user',
          select: 'fullname email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out wishlist items where ad might have been deleted
    const validWishlistItems = wishlistItems.filter(item => item.ad);

    // Get total count for pagination
    const total = await Wishlist.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        wishlistItems: validWishlistItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check if ad is in user's wishlist
export const isInWishlist = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user._id;

    const wishlistItem = await Wishlist.findOne({
      user: userId,
      ad: adId
    });

    res.json({
      success: true,
      data: {
        isInWishlist: !!wishlistItem
      }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wishlist count for user
export const getWishlistCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Wishlist.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        count
      }
    });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};