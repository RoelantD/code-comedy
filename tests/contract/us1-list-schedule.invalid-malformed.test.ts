import { describe, it, expect, beforeAll } from 'vitest';
import { listScheduleHandler, ListScheduleInputSchema } from '../../src/tools/listSchedule';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US1] list_schedule Tool - Invalid Input & Malformed Data', () => {
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
        {
          id: 'session-2',
          title: 'Session with Breakouts',
          speakers: [],
          categories: [],
          startTime: '10:30',
          endTime: '12:00',
          breakouts: [
            {
              title: 'Breakout A',
              speakers: [],
              categories: [],
              startTime: '10:30',
              endTime: '11:00',
            },
          ],
        },
      ],
    };
    model = normalizeEventData(rawData);
  });

  describe('Invalid Input Handling', () => {
    it('should reject unknown properties', () => {
      const result = listScheduleHandler(model, { filter: 'morning' });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-empty input', () => {
      const result = listScheduleHandler(model, { limit: 10 });
      expect(result.ok).toBe(false);
    });

    it('should accept empty object (correct)', () => {
      const result = listScheduleHandler(model, {});
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should reject null', () => {
      const result = listScheduleHandler(model, null);
      expect(result.ok).toBe(false);
    });

    it('should reject string', () => {
      const result = listScheduleHandler(model, 'invalid');
      expect(result.ok).toBe(false);
    });

    it('should reject array', () => {
      const result = listScheduleHandler(model, []);
      expect(result.ok).toBe(false);
    });
  });

  describe('Malformed Schedule Data', () => {
    it('should handle schedule with flattened breakouts', () => {
      const result = listScheduleHandler(model, {});
      expect(result.ok).toBe(true);
      // Should include both main sessions and breakouts
      expect(result.data?.length).toBeGreaterThanOrEqual(3); // 2 main + 1 breakout
    });

    it('should handle model with empty schedule', () => {
      const emptyData: RawEventData = {
        eventMetadata: { eventName: 'Empty', eventDate: '2024-12-15' },
        sessions: [],
      };
      const emptyModel = normalizeEventData(emptyData);
      const result = listScheduleHandler(emptyModel, {});

      expect(result.ok).toBe(true);
      expect(result.data?.length).toBe(0);
    });

    it('should maintain chronological order despite input', () => {
      const result = listScheduleHandler(model, {});
      expect(result.ok).toBe(true);

      const times = (result.data || []).map((s) => s.startTime);
      const sorted = [...times].sort();
      expect(times).toEqual(sorted);
    });

    it('should include all required fields in output', () => {
      const result = listScheduleHandler(model, {});
      expect(result.ok).toBe(true);

      const items = result.data || [];
      expect(items.length).toBeGreaterThan(0);

      items.forEach((item) => {
        expect(item.sessionId).toBeDefined();
        expect(item.startTime).toBeDefined();
        expect(item.endTime).toBeDefined();
        expect(item.title).toBeDefined();
      });
    });
  });

  describe('Schema Validation', () => {
    it('should validate empty object', () => {
      expect(() => ListScheduleInputSchema.parse({})).not.toThrow();
    });

    it('should reject any non-empty input', () => {
      expect(() => ListScheduleInputSchema.parse({ any: 'value' })).toThrow();
    });
  });
});
