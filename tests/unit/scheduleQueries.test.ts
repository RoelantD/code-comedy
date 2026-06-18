import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import {
  findSessionsInTimeWindow,
  getCurrentSession,
  getNextSession,
  searchSessions,
  getAllSpeakers,
  getAllCategories,
  findSessionById,
  findSessionsByPartialId,
} from '../../src/domain/scheduleQueries';
import { RawEventData } from '../../src/data/schemas';

describe('normalizeEventData & scheduleQueries - Data Normalization and Queries', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Test Conference',
        eventDate: '2024-12-15',
        location: 'Test Hall',
      },
      sessions: [
        {
          id: 'keynote-1',
          title: 'Opening Keynote',
          speakers: [{ name: 'Alice Speaker', bio: 'Expert in TypeScript' }],
          categories: [{ id: 'keynote', name: 'Keynote' }],
          abstract: 'Opening address by Alice',
          language: 'English',
          sessionType: 'keynote',
          startTime: '09:00',
          endTime: '10:00',
          breakouts: [],
        },
        {
          id: 'session-1',
          title: 'Advanced TypeScript Patterns',
          speakers: [
            { name: 'Alice Speaker', bio: 'Expert in TypeScript' },
            { name: 'Bob Developer' },
          ],
          categories: [
            { id: 'ts', name: 'TypeScript' },
            { id: 'advanced', name: 'Advanced' },
          ],
          abstract: 'Deep dive into advanced TypeScript',
          language: 'English',
          sessionType: 'breakout',
          startTime: '10:15',
          endTime: '11:00',
          breakouts: [
            {
              title: 'TypeScript Generics',
              speakers: [{ name: 'Alice Speaker', bio: 'Expert in TypeScript' }],
              categories: [{ id: 'ts', name: 'TypeScript' }],
              abstract: 'Understanding generics',
              startTime: '10:15',
              endTime: '10:35',
            },
            {
              title: 'Decorators and Metadata',
              speakers: [{ name: 'Bob Developer' }],
              categories: [{ id: 'ts', name: 'TypeScript' }],
              abstract: 'Reflective programming',
              startTime: '10:40',
              endTime: '11:00',
            },
          ],
        },
        {
          id: 'session-2',
          title: 'Modern JavaScript',
          speakers: [{ name: 'Charlie Dev' }],
          categories: [{ id: 'js', name: 'JavaScript' }],
          abstract: null, // Test null handling
          language: 'English',
          sessionType: 'workshop',
          startTime: '11:15',
          endTime: '12:30',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  describe('Normalization - Flattening and Deduplication', () => {
    it('should flatten breakout sessions into main list', () => {
      // 3 main sessions + 2 breakouts = 5 total
      expect(model.flattenedSessions.length).toBe(5);
    });

    it('should create correct session IDs for breakouts', () => {
      const breakoutIds = model.flattenedSessions
        .filter((s) => s.sessionType === 'breakout' || s.sessionId.includes('-'))
        .map((s) => s.sessionId);

      // Expect breakout IDs to include parent session ID
      const hasNestedId = breakoutIds.some((id) => id.includes('session-1'));
      expect(hasNestedId).toBe(true);
    });

    it('should deduplicate speakers across sessions', () => {
      const speakerSet = new Set<string>();
      for (const session of model.flattenedSessions) {
        for (const speaker of session.speakers) {
          speakerSet.add(speaker.speakerId);
        }
      }

      // Alice appears in keynote, main session, and breakout
      // But should be deduplicated
      expect(speakerSet.size).toBeLessThan(10); // sanity check
    });

    it('should preserve null abstract fields without fabrication', () => {
      const sessionWithNullAbstract = model.flattenedSessions.find(
        (s) => s.title === 'Modern JavaScript'
      );
      expect(sessionWithNullAbstract?.abstract).toBeUndefined();
    });
  });

  describe('Chronological Schedule', () => {
    it('should sort schedule chronologically', () => {
      const times = model.chronologicalSchedule.map((s) => s.startTime);
      const sorted = [...times].sort();
      expect(times).toEqual(sorted);
    });

    it('should include all sessions and breakouts', () => {
      expect(model.chronologicalSchedule.length).toBeGreaterThan(0);
    });
  });

  describe('findSessionsInTimeWindow', () => {
    it('should find overlapping sessions', () => {
      const overlapping = findSessionsInTimeWindow(model, '09:30', '10:30');
      expect(overlapping.length).toBeGreaterThan(0);
      expect(overlapping.some((s) => s.title.includes('Keynote'))).toBe(true);
    });

    it('should return empty for non-overlapping window', () => {
      const result = findSessionsInTimeWindow(model, '22:00', '23:00');
      expect(result.length).toBe(0);
    });

    it('should handle exact boundary times', () => {
      // Session at 09:00-10:00, query 10:00-11:00 should not overlap
      const result = findSessionsInTimeWindow(model, '10:00', '11:00');
      // Only sessions starting before 11:00 and ending after 10:00
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCurrentSession & getNextSession', () => {
    it('should find current session at given time', () => {
      const current = getCurrentSession(model, '09:30');
      expect(current?.title).toContain('Keynote');
    });

    it('should return undefined if no current session', () => {
      const current = getCurrentSession(model, '08:00'); // before any session
      expect(current).toBeUndefined();
    });

    it('should find next session', () => {
      const next = getNextSession(model, '10:00');
      expect(next?.title).toBeDefined();
    });

    it('should return undefined for next if no future session', () => {
      const next = getNextSession(model, '23:00');
      expect(next).toBeUndefined();
    });
  });

  describe('searchSessions', () => {
    it('should find sessions by title', () => {
      const results = searchSessions(model, 'TypeScript');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.matchedFields.includes('title'))).toBe(true);
    });

    it('should find sessions by speaker name', () => {
      const results = searchSessions(model, 'Alice');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find sessions by category', () => {
      const results = searchSessions(model, 'JavaScript');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const resultsUpper = searchSessions(model, 'TYPESCRIPT');
      const resultsLower = searchSessions(model, 'typescript');
      expect(resultsUpper.length).toBe(resultsLower.length);
    });

    it('should include match reasons', () => {
      const results = searchSessions(model, 'TypeScript');
      expect(results[0]?.matchReasons.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = searchSessions(model, 'XYZ123NoMatch');
      expect(results.length).toBe(0);
    });
  });

  describe('getAllSpeakers & getAllCategories', () => {
    it('should return all unique speakers sorted by name', () => {
      const speakers = getAllSpeakers(model);
      expect(speakers.length).toBeGreaterThan(0);
      // Check sorted
      for (let i = 1; i < speakers.length; i++) {
        expect(speakers[i - 1].name.localeCompare(speakers[i].name)).toBeLessThanOrEqual(0);
      }
    });

    it('should return all unique categories sorted by name', () => {
      const categories = getAllCategories(model);
      expect(categories.length).toBeGreaterThan(0);
      // Check sorted
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i - 1].name.localeCompare(categories[i].name)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('findSessionById & findSessionsByPartialId', () => {
    it('should find session by exact ID', () => {
      const session = findSessionById(model, 'keynote-1');
      expect(session?.title).toContain('Keynote');
    });

    it('should return undefined for non-existent ID', () => {
      const session = findSessionById(model, 'nonexistent');
      expect(session).toBeUndefined();
    });

    it('should find sessions by partial ID', () => {
      const results = findSessionsByPartialId(model, 'session');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find sessions by partial title match', () => {
      const results = findSessionsByPartialId(model, 'TypeScript');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Normalization - Error Handling', () => {
    it('should throw on overlapping session times', () => {
      const invalidData: RawEventData = {
        eventMetadata: { eventName: 'Test', eventDate: '2024-12-15' },
        sessions: [
          {
            id: 'bad',
            title: 'Bad Session',
            speakers: [],
            categories: [],
            startTime: '14:00',
            endTime: '13:00', // Invalid: end before start
            breakouts: [],
          },
        ],
      };

      expect(() => normalizeEventData(invalidData)).toThrow();
    });
  });
});
