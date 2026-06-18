import { z } from 'zod';
import { ToolResponse } from '../domain/eventModel';

/**
 * Common error envelope and response formatting for all tools
 * Enforces consistent, safe error messages (no stack traces to agents)
 */

export interface EmptyResult<T> {
  readonly ok: true;
  readonly data: T[];
}

export interface ErrorResult {
  readonly ok: false;
  readonly error: string;
}

export type SafeToolResponse<T> = ToolResponse<T> | EmptyResult<T> | ErrorResult;

/**
 * Create a successful response envelope
 */
export function successResponse<T>(data: T): ToolResponse<T> {
  return {
    ok: true,
    data,
  };
}

/**
 * Create an empty result response (when query succeeds but matches nothing)
 */
export function emptyResponse<T>(): EmptyResult<T> {
  return {
    ok: true,
    data: [],
  };
}

/**
 * Create a safe error response (no implementation details)
 */
export function errorResponse(error: string): ErrorResult {
  return {
    ok: false,
    error,
  };
}

/**
 * Validate tool input using Zod schema
 * Returns error response on validation failure
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): T | ErrorResult {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(`Invalid input: ${error.errors[0]?.message || 'validation failed'}`);
    }
    return errorResponse('Input validation failed');
  }
}

/**
 * Handle malformed input or data access errors
 */
export function handleDataError(error: unknown): ErrorResult {
  if (error instanceof Error) {
    // Check for schema/data issues
    if (error.message.includes('Invalid time range') || error.message.includes('schema')) {
      return errorResponse('DATA_UNAVAILABLE');
    }
  }
  return errorResponse('An error occurred processing this request');
}

/**
 * Safe wrapper for tool handlers
 * Catches unexpected errors and returns safe error envelope
 */
export async function safeToolHandler<T>(
  handler: () => Promise<ToolResponse<T>>
): Promise<ToolResponse<T> | ErrorResult> {
  try {
    return await handler();
  } catch (error) {
    return handleDataError(error);
  }
}

/**
 * Synchronous variant of safeToolHandler
 */
export function safeToolHandlerSync<T>(
  handler: () => ToolResponse<T>
): ToolResponse<T> | ErrorResult {
  try {
    return handler();
  } catch (error) {
    return handleDataError(error);
  }
}

/**
 * Format session list for tool output (stripped down view)
 */
export function formatSessionSummary(session: any): any {
  return {
    sessionId: session.sessionId,
    title: session.title,
    speakers: session.speakers.map((s: any) => ({ speakerId: s.speakerId, name: s.name })),
    categories: session.categories.map((c: any) => c.name),
    sessionType: session.sessionType,
    startTime: session.startTime,
    endTime: session.endTime,
  };
}

/**
 * Format session detail for tool output (full view)
 */
export function formatSessionDetail(session: any): any {
  return {
    sessionId: session.sessionId,
    title: session.title,
    speakers: session.speakers.map((s: any) => ({ speakerId: s.speakerId, name: s.name })),
    categories: session.categories.map((c: any) => c.name),
    sessionType: session.sessionType,
    startTime: session.startTime,
    endTime: session.endTime,
    abstract: session.abstract || null,
    language: session.language,
  };
}

/**
 * Format speaker for tool output
 */
export function formatSpeaker(speaker: any): any {
  return {
    speakerId: speaker.speakerId,
    name: speaker.name,
    bio: speaker.bio || null,
  };
}

/**
 * Format category for tool output
 */
export function formatCategory(category: any): any {
  return {
    categoryId: category.categoryId,
    name: category.name,
  };
}
