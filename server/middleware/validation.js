import { z } from 'zod';
import { BadRequestException } from './errorHandler.js';

/**
 * Validation middleware factory
 * @param {Object} schema - Zod schema object with optional body, query, params
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new BadRequestException(
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        ));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Common validation schemas
 */
const gigImageUrls = z.array(z.string().trim().url().max(2000)).max(5).optional();
const gigThumbnailUrl = z.string().trim().url().max(2000).nullable().optional();

export const schemas = {
  // Auth schemas
  register: {
    body: z.object({
      full_name: z.string().min(2).max(255),
      email: z.string().email(),
      phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      password: z.string().min(8).max(100)
    })
  },

  login: {
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  },

  // Task schemas
  createTask: {
    body: z.object({
      title: z.string().min(5).max(255),
      description: z.string().min(20).max(5000),
      category: z.enum([
        'Housekeeping',
        'Bush & Yard Clearing',
        'Farming & Agriculture',
        'Tutoring & Training',
        'Errands & Delivery',
        'Other'
      ]),
      budget: z.number().positive().max(1000000),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      location_name: z.string().min(3).max(255)
    })
  },

  updateTaskStatus: {
    body: z.object({
      status: z.enum(['open', 'assigned', 'in_progress', 'completed', 'cancelled'])
    })
  },

  // Gig schemas
  createGig: {
    body: z.object({
      title: z.string().trim().min(5).max(120),
      category: z.string().trim().min(2).max(100),
      subcategory: z.string().trim().min(2).max(100),
      description: z.string().trim().min(20).max(5000),
      notes: z.string().trim().max(2000).optional()
        .transform(val => val === '' ? undefined : val),
      amount: z.number().positive().max(1000000),
      delivery_days: z.number().int().min(1).max(90).optional(),
      image_urls: gigImageUrls,
      image_thumbnails: gigImageUrls,
      image_public_ids: z.array(z.string().trim().max(500)).max(5).optional(),
      thumbnail_url: gigThumbnailUrl
    })
  },

  updateGig: {
    body: z.object({
      title: z.string().trim().min(5).max(120).optional(),
      category: z.string().trim().min(2).max(100).optional(),
      subcategory: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().min(20).max(5000).optional(),
      notes: z.string().trim().max(2000).optional()
        .transform(val => val === '' ? undefined : val),
      amount: z.number().positive().max(1000000).optional(),
      delivery_days: z.number().int().min(1).max(90).optional(),
      status: z.enum(['active', 'paused']).optional(),
      image_urls: gigImageUrls,
      image_thumbnails: gigImageUrls,
      image_public_ids: z.array(z.string().trim().max(500)).max(5).optional(),
      thumbnail_url: gigThumbnailUrl
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field is required'
    })
  },

  listGigs: {
    query: z.object({
      q: z.string().trim().max(100).optional(),
      category: z.string().max(100).optional(),
      subcategory: z.string().max(100).optional(),
      seller_id: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
      sort: z.enum(['newest', 'price_low', 'price_high', 'rating']).optional(),
      limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(60)).default('24'),
      offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).default('0')
    })
  },

  createGigOrder: {
    body: z.object({
      gig_id: z.number().int().positive(),
      requirements: z.string().trim().max(2000).optional()
        .transform(val => val === '' ? undefined : val)
    })
  },

  updateGigOrderStatus: {
    body: z.object({
      status: z.enum(['accepted', 'declined', 'completed', 'cancelled'])
    })
  },

  // Bid schemas
  createBid: {
    body: z.object({
      bid_amount: z.number().positive().max(1000000),
      pitch_note: z.string().trim()
        .transform(val => val === '' ? undefined : val)
        .optional()
        .refine(val => !val || val.length >= 10, {
          message: 'Pitch note must be at least 10 characters if provided'
        })
    })
  },

  updateBidStatus: {
    body: z.object({
      status: z.enum(['accepted', 'rejected'])
    })
  },

  // Message schemas
  sendMessage: {
    body: z.object({
      message_text: z.string().min(1).max(5000),
      receiver_id: z.number().int().positive()
    })
  },

  // Review schemas
  createReview: {
    body: z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional()
    })
  },

  // Query schemas
  nearbyTasks: {
    query: z.object({
      latitude: z.string().transform(val => parseFloat(val)).pipe(z.number().min(-90).max(90)),
      longitude: z.string().transform(val => parseFloat(val)).pipe(z.number().min(-180).max(180)),
      // Omitted or 0 means "anywhere" (no distance limit)
      radius: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0).max(100000)).optional(),
      category: z.string().optional(),
      limit: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive().max(100)).default('20'),
      offset: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(0)).default('0')
    })
  },

  // ID params
  idParam: {
    params: z.object({
      id: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive())
    })
  }
};
