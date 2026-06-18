import { RawEventData } from '../data/schemas';
import {
  EventModel,
  SessionDetail,
  Speaker,
  Category,
  ScheduleItem,
  EventMetadata,
} from './eventModel';

/**
 * Normalize raw JSON data into structured domain model
 * - Deduplicate speakers and categories
 * - Flatten breakout sessions into main timeline
 * - Create indices for efficient querying
 * - Validate time ranges (startTime < endTime)
 */
export function normalizeEventData(rawData: RawEventData): EventModel {
  const speakerMap = new Map<string, Speaker>();
  const categoryMap = new Map<string, Category>();
  const flattenedSessions: SessionDetail[] = [];
  const chronologicalSchedule: ScheduleItem[] = [];

  // Process all sessions (main + breakouts)
  for (const rawSession of rawData.sessions) {
    // Validate time range
    if (rawSession.startTime >= rawSession.endTime) {
      throw new Error(
        `Invalid time range for session "${rawSession.title}": ${rawSession.startTime} >= ${rawSession.endTime}`
      );
    }

    // Process speakers and categories for this session
    const sessionSpeakers: Speaker[] = [];
    for (const rawSpeaker of rawSession.speakers) {
      const speakerId = slugify(rawSpeaker.name);
      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, {
          speakerId,
          name: rawSpeaker.name,
          bio: rawSpeaker.bio || undefined,
        });
      }
      sessionSpeakers.push(speakerMap.get(speakerId)!);
    }

    const sessionCategories: Category[] = [];
    for (const rawCategory of rawSession.categories) {
      if (!categoryMap.has(rawCategory.id)) {
        categoryMap.set(rawCategory.id, {
          categoryId: rawCategory.id,
          name: rawCategory.name,
        });
      }
      sessionCategories.push(categoryMap.get(rawCategory.id)!);
    }

    // Add main session
    const mainSession: SessionDetail = {
      sessionId: rawSession.id,
      title: rawSession.title,
      speakers: sessionSpeakers,
      categories: sessionCategories,
      sessionType: rawSession.sessionType,
      startTime: rawSession.startTime,
      endTime: rawSession.endTime,
      abstract: rawSession.abstract || undefined,
      language: rawSession.language,
    };

    flattenedSessions.push(mainSession);
    chronologicalSchedule.push({
      sessionId: rawSession.id,
      startTime: rawSession.startTime,
      endTime: rawSession.endTime,
      title: rawSession.title,
    });

    // Process and flatten breakout sessions
    for (const rawBreakout of rawSession.breakouts) {
      // Validate breakout time range
      if (rawBreakout.startTime >= rawBreakout.endTime) {
        throw new Error(
          `Invalid time range for breakout "${rawBreakout.title}": ${rawBreakout.startTime} >= ${rawBreakout.endTime}`
        );
      }

      const breakoutSpeakers: Speaker[] = [];
      for (const rawSpeaker of rawBreakout.speakers) {
        const speakerId = slugify(rawSpeaker.name);
        if (!speakerMap.has(speakerId)) {
          speakerMap.set(speakerId, {
            speakerId,
            name: rawSpeaker.name,
            bio: rawSpeaker.bio || undefined,
          });
        }
        breakoutSpeakers.push(speakerMap.get(speakerId)!);
      }

      const breakoutCategories: Category[] = [];
      for (const rawCategory of rawBreakout.categories) {
        if (!categoryMap.has(rawCategory.id)) {
          categoryMap.set(rawCategory.id, {
            categoryId: rawCategory.id,
            name: rawCategory.name,
          });
        }
        breakoutCategories.push(categoryMap.get(rawCategory.id)!);
      }

      // Create flattened entry for breakout (no separate sessionId hierarchy)
      const breakoutId = `${rawSession.id}-${slugify(rawBreakout.title)}`;
      const breakoutSession: SessionDetail = {
        sessionId: breakoutId,
        title: rawBreakout.title,
        speakers: breakoutSpeakers,
        categories: breakoutCategories,
        sessionType: 'breakout',
        startTime: rawBreakout.startTime,
        endTime: rawBreakout.endTime,
        abstract: rawBreakout.abstract || undefined,
        language: rawSession.language, // inherit from parent
      };

      flattenedSessions.push(breakoutSession);
      chronologicalSchedule.push({
        sessionId: breakoutId,
        startTime: rawBreakout.startTime,
        endTime: rawBreakout.endTime,
        title: rawBreakout.title,
      });
    }
  }

  // Sort chronological schedule by start time
  chronologicalSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Build speaker and category indices (typed as readonly to match EventModel)
  const speakerIndexMutable = new Map<string, SessionDetail[]>();
  const categoryIndexMutable = new Map<string, SessionDetail[]>();

  for (const session of flattenedSessions) {
    for (const speaker of session.speakers) {
      if (!speakerIndexMutable.has(speaker.speakerId)) {
        speakerIndexMutable.set(speaker.speakerId, []);
      }
      speakerIndexMutable.get(speaker.speakerId)!.push(session);
    }

    for (const category of session.categories) {
      if (!categoryIndexMutable.has(category.categoryId)) {
        categoryIndexMutable.set(category.categoryId, []);
      }
      categoryIndexMutable.get(category.categoryId)!.push(session);
    }
  }

  // Convert to EventMetadata
  const eventMetadata: EventMetadata = {
    eventName: rawData.eventMetadata.eventName,
    eventDate: rawData.eventMetadata.eventDate,
    location: rawData.eventMetadata.location || undefined,
    description: rawData.eventMetadata.description || undefined,
  };

  return {
    eventMetadata,
    flattenedSessions,
    chronologicalSchedule,
    speakerIndex: new Map(speakerIndexMutable) as ReadonlyMap<string, ReadonlyArray<SessionDetail>>,
    categoryIndex: new Map(categoryIndexMutable) as ReadonlyMap<string, ReadonlyArray<SessionDetail>>,
  };
}

/**
 * Convert string to slug (lowercase, hyphenated)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
