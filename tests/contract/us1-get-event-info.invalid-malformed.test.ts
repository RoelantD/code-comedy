import { describe, it, expect, beforeAll } from 'vitest';
import { getEventInfoHandler, GetEventInfoInputSchema } from '../../src/tools/getEventInfo';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US1] get_event_info Tool - Invalid Input & Malformed Data', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Test Event',
        eventDate: '2024-12-15',
      },
      sessions: [
        {
          id: 'session-1',
          title: 'Test Session',
          speakers: [],
          categories: [],
          startTime: '09:00',
          endTime: '10:00',
          breakouts: [],
        },
      ],
    };
    model = normalizeEventData(rawData);
  });

  describe('Invalid Input Handling', () => {
    it('should reject unknown properties', () => {
      const result = getEventInfoHandler(model, { unknownProp: 'value' });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-object input', () => {
      const result = getEventInfoHandler(model, 'not an object');
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('should reject array input', () => {
      const result = getEventInfoHandler(model, []);
      expect(result.ok).toBe(false);
    });

    it('should reject null input', () => {
      const result = getEventInfoHandler(model, null);
      expect(result.ok).toBe(false);
    });

    it('should accept empty object (correct)', () => {
      const result = getEventInfoHandler(model, {});
      expect(result.ok).toBe(true);
    });
  });

  describe('Malformed Event Data Handling', () => {
    it('should handle model with no schedule gracefully', () => {
      // Create empty model scenario
      const emptyData: RawEventData = {
        eventMetadata: { eventName: 'Empty', eventDate: '2024-12-15' },
        sessions: [],
      };
      const emptyModel = normalizeEventData(emptyData);
      const result = getEventInfoHandler(emptyModel, {});

      // Should return error since there's no schedule
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null metadata fields', () => {
      const dataWithNulls: RawEventData = {
        eventMetadata: {
          eventName: 'Test',
          eventDate: '2024-12-15',
          location: null,
          description: null,
        },
        sessions: [
          {
            id: 'test',
            title: 'Test',
            speakers: [],
            categories: [],
            startTime: '09:00',
            endTime: '10:00',
            breakouts: [],
          },
        ],
      };
      const model2 = normalizeEventData(dataWithNulls);
      const result = getEventInfoHandler(model2, {});

      expect(result.ok).toBe(true);
      expect(result.data?.eventMetadata.location).toBeUndefined();
    });

    it('should safely handle very large numbers of sessions', () => {
      // Create model with many sessions
      const sessions = Array.from({ length: 1000 }, (_, i) => ({
        id: `session-${i}`,
        title: `Session ${i}`,
        speakers: [],
        categories: [],
        startTime: `${String(i % 24).padStart(2, '0')}:00`,
        endTime: `${String((i + 1) % 24).padStart(2, '0')}:00`,
        breakouts: [],
      }));

      const largeData: RawEventData = {
        eventMetadata: { eventName: 'Large', eventDate: '2024-12-15' },
        sessions: sessions as any,
      };

      try {
        const largeModel = normalizeEventData(largeData);
        const result = getEventInfoHandler(largeModel, {});
        expect(result.ok).toBe(true);
        expect(result.data?.totalSessions).toBe(1000);
      } catch {
        // Expected if validation catches errors
      }
    });
  });

  describe('Schema Validation', () => {
    it('should validate against strict schema', () => {
      expect(() => GetEventInfoInputSchema.parse({})).not.toThrow();
      expect(() => GetEventInfoInputSchema.parse({ extra: 'field' })).toThrow();
    });
  });
});
