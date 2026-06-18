import { z } from 'zod';
import { EventModel, ToolResponse } from '../domain/eventModel';
import * as common from './common';

const GetSessionDetailsInputSchema = z
  .object({
    sessionId: z.string().min(1, 'Session ID must not be empty'),
  })
  .strict();

export interface SessionDetailsResponse {
  sessionId: string;
  title: string;
  abstract?: string;
  speakers: Array<{ speakerId: string; name: string; bio?: string }>;
  categories: string[];
  sessionType: string;
  startTime: string;
  endTime: string;
  language: string;
  alternatives?: Array<{ sessionId: string; title: string }>;
}

/**
 * Get detailed information about a specific session
 * Supports exact and partial ID matching with ambiguity resolution
 */
export function getSessionDetailsHandler(
  model: EventModel,
  input: Record<string, unknown>
): ToolResponse<SessionDetailsResponse> {
  const parseResult = common.validateInput(GetSessionDetailsInputSchema, input);
  if ('error' in parseResult) {
    return parseResult as { ok: false; error: string };
  }

  const sessionId = parseResult.sessionId.toLowerCase();

  // Try exact match first
  let matches = model.flattenedSessions.filter(
    (s) => s.sessionId.toLowerCase() === sessionId
  );

  // If no exact match, try partial match
  if (matches.length === 0) {
    matches = model.flattenedSessions.filter((s) =>
      s.sessionId.toLowerCase().includes(sessionId)
    );
  }

  if (matches.length === 0) {
    return common.errorResponse(`Session not found: ${sessionId}`);
  }

  const primarySession = matches[0];

  const response: SessionDetailsResponse = {
    sessionId: primarySession.sessionId,
    title: primarySession.title,
    abstract: primarySession.abstract,
    speakers: Array.from(primarySession.speakers),
    categories: primarySession.categories.map((category) => category.name),
    sessionType: primarySession.sessionType,
    startTime: primarySession.startTime,
    endTime: primarySession.endTime,
    language: primarySession.language,
  };

  // If multiple matches, add alternatives
  if (matches.length > 1) {
    response.alternatives = matches.slice(1).map((m) => ({
      sessionId: m.sessionId,
      title: m.title,
    }));
  }

  return common.successResponse(response);
}
