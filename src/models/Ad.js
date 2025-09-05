import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electronics',
      'Vehicles',
      'Home & Furniture',
      'Fashion',
      'Books, Sports & Hobbies',
      'Jobs',
      'Services',
      'Real Estate',
      'Pets',
      'Other'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  location: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{6}$/
    }
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      if (this.title) {
        const baseSlug = this.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        const randomNum = Math.random().toString().substr(2, 6);
        return baseSlug ? `${baseSlug}-${randomNum}` : `ad-${randomNum}`;
      }
      return `ad-${Math.random().toString().substr(2, 6)}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate unique slug before saving
adSchema.pre('save', function(next) {
  // Always generate a fresh slug if title exists
  if (this.title && (!this.slug || this.isNew)) {
    try {
      // Create base slug from title
      const baseSlug = this.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      // Generate random 6-digit number
      const randomNum = Math.random().toString().substr(2, 6);

      // Ensure slug is not empty
      if (!baseSlug) {
        this.slug = `ad-${randomNum}`;
      } else {
        this.slug = `${baseSlug}-${randomNum}`;
      }

      console.log('Generated slug:', this.slug, 'from title:', this.title);
    } catch (error) {
      console.error('Error generating slug:', error);
      this.slug = `ad-${Math.random().toString().substr(2, 6)}`; // Fallback slug
    }
  }
  next();
});

// Index for better search performance
adSchema.index({ title: 'text', description: 'text' });
adSchema.index({ category: 1 });
adSchema.index({ 'location.city': 1 });
adSchema.index({ price: 1 });
adSchema.index({ createdAt: -1 });

const Ad = mongoose.model('Ad', adSchema);

export default Ad;