import {
  EventModel,
  SessionDetail,
  SessionSummary,
  Speaker,
  Category,
  ScheduleItem,
} from './eventModel';

/**
 * Shared query primitives used by all tool handlers
 * These functions provide deterministic, testable access patterns to the event model
 */

/**
 * Find sessions with overlapping time window
 * Treats sessions as inclusive: [startTime, endTime]
 */
export function findSessionsInTimeWindow(
  model: EventModel,
  startTime: string,
  endTime: string
): SessionDetail[] {
  return model.flattenedSessions.filter((session) => {
    // Overlap if: session.start < queryEnd AND session.end > queryStart
    return session.startTime < endTime && session.endTime > startTime;
  });
}

/**
 * Find the current session at a given time
 * Returns first session that contains the time
 */
export function getCurrentSession(
  model: EventModel,
  currentTime: string
): SessionDetail | undefined {
  return model.flattenedSessions.find(
    (session) => session.startTime <= currentTime && session.endTime > currentTime
  );
}

/**
 * Find the next upcoming session after a given time
 */
export function getNextSession(
  model: EventModel,
  currentTime: string
): SessionDetail | undefined {
  const upcoming = model.flattenedSessions.filter((s) => s.startTime > currentTime);
  return upcoming.length > 0 ? upcoming[0] : undefined;
}

/**
 * Case-insensitive partial search across session fields
 * Returns sessions with match metadata
 */
export interface SearchMatch {
  readonly session: SessionDetail;
  readonly matchedFields: ReadonlyArray<string>;
  readonly matchReasons: ReadonlyArray<string>;
}

export function searchSessions(
  model: EventModel,
  query: string
): SearchMatch[] {
  const lowerQuery = query.toLowerCase();
  const matches: SearchMatch[] = [];

  for (const session of model.flattenedSessions) {
    const matchedFields: string[] = [];
    const matchReasons: string[] = [];

    // Search title
    if (session.title.toLowerCase().includes(lowerQuery)) {
      matchedFields.push('title');
      matchReasons.push(`Title contains "${query}"`);
    }

    // Search abstract
    if (session.abstract && session.abstract.toLowerCase().includes(lowerQuery)) {
      matchedFields.push('abstract');
      matchReasons.push(`Abstract contains "${query}"`);
    }

    // Search speaker names
    for (const speaker of session.speakers) {
      if (speaker.name.toLowerCase().includes(lowerQuery)) {
        matchedFields.push('speakers');
        matchReasons.push(`Speaker "${speaker.name}" matches query`);
        break; // Count speakers field once per session
      }
    }

    // Search categories
    for (const category of session.categories) {
      if (category.name.toLowerCase().includes(lowerQuery)) {
        matchedFields.push('categories');
        matchReasons.push(`Category "${category.name}" matches query`);
        break; // Count categories field once per session
      }
    }

    // Search session type
    if (session.sessionType.toLowerCase().includes(lowerQuery)) {
      matchedFields.push('sessionType');
      matchReasons.push(`Session type "${session.sessionType}" matches query`);
    }

    if (matchedFields.length > 0) {
      matches.push({
        session,
        matchedFields,
        matchReasons,
      });
    }
  }

  return matches;
}

/**
 * Find sessions by speaker ID
 */
export function findSessionsBySpeaker(
  model: EventModel,
  speakerId: string
): SessionDetail[] {
  return Array.from(model.speakerIndex.get(speakerId) || []);
}

/**
 * Find sessions by category ID
 */
export function findSessionsByCategory(
  model: EventModel,
  categoryId: string
): SessionDetail[] {
  return Array.from(model.categoryIndex.get(categoryId) || []);
}

/**
 * Get all unique speakers in model (sorted by name)
 */
export function getAllSpeakers(model: EventModel): Speaker[] {
  const speakers = Array.from(
    new Map(
      Array.from(model.speakerIndex.values())
        .flat()
        .flatMap((s) => s.speakers)
        .map((sp) => [sp.speakerId, sp])
    ).values()
  );
  return speakers.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all unique categories in model (sorted by name)
 */
export function getAllCategories(model: EventModel): Category[] {
  const categories = Array.from(
    new Map(
      Array.from(model.categoryIndex.values())
        .flat()
        .flatMap((s) => s.categories)
        .map((c) => [c.categoryId, c])
    ).values()
  );
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find session by ID (exact match)
 */
export function findSessionById(
  model: EventModel,
  sessionId: string
): SessionDetail | undefined {
  return model.flattenedSessions.find((s) => s.sessionId === sessionId);
}

/**
 * Find sessions with partial ID or title match (for ambiguity resolution)
 */
export function findSessionsByPartialId(
  model: EventModel,
  partialId: string
): SessionDetail[] {
  const lower = partialId.toLowerCase();
  return model.flattenedSessions.filter(
    (s) =>
      s.sessionId.toLowerCase().includes(lower) ||
      s.title.toLowerCase().includes(lower)
  );
}
