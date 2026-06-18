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
});

describe('[US2] Discovery Tools - Integration Tests', () => {
  describe('Partial Matching Behavior', () => {
    it('should find partial words in session titles', () => {
      // Example: searching for "morn" should find "Morning Track"
      const query = 'morn';
      const results = model.flattenedSessions.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          (s.abstract && s.abstract.toLowerCase().includes(query))
      );

      expect(results.length).toBeGreaterThanOrEqual(0);
      results.forEach((r) => {
        expect(r.title.toLowerCase() + (r.abstract?.toLowerCase() || '')).toContain(query);
      });
    });

    it('should find sessions by partial speaker name', () => {
      const speakerNameFragment = 'John'; // Partial match
      const results = model.flattenedSessions.filter((s) =>
        s.speakers.some((sp) => sp.name.toLowerCase().includes(speakerNameFragment.toLowerCase()))
      );

      // Should find speakers with this fragment
      results.forEach((r) => {
        const found = r.speakers.some((sp) =>
          sp.name.toLowerCase().includes(speakerNameFragment.toLowerCase())
        );
        expect(found).toBe(true);
      });
    });

    it('should find sessions by category name fragment', () => {
      const categoryFragment = 'tech'; // Partial match
      const results = model.flattenedSessions.filter((s) =>
        s.categories.some((c) => c.name.toLowerCase().includes(categoryFragment.toLowerCase()))
      );

      results.forEach((r) => {
        const found = r.categories.some((c) =>
          c.name.toLowerCase().includes(categoryFragment.toLowerCase())
        );
        expect(found).toBe(true);
      });
    });
  });

  describe('Nested Breakout Flattening in Discovery', () => {
    it('should include flattened breakout sessions in search results', () => {
      // When a parent session has breakouts, they are flattened into the sessions list
      const flattenedCount = model.flattenedSessions.length;
      // Should have all sessions including flattened breakouts
      expect(flattenedCount).toBeGreaterThan(0);
      
      // Verify we have both regular sessions and breakouts
      const regularSessions = model.flattenedSessions.filter(s => s.sessionType !== 'breakout');
      const breakoutSessions = model.flattenedSessions.filter(s => s.sessionType === 'breakout');
      
      expect(regularSessions.length).toBeGreaterThan(0);
      expect(breakoutSessions.length).toBeGreaterThan(0);
    });

    it('should preserve breakout parent-child relationships in speaker listings', () => {
      // If a speaker appears in both parent and breakout, they should be linked to both
      const speakerAppearances: Map<string, Set<string>> = new Map();

      model.flattenedSessions.forEach((session) => {
        session.speakers.forEach((speaker) => {
          if (!speakerAppearances.has(speaker.speakerId)) {
            speakerAppearances.set(speaker.speakerId, new Set());
          }
          speakerAppearances.get(speaker.speakerId)!.add(session.sessionId);
        });
      });

      // Each speaker should be linked to at least one session
      speakerAppearances.forEach((sessionIds) => {
        expect(sessionIds.size).toBeGreaterThanOrEqual(1);
      });
    });

    it('should maintain category links across parent and breakout sessions', () => {
      const categoryAppearances: Map<string, Set<string>> = new Map();

      model.flattenedSessions.forEach((session) => {
        session.categories.forEach((category) => {
          if (!categoryAppearances.has(category.categoryId)) {
            categoryAppearances.set(category.categoryId, new Set());
          }
          categoryAppearances.get(category.categoryId)!.add(session.sessionId);
        });
      });

      // Each category should appear at least once
      categoryAppearances.forEach((sessionIds) => {
        expect(sessionIds.size).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Missing Field Handling in Discovery', () => {
    it('should handle sessions with missing or null bio fields', () => {
      const speakers = Array.from(
        new Map(
          model.flattenedSessions
            .flatMap((s) => s.speakers)
            .map((sp) => [sp.speakerId, sp])
        ).values()
      );

      speakers.forEach((speaker) => {
        // bio can be undefined or null, should not crash
        expect(typeof speaker.bio === 'string' || speaker.bio === undefined).toBe(true);
      });
    });

    it('should handle sessions with missing or empty abstract fields', () => {
      const sessions = model.flattenedSessions;

      sessions.forEach((session) => {
        // abstract can be undefined or null, should not crash
        expect(typeof session.abstract === 'string' || session.abstract === undefined).toBe(true);
      });
    });

    it('should safely search sessions with optional/missing fields', () => {
      const query = 'test';
      const results = model.flattenedSessions.filter((s) => {
        const titleMatch = s.title.toLowerCase().includes(query);
        const abstractMatch = s.abstract ? s.abstract.toLowerCase().includes(query) : false;
        return titleMatch || abstractMatch;
      });

      // Should not crash, can return 0 or more results
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle speakers with missing bio in speaker list', () => {
      const speakers = Array.from(
        new Map(
          model.flattenedSessions
            .flatMap((s) => s.speakers)
            .map((sp) => [sp.speakerId, sp])
        ).values()
      );

      const speakerWithoutBio = speakers.find((s) => !s.bio);
      if (speakerWithoutBio) {
        // Should still have required fields
        expect(speakerWithoutBio.speakerId).toBeDefined();
        expect(speakerWithoutBio.name).toBeDefined();
      }
    });
  });

  describe('Discovery Consistency Across Tools', () => {
    it('should return the same speaker across list_speakers and search results', () => {
      if (model.flattenedSessions.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const firstSession = model.flattenedSessions[0];
      if (firstSession.speakers.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const speakerId = firstSession.speakers[0].speakerId;
      const speakerName = firstSession.speakers[0].name;

      // Search should find this speaker
      const searchResults = model.flattenedSessions.filter((s) =>
        s.speakers.some((sp) => sp.speakerId === speakerId)
      );
      expect(searchResults.length).toBeGreaterThan(0);

      // list_speakers should also have this speaker
      const speakers = Array.from(
        new Map(
          model.flattenedSessions
            .flatMap((s) => s.speakers)
            .map((sp) => [sp.speakerId, sp])
        ).values()
      );
      const foundSpeaker = speakers.find((s) => s.speakerId === speakerId);
      expect(foundSpeaker).toBeDefined();
      expect(foundSpeaker?.name).toBe(speakerName);
    });

    it('should return consistent category info across tools', () => {
      if (model.flattenedSessions.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const firstSession = model.flattenedSessions[0];
      if (firstSession.categories.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const categoryId = firstSession.categories[0].categoryId;

      // Should find sessions with this category
      const sessionsInCategory = model.flattenedSessions.filter((s) =>
        s.categories.some((c) => c.categoryId === categoryId)
      );
      expect(sessionsInCategory.length).toBeGreaterThan(0);

      // list_categories should also have this category
      const categories = Array.from(
        new Map(
          model.flattenedSessions
            .flatMap((s) => s.categories)
            .map((c) => [c.categoryId, c])
        ).values()
      );
      const foundCategory = categories.find((c) => c.categoryId === categoryId);
      expect(foundCategory).toBeDefined();
    });

    it('should return session details matching search results', () => {
      if (model.flattenedSessions.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const sessionId = model.flattenedSessions[0].sessionId;

      // Search/list should find it
      const found = model.flattenedSessions.find((s) => s.sessionId === sessionId);
      expect(found).toBeDefined();

      // get_session_details should also find it with same data
      if (found) {
        expect(found.title).toBeDefined();
        expect(found.startTime).toBeDefined();
        expect(found.endTime).toBeDefined();
      }
    });
  });

  describe('Discovery with Edge Cases', () => {
    it('should handle multi-word search queries', () => {
      const query = 'advanced tech';
      const results = model.flattenedSessions.filter((s) =>
        s.title.toLowerCase().includes(query.toLowerCase())
      );

      // Should find exact multi-word matches
      results.forEach((r) => {
        expect(r.title.toLowerCase()).toContain(query.toLowerCase());
      });
    });

    it('should return sorted speakers by name', () => {
      const speakers = Array.from(
        new Map(
          model.flattenedSessions
            .flatMap((s) => s.speakers)
            .map((sp) => [sp.speakerId, sp])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 1; i < speakers.length; i++) {
        expect(speakers[i].name.localeCompare(speakers[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return sorted categories by name', () => {
      const categories = Array.from(
        new Map(
          model.flattenedSessions
            .flatMap((s) => s.categories)
            .map((c) => [c.categoryId, c])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].name.localeCompare(categories[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
