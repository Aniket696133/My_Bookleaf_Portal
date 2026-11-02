import { z } from 'zod';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createTicketSchema = z.object({
  bookId: objectId.nullable().optional(), // null / missing = General / Account Level
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150),
  description: z.string().trim().min(10, 'Please describe the issue in at least 10 characters').max(5000),
  attachments: z.array(z.object({ name: z.string().max(200), size: z.number().nonnegative() })).max(5).optional().default([]),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(5000),
  isInternal: z.boolean().optional().default(false),
});

export const listTicketsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigned: z.enum(['me', 'unassigned']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const updateTicketSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    category: z.enum(CATEGORIES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignedTo: z.literal('me').nullable().optional(), // 'me' = assign to myself, null = unassign
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');
