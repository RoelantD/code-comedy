import { z } from 'zod';

/**
 * Raw JSON schema validation for codeandcomedy-talks.json
 * Treats all fields as untrusted data on startup
 */

// Speaker schema
export const RawSpeakerSchema = z.object({
  name: z.string().min(1, 'Speaker name cannot be empty'),
  bio: z.string().optional().nullable(),
}).strict();

// Category schema
export const RawCategorySchema = z.object({
  id: z.string().min(1, 'Category ID cannot be empty'),
  name: z.string().min(1, 'Category name cannot be empty'),
}).strict();

// Breakout session (nested within parent session)
export const RawBreakoutSchema = z.object({
  title: z.string().min(1, 'Breakout title cannot be empty'),
  speakers: z.array(RawSpeakerSchema).default([]),
  categories: z.array(RawCategorySchema).default([]),
  abstract: z.string().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm format'),
}).strict();

// Main session schema
export const RawSessionSchema = z.object({
  id: z.string().min(1, 'Session ID cannot be empty'),
  title: z.string().min(1, 'Session title cannot be empty'),
  speakers: z.array(RawSpeakerSchema).default([]),
  categories: z.array(RawCategorySchema).default([]),
  abstract: z.string().optional().nullable(),
  language: z.string().default('English'),
  sessionType: z.enum(['keynote', 'breakout', 'workshop', 'lightning', 'panel']).default('breakout'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm format'),
  breakouts: z.array(RawBreakoutSchema).default([]),
}).strict();

// Event metadata
export const RawEventMetadataSchema = z.object({
  eventName: z.string().min(1, 'Event name cannot be empty'),
  eventDate: z.string().min(1, 'Event date cannot be empty'),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
}).strict();

// Root schema
export const RawEventDataSchema = z.object({
  eventMetadata: RawEventMetadataSchema,
  sessions: z.array(RawSessionSchema),
}).strict();

export type RawEventData = z.infer<typeof RawEventDataSchema>;
export type RawSession = z.infer<typeof RawSessionSchema>;
export type RawBreakout = z.infer<typeof RawBreakoutSchema>;
export type RawEventMetadata = z.infer<typeof RawEventMetadataSchema>;
export type RawSpeaker = z.infer<typeof RawSpeakerSchema>;
export type RawCategory = z.infer<typeof RawCategorySchema>;

/**
 * Parse and validate raw JSON data
 * Throws ZodError on validation failure (fail-fast behavior)
 */
export function parseRawEventData(data: unknown): RawEventData {
  return RawEventDataSchema.parse(data);
}
