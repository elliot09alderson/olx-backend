import Ad from '../models/Ad.js';
import { createAdSchema, updateAdSchema, searchAdsSchema } from '../validations/adValidation.js';
import { uploadMultipleToCloudinary, deleteMultipleFromCloudinary } from '../utils/imageUpload.js';

// Create new ad
export const createAd = async (req, res) => {
  try {
    // Parse form data
    const formData = {
      ...req.body,
      price: parseFloat(req.body.price)
    };

    // Validate request body
    const validatedData = createAdSchema.parse(formData);
    
    // Check if images are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    if (req.files.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 4 images allowed'
      });
    }

    // Upload images to Cloudinary
    const uploadedImages = await uploadMultipleToCloudinary(req.files);

    // Create new ad
    const newAd = new Ad({
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price,
      category: validatedData.category,
      condition: validatedData.condition,
      images: uploadedImages,
      location: {
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode
      },
      user: req.user._id
    });

    await newAd.save();

    // Populate user info
    await newAd.populate('user', 'fullname email');

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      ad: newAd
    });

  } catch (error) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }

    // If image upload fails, clean up uploaded images
    if (req.uploadedImages) {
      try {
        await deleteMultipleFromCloudinary(
          req.uploadedImages.map(img => img.publicId)
        );
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded images:', cleanupError);
      }
    }

    console.error('Create ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all ads with search and filters
export const getAds = async (req, res) => {
  try {
    const validatedQuery = searchAdsSchema.parse({
      ...req.query,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 12,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined
    });

    // Build search filter
    const filter = { status: 'active' };

    if (validatedQuery.query) {
      filter.$text = { $search: validatedQuery.query };
    }

    if (validatedQuery.category) {
      filter.category = validatedQuery.category;
    }

    if (validatedQuery.condition) {
      filter.condition = validatedQuery.condition;
    }

    if (validatedQuery.city) {
      filter['location.city'] = new RegExp(validatedQuery.city, 'i');
    }

    if (validatedQuery.state) {
      filter['location.state'] = new RegExp(validatedQuery.state, 'i');
    }

    if (validatedQuery.minPrice || validatedQuery.maxPrice) {
      filter.price = {};
      if (validatedQuery.minPrice) filter.price.$gte = validatedQuery.minPrice;
      if (validatedQuery.maxPrice) filter.price.$lte = validatedQuery.maxPrice;
    }

    // Build sort object
    const sort = {};
    sort[validatedQuery.sortBy] = validatedQuery.sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get ads and total count
    const [ads, totalCount] = await Promise.all([
      Ad.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validatedQuery.limit)
        .populate('user', 'fullname email')
        .lean(),
      Ad.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / validatedQuery.limit);

    res.json({
      success: true,
      ads,
      pagination: {
        currentPage: validatedQuery.page,
        totalPages,
        totalCount,
        limit: validatedQuery.limit,
        hasNextPage: validatedQuery.page < totalPages,
        hasPrevPage: validatedQuery.page > 1
      }
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors
      });
    }

    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single ad by slug
export const getAdBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const ad = await Ad.findOne({ slug, status: 'active' })
      .populate('user', 'fullname email')
      .lean();

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Increment views
    await Ad.findByIdAndUpdate(ad._id, { $inc: { views: 1 } });

    res.json({
      success: true,
      ad: {
        ...ad,
        views: ad.views + 1
      }
    });

  } catch (error) {
    console.error('Get ad by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's ads
export const getUserAds = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ads, totalCount] = await Promise.all([
      Ad.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ad.countDocuments({ user: req.user._id })
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      ads,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update ad
export const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse form data
    const formData = {
      ...req.body,
      price: req.body.price ? parseFloat(req.body.price) : undefined
    };

    // Validate request body
    const validatedData = updateAdSchema.parse(formData);

    // Check if ad exists and belongs to user
    const ad = await Ad.findOne({ _id: id, user: req.user._id });
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or unauthorized'
      });
    }

    // Handle image uploads if provided
    let newImages = ad.images;
    if (req.files && req.files.length > 0) {
      if (req.files.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 4 images allowed'
        });
      }

      // Delete old images from Cloudinary
      if (ad.images.length > 0) {
        await deleteMultipleFromCloudinary(
          ad.images.map(img => img.publicId)
        );
      }

      // Upload new images
      newImages = await uploadMultipleToCloudinary(req.files);
    }

    // Update ad
    const updatedData = {
      ...validatedData,
      images: newImages
    };

    // Handle location update
    if (validatedData.city || validatedData.state || validatedData.pincode) {
      updatedData.location = {
        city: validatedData.city || ad.location.city,
        state: validatedData.state || ad.location.state,
        pincode: validatedData.pincode || ad.location.pincode
      };
      delete updatedData.city;
      delete updatedData.state;
      delete updatedData.pincode;
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('user', 'fullname email');

    res.json({
      success: true,
      message: 'Ad updated successfully',
      ad: updatedAd
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Update ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete ad
export const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ad exists and belongs to user
    const ad = await Ad.findOne({ _id: id, user: req.user._id });
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found or unauthorized'
      });
    }

    // Delete images from Cloudinary
    if (ad.images.length > 0) {
      await deleteMultipleFromCloudinary(
        ad.images.map(img => img.publicId)
      );
    }

    // Delete ad from database
    await Ad.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });

  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};