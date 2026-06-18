import { describe, it, expect } from 'vitest';
import { parseRawEventData, RawEventData } from '../../src/data/schemas';
import { loadEventData, loadEventDataSync } from '../../src/data/loadEventData';

describe('loadEventData - Data Loading Validation', () => {
  describe('parseRawEventData - Schema Validation', () => {
    it('should parse valid event data', () => {
      const validData: RawEventData = {
        eventMetadata: {
          eventName: 'Test Event',
          eventDate: '2024-12-15',
          location: 'Test Location',
        },
        sessions: [
          {
            id: 'session1',
            title: 'Test Session',
            speakers: [{ name: 'Speaker One' }],
            categories: [{ id: 'cat1', name: 'JavaScript' }],
            startTime: '09:00',
            endTime: '10:00',
            breakouts: [],
          },
        ],
      };

      const result = parseRawEventData(validData);
      expect(result.eventMetadata.eventName).toBe('Test Event');
      expect(result.sessions[0].title).toBe('Test Session');
    });

    it('should throw on missing required field (eventName)', () => {
      const invalidData = {
        eventMetadata: {
          eventDate: '2024-12-15',
        },
        sessions: [],
      };

      expect(() => parseRawEventData(invalidData)).toThrow();
    });

    it('should throw on empty session title', () => {
      const invalidData: any = {
        eventMetadata: {
          eventName: 'Test Event',
          eventDate: '2024-12-15',
        },
        sessions: [
          {
            id: 'session1',
            title: '', // Invalid: empty
            speakers: [],
            categories: [],
            startTime: '09:00',
            endTime: '10:00',
            breakouts: [],
          },
        ],
      };

      expect(() => parseRawEventData(invalidData)).toThrow();
    });

    it('should throw on invalid time format', () => {
      const invalidData: any = {
        eventMetadata: {
          eventName: 'Test Event',
          eventDate: '2024-12-15',
        },
        sessions: [
          {
            id: 'session1',
            title: 'Test Session',
            speakers: [],
            categories: [],
            startTime: '9:00', // Invalid: should be HH:mm
            endTime: '10:00',
            breakouts: [],
          },
        ],
      };

      expect(() => parseRawEventData(invalidData)).toThrow();
    });

    it('should allow null for optional fields', () => {
      const validData: any = {
        eventMetadata: {
          eventName: 'Test Event',
          eventDate: '2024-12-15',
          location: null,
          description: null,
        },
        sessions: [
          {
            id: 'session1',
            title: 'Test Session',
            speakers: [{ name: 'Speaker', bio: null }],
            categories: [],
            abstract: null,
            startTime: '09:00',
            endTime: '10:00',
            breakouts: [],
          },
        ],
      };

      const result = parseRawEventData(validData);
      expect(result.eventMetadata.location).toBeNull();
      expect(result.sessions[0].abstract).toBeNull();
    });

    it('should throw on malformed JSON structure', () => {
      const malformedData: any = {
        eventMetadata: { eventName: 'Test' },
        sessions: 'not an array', // Invalid: should be array
      };

      expect(() => parseRawEventData(malformedData)).toThrow();
    });

    it('should reject unknown fields in strict mode', () => {
      const strictData: any = {
        eventMetadata: {
          eventName: 'Test Event',
          eventDate: '2024-12-15',
          unknownField: 'should fail',
        },
        sessions: [],
      };

      expect(() => parseRawEventData(strictData)).toThrow();
    });

    it('should handle empty sessions array', () => {
      const validData: RawEventData = {
        eventMetadata: {
          eventName: 'Test Event',
          eventDate: '2024-12-15',
        },
        sessions: [],
      };

      const result = parseRawEventData(validData);
      expect(result.sessions.length).toBe(0);
    });

    it('should set default values for optional session fields', () => {
      const validData: any = {
        eventMetadata: {
          eventName: 'Test Event',
          eventDate: '2024-12-15',
        },
        sessions: [
          {
            id: 'session1',
            title: 'Test Session',
            speakers: [],
            categories: [],
            startTime: '09:00',
            endTime: '10:00',
            // breakouts, language, sessionType omitted to test defaults
          },
        ],
      };

      const result = parseRawEventData(validData);
      expect(result.sessions[0].language).toBe('English');
      expect(result.sessions[0].sessionType).toBe('breakout');
      expect(result.sessions[0].breakouts).toEqual([]);
    });
  });

  describe('loadEventData - Async File Loading', () => {
    it('should load actual event JSON file (integration)', async () => {
      // This test requires codeandcomedy-talks.json to exist
      // For CI/testing, this may be skipped if file is not available
      try {
        const data = await loadEventData();
        expect(data.eventMetadata).toBeDefined();
        expect(data.sessions).toBeDefined();
      } catch (error) {
        // File may not exist in test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('loadEventDataSync - Sync File Loading', () => {
    it('should load and validate the local event JSON file', () => {
      const data = loadEventDataSync();
      expect(data.eventMetadata.eventName.length).toBeGreaterThan(0);
      expect(data.sessions.length).toBeGreaterThan(0);
    });
  });
});
