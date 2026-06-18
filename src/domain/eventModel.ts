import { z } from 'zod';

/**
 * Normalized domain entities (derived from raw JSON)
 * These types represent validated, deduplicated, and structured data
 */

// Normalized speaker entity with stable slug identifier
export interface Speaker {
  readonly speakerId: string; // slug: lowercase + hyphenated name
  readonly name: string;
  readonly bio?: string;
}

// Normalized category entity with stable ID
export interface Category {
  readonly categoryId: string;
  readonly name: string;
}

// Normalized schedule item (flat timeline entry)
export interface ScheduleItem {
  readonly sessionId: string; // stable slug from original JSON
  readonly startTime: string; // HH:mm
  readonly endTime: string;   // HH:mm
  readonly title: string;
}

// Session summary (minimal fields for listing)
export interface SessionSummary {
  readonly sessionId: string;
  readonly title: string;
  readonly speakers: ReadonlyArray<Speaker>;
  readonly categories: ReadonlyArray<Category>;
  readonly sessionType: string;
  readonly startTime: string;
  readonly endTime: string;
}

// Session detail (full information for get_session_details)
export interface SessionDetail extends SessionSummary {
  readonly abstract?: string;
  readonly language: string;
  readonly alternatives?: ReadonlyArray<SessionSummary>; // for ambiguous matches
}

// Recommendation with explicit reasons
export interface RecommendationResult {
  readonly sessionId: string;
  readonly title: string;
  readonly score: number;
  readonly matchReasons: ReadonlyArray<string>;
  readonly speakers: ReadonlyArray<Speaker>;
  readonly categories: ReadonlyArray<Category>;
  readonly startTime: string;
  readonly endTime: string;
}

// Event metadata
export interface EventMetadata {
  readonly eventName: string;
  readonly eventDate: string;
  readonly location?: string;
  readonly description?: string;
}

// Complete normalized event model (immutable after initialization)
export interface EventModel {
  readonly eventMetadata: EventMetadata;
  readonly flattenedSessions: ReadonlyArray<SessionDetail>; // includes breakouts flattened
  readonly chronologicalSchedule: ReadonlyArray<ScheduleItem>;
  readonly speakerIndex: ReadonlyMap<string, ReadonlyArray<SessionDetail>>; // speakerId -> sessions
  readonly categoryIndex: ReadonlyMap<string, ReadonlyArray<SessionDetail>>; // categoryId -> sessions
}

// Zod schemas for tool input validation
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
}).strict();

export const TimeContextSchema = z.object({
  currentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm format').optional(),
}).strict();

export const SessionLookupSchema = z.object({
  sessionId: z.string().min(1, 'Session ID cannot be empty'),
}).strict();

export const RecommendationQuerySchema = z.object({
  interests: z.string().min(1, 'Interests cannot be empty'),
  limit: z.number().int().min(1).max(50).default(10),
}).strict();

// Generic tool response envelope
export interface ToolResponse<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type TimeContextInput = z.infer<typeof TimeContextSchema>;
export type SessionLookupInput = z.infer<typeof SessionLookupSchema>;
export type RecommendationQueryInput = z.infer<typeof RecommendationQuerySchema>;
