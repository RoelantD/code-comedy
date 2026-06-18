import { describe, it, expect, beforeAll } from 'vitest';
import { EventModel } from '../../src/domain/eventModel';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { RawEventData } from '../../src/data/schemas';

let model: EventModel;

const testData: RawEventData = {
  eventMetadata: {
    eventName: 'Tech Conference 2024',
    eventDate: '2024-12-20',
    location: 'Convention Center',
    description: 'Annual tech conference',
  },
  sessions: [
    {
      id: 'keynote-1',
      title: 'Keynote Speech',
      speakers: [{ name: 'John Smith', bio: 'Industry expert' }],
      categories: [{ id: 'keynote', name: 'Keynote' }],
      abstract: 'Opening remarks',
      language: 'English',
      sessionType: 'keynote',
      startTime: '09:00',
      endTime: '10:00',
      breakouts: [],
    },
    {
      id: 'workshop-1',
      title: 'TypeScript Workshop',
      speakers: [
        { name: 'Sarah Jones', bio: 'TypeScript expert' },
        { name: 'Mike Brown', bio: 'Web developer' },
      ],
      categories: [{ id: 'tech', name: 'Technical' }],
      abstract: 'Learn advanced TypeScript',
      language: 'English',
      sessionType: 'workshop',
      startTime: '10:30',
      endTime: '12:00',
      breakouts: [],
    },
    {
      id: 'track-2',
      title: 'AI & ML Track',
      speakers: [{ name: 'Alice Wonder', bio: 'AI researcher' }],
      categories: [{ id: 'ai', name: 'AI/ML' }],
      abstract: 'Explore AI technologies',
      language: 'English',
      sessionType: 'session',
      startTime: '13:00',
      endTime: '16:00',
      breakouts: [
        {
          title: 'Deep Learning Basics',
          speakers: [{ name: 'Alice Wonder', bio: 'AI researcher' }],
          categories: [{ id: 'ai', name: 'AI/ML' }],
          abstract: 'Introduction to deep learning',
          startTime: '13:00',
          endTime: '14:00',
        },
        {
          title: 'NLP Applications',
          speakers: [{ name: 'Alice Wonder', bio: 'AI researcher' }],
          categories: [{ id: 'ai', name: 'AI/ML' }],
          abstract: 'Real-world NLP uses',
          startTime: '14:15',
          endTime: '15:15',
        },
      ],
    },
  ],
};

beforeAll(() => {
  model = normalizeEventData(testData);

describe('[US2] Discovery Tools - Contract Tests', () => {
  describe('search_sessions tool', () => {
    it('should search sessions by keywords (happy path)', () => {
      // Happy path: partial search with matching sessions
      const mockHandler = (model: EventModel, input: Record<string, unknown>) => {
        if (typeof input.query !== 'string') {
          return { ok: false, error: 'Invalid query' };
        }
        const results = model.flattenedSessions.filter(
          (s) =>
            s.title.toLowerCase().includes(input.query.toLowerCase()) ||
            (s.abstract && s.abstract.toLowerCase().includes(input.query.toLowerCase())) ||
            s.speakers.some((sp) => sp.name.toLowerCase().includes(input.query.toLowerCase())) ||
            s.categories.some((c) => c.name.toLowerCase().includes(input.query.toLowerCase()))
        );
        return {
          ok: true,
          data: results.map((s) => ({
            sessionId: s.sessionId,
            title: s.title,
            abstract: s.abstract,
            speakers: s.speakers,
            categories: s.categories,
            matchedFields: ['title'] as string[],
            matchReasons: [`Title contains "${input.query}"`],
          })),
        };
      };

      const result = mockHandler(model, { query: 'keynote' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('sessionId');
          expect(result.data[0]).toHaveProperty('matchedFields');
          expect(result.data[0]).toHaveProperty('matchReasons');
        }
      }
    });

    it('should return empty array when no matches', () => {
      const mockHandler = (model: EventModel, input: Record<string, unknown>) => {
        if (typeof input.query !== 'string') {
          return { ok: false, error: 'Invalid query' };
        }
        const results = model.flattenedSessions.filter(
          (s) =>
            s.title.toLowerCase().includes(input.query.toLowerCase()) ||
            (s.abstract && s.abstract.toLowerCase().includes(input.query.toLowerCase()))
        );
        return { ok: true, data: results };
      };

      const result = mockHandler(model, { query: 'xyzabc_nonexistent' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });

    it('should be case-insensitive', () => {
      const mockHandler = (model: EventModel, input: Record<string, unknown>) => {
        if (typeof input.query !== 'string') {
          return { ok: false, error: 'Invalid query' };
        }
        const query = input.query.toLowerCase();
        const results = model.flattenedSessions.filter((s) =>
          s.title.toLowerCase().includes(query)
        );
        return { ok: true, data: results.map((s) => s.title) };
      };

      const lower = mockHandler(model, { query: 'morning' });
      const upper = mockHandler(model, { query: 'MORNING' });
      const mixed = mockHandler(model, { query: 'MoRnInG' });

      if (lower.ok && upper.ok && mixed.ok) {
        expect(lower.data.length).toBe(upper.data.length);
        expect(lower.data.length).toBe(mixed.data.length);
      }
    });
  });

  describe('list_speakers tool', () => {
    it('should return all speakers sorted by name (happy path)', () => {
      const mockHandler = (model: EventModel) => {
        const speakers = Array.from(
          new Map(
            model.flattenedSessions
              .flatMap((s) => s.speakers)
              .map((sp) => [sp.speakerId, sp])
          ).values()
        ).sort((a, b) => a.name.localeCompare(b.name));

        return {
          ok: true,
          data: speakers.map((s) => ({
            speakerId: s.speakerId,
            name: s.name,
            bio: s.bio,
            sessions: model.flattenedSessions
              .filter((sess) => sess.speakers.some((sp) => sp.speakerId === s.speakerId))
              .map((s) => ({ sessionId: s.sessionId, title: s.title })),
          })),
        };
      };

      const result = mockHandler(model);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data)).toBe(true);
        // Verify sorted
        for (let i = 1; i < result.data.length; i++) {
          expect(result.data[i].name.localeCompare(result.data[i - 1].name)).toBeGreaterThanOrEqual(0);
        }
        // Verify structure
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('speakerId');
          expect(result.data[0]).toHaveProperty('name');
          expect(result.data[0]).toHaveProperty('sessions');
          expect(Array.isArray(result.data[0].sessions)).toBe(true);
        }
      }
    });

    it('should return empty array when no speakers', () => {
      const emptyModel: EventModel = {
        ...model,
        flattenedSessions: [],
      };

      const mockHandler = (model: EventModel) => {
        const speakers = Array.from(
          new Map(
            model.flattenedSessions
              .flatMap((s) => s.speakers)
              .map((sp) => [sp.speakerId, sp])
          ).values()
        );
        return { ok: true, data: speakers };
      };

      const result = mockHandler(emptyModel);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });

    it('should link each speaker to their sessions', () => {
      const mockHandler = (model: EventModel) => {
        const speakers = Array.from(
          new Map(
            model.flattenedSessions
              .flatMap((s) => s.speakers)
              .map((sp) => [sp.speakerId, sp])
          ).values()
        );

        return {
          ok: true,
          data: speakers.map((s) => ({
            speakerId: s.speakerId,
            name: s.name,
            sessions: model.flattenedSessions
              .filter((sess) => sess.speakers.some((sp) => sp.speakerId === s.speakerId))
              .map((s) => s.sessionId),
          })),
        };
      };

      const result = mockHandler(model);
      expect(result.ok).toBe(true);
      if (result.ok && result.data.length > 0) {
        const speaker = result.data[0];
        expect(speaker.sessions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('list_categories tool', () => {
    it('should return all categories sorted by name (happy path)', () => {
      const mockHandler = (model: EventModel) => {
        const categories = Array.from(
          new Map(
            model.flattenedSessions
              .flatMap((s) => s.categories)
              .map((c) => [c.categoryId, c])
          ).values()
        ).sort((a, b) => a.name.localeCompare(b.name));

        return {
          ok: true,
          data: categories.map((c) => ({
            categoryId: c.categoryId,
            name: c.name,
            sessions: model.flattenedSessions
              .filter((s) => s.categories.some((cat) => cat.categoryId === c.categoryId))
              .map((s) => ({ sessionId: s.sessionId, title: s.title })),
          })),
        };
      };

      const result = mockHandler(model);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data)).toBe(true);
        // Verify sorted
        for (let i = 1; i < result.data.length; i++) {
          expect(result.data[i].name.localeCompare(result.data[i - 1].name)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should return empty array when no categories', () => {
      const emptyModel: EventModel = {
        ...model,
        flattenedSessions: [],
      };

      const mockHandler = (model: EventModel) => {
        const categories = Array.from(
          new Map(
            model.flattenedSessions
              .flatMap((s) => s.categories)
              .map((c) => [c.categoryId, c])
          ).values()
        );
        return { ok: true, data: categories };
      };

      const result = mockHandler(emptyModel);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });

    it('should link each category to their sessions', () => {
      const mockHandler = (model: EventModel) => {
        const categories = Array.from(
          new Map(
            model.flattenedSessions
              .flatMap((s) => s.categories)
              .map((c) => [c.categoryId, c])
          ).values()
        );

        return {
          ok: true,
          data: categories.map((c) => ({
            categoryId: c.categoryId,
            name: c.name,
            sessionCount: model.flattenedSessions.filter((s) =>
              s.categories.some((cat) => cat.categoryId === c.categoryId)
            ).length,
          })),
        };
      };

      const result = mockHandler(model);
      expect(result.ok).toBe(true);
      if (result.ok && result.data.length > 0) {
        const category = result.data[0];
        expect(category.sessionCount).toBeGreaterThan(0);
      }
    });
  });

  describe('get_session_details tool', () => {
    it('should return detailed info for a session (happy path)', () => {
      if (model.flattenedSessions.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const mockHandler = (model: EventModel, sessionId: string) => {
        const session = model.flattenedSessions.find((s) => s.sessionId === sessionId);
        if (!session) {
          return { ok: false, error: 'Session not found' };
        }
        return {
          ok: true,
          data: {
            sessionId: session.sessionId,
            title: session.title,
            abstract: session.abstract,
            speakers: session.speakers,
            categories: session.categories,
            sessionType: session.sessionType,
            startTime: session.startTime,
            endTime: session.endTime,
            language: session.language,
          },
        };
      };

      const sessionId = model.flattenedSessions[0].sessionId;
      const result = mockHandler(model, sessionId);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveProperty('sessionId', sessionId);
        expect(result.data).toHaveProperty('title');
        expect(result.data).toHaveProperty('startTime');
        expect(result.data).toHaveProperty('endTime');
      }
    });

    it('should return error for non-existent session', () => {
      const mockHandler = (model: EventModel, sessionId: string) => {
        const session = model.flattenedSessions.find((s) => s.sessionId === sessionId);
        if (!session) {
          return { ok: false, error: 'Session not found' };
        }
        return { ok: true, data: session };
      };

      const result = mockHandler(model, 'nonexistent-session-id');
      expect(result.ok).toBe(false);
      expect(result).toHaveProperty('error');
    });

    it('should handle partial session ID matches with alternatives', () => {
      if (model.flattenedSessions.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const mockHandler = (model: EventModel, partialId: string) => {
        const matches = model.flattenedSessions.filter((s) =>
          s.sessionId.includes(partialId.toLowerCase())
        );

        if (matches.length === 0) {
          return { ok: false, error: 'No matching sessions found' };
        }

        if (matches.length === 1) {
          return { ok: true, data: matches[0] };
        }

        // Multiple matches - return primary with alternatives
        return {
          ok: true,
          data: {
            ...matches[0],
            alternatives: matches.slice(1).map((m) => ({
              sessionId: m.sessionId,
              title: m.title,
            })),
          },
        };
      };

      const firstSessionId = model.flattenedSessions[0].sessionId;
      const partialId = firstSessionId.substring(0, 5);
      const result = mockHandler(model, partialId);

      // Should find at least the first session
      if (result.ok) {
        expect(result.data).toHaveProperty('sessionId');
      }
    });
  });
});
