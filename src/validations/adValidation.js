import { z } from 'zod';

export const createAdSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  price: z
    .number()
    .min(0, 'Price must be a positive number')
    .max(99999999, 'Price is too high'),
  category: z
    .enum([
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
    ], {
      errorMap: () => ({ message: 'Please select a valid category' })
    }),
  condition: z
    .enum(['New', 'Like New', 'Good', 'Fair', 'Poor'], {
      errorMap: () => ({ message: 'Please select a valid condition' })
    }),
  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'City name is too long')
    .trim(),
  state: z
    .string()
    .min(1, 'State is required')
    .max(50, 'State name is too long')
    .trim(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be a valid 6-digit number')
    .trim()
});

export const updateAdSchema = createAdSchema.partial();

export const searchAdsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair', 'Poor']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
  sortBy: z.enum(['createdAt', 'price', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});