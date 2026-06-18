import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { findSessionsInTimeWindow, getCurrentSession, getNextSession } from '../../src/domain/scheduleQueries';
import { RawEventData } from '../../src/data/schemas';

describe('[US1] Timeline Integration Tests - Behavior', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Test Conference',
        eventDate: '2024-12-15',
      },
      sessions: [
        {
          id: 'morning-track',
          title: 'Morning Track',
          speakers: [],
          categories: [],
          startTime: '09:00',
          endTime: '12:00',
          breakouts: [
            {
              title: 'Part 1',
              speakers: [],
              categories: [],
              startTime: '09:00',
              endTime: '10:00',
            },
            {
              title: 'Part 2',
              speakers: [],
              categories: [],
              startTime: '10:15',
              endTime: '11:00',
            },
            {
              title: 'Part 3',
              speakers: [],
              categories: [],
              startTime: '11:15',
              endTime: '12:00',
            },
          ],
        },
        {
          id: 'lunch',
          title: 'Lunch Break',
          speakers: [],
          categories: [],
          startTime: '12:00',
          endTime: '13:00',
          breakouts: [],
        },
        {
          id: 'afternoon-track',
          title: 'Afternoon Track',
          speakers: [],
          categories: [],
          startTime: '13:00',
          endTime: '17:00',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  describe('Schedule Overlap Preservation', () => {
    it('should preserve time gaps between breakouts', () => {
      // Gap between 10:00-10:15
      const atGap = getCurrentSession(model, '10:10');
      // Should find the parent session "morning-track" which runs 09:00-12:00
      // The parent session covers this gap even though its breakouts don't
      const flattened = model.flattenedSessions;
      const breakoutAtGap = flattened.find(
        (s) => s.startTime <= '10:10' && s.endTime > '10:10' && s.sessionType === 'breakout' && s.title.includes('Part')
      );
      // Specifically, no breakout session at 10:10 (gap between Part 2 and Part 3)
      expect(breakoutAtGap).toBeUndefined();
      // But the parent session is found
      expect(atGap?.title).toContain('Morning Track');
    });

    it('should find all sessions in overlapping morning window', () => {
      const overlapping = findSessionsInTimeWindow(model, '09:30', '11:30');
      expect(overlapping.length).toBeGreaterThan(1); // Multiple sessions in window
    });

    it('should distinguish sessions across day', () => {
      const morning = findSessionsInTimeWindow(model, '09:00', '12:00');
      const lunch = findSessionsInTimeWindow(model, '12:00', '13:00');
      const afternoon = findSessionsInTimeWindow(model, '13:00', '17:00');

      expect(morning.length).toBeGreaterThan(0);
      expect(lunch.length).toBeGreaterThan(0);
      expect(afternoon.length).toBeGreaterThan(0);
    });
  });

  describe('Time Context Transitions', () => {
    it('should transition from morning to lunch', () => {
      const atElevenFifty = getCurrentSession(model, '11:50');
      const atTwelve = getCurrentSession(model, '12:00');
      const atTwelveThirty = getCurrentSession(model, '12:30');

      expect(atElevenFifty).toBeDefined();
      expect(atTwelve).toBeDefined();
      expect(atTwelveThirty).toBeDefined();
    });

    it('should report correct next session', () => {
      const nextAtMorning = getNextSession(model, '11:50');
      expect(nextAtMorning?.title).toContain('Lunch');

      const nextAtLunch = getNextSession(model, '12:30');
      expect(nextAtLunch?.title).toContain('Afternoon');
    });

    it('should handle session boundaries correctly', () => {
      // Session at 12:00-13:00, query at 12:00 should find it
      const sessions = findSessionsInTimeWindow(model, '12:00', '12:01');
      expect(sessions.some((s) => s.title.includes('Lunch'))).toBe(true);

      // Query right at end: 13:00 should NOT include 12:00-13:00 session
      const atEnd = findSessionsInTimeWindow(model, '13:00', '13:01');
      const hasLunch = atEnd.some((s) => s.title.includes('Lunch'));
      expect(hasLunch).toBe(false);
    });
  });

  describe('Flattened Breakout Behavior', () => {
    it('should include breakout sessions in chronological schedule', () => {
      const breakoutTitles = model.chronologicalSchedule
        .filter((s) => s.title.includes('Part'))
        .map((s) => s.title);

      expect(breakoutTitles.length).toBe(3); // Part 1, 2, 3
    });

    it('should order flattened items chronologically', () => {
      const times = model.chronologicalSchedule.map((s) => s.startTime);
      expect(times).toEqual([...times].sort());
    });

    it('should preserve parent session if no breakouts', () => {
      const lunchItems = model.chronologicalSchedule.filter(
        (s) => s.title.includes('Lunch')
      );
      expect(lunchItems.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions back-to-back without gaps', () => {
      // 12:00 lunch ends, 13:00 afternoon starts
      const sessions = findSessionsInTimeWindow(model, '12:00', '13:00');
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should handle single-minute sessions', async () => {
      // Create a model with very short session
      const tinyData: RawEventData = {
        eventMetadata: { eventName: 'Test', eventDate: '2024-12-15' },
        sessions: [
          {
            id: 'tiny',
            title: 'One Minute',
            speakers: [],
            categories: [],
            startTime: '14:00',
            endTime: '14:01',
            breakouts: [],
          },
        ],
      };

      const tinyModel = normalizeEventData(tinyData);
      const current = getCurrentSession(tinyModel, '14:00');
      expect(current?.title).toContain('One Minute');

      const next = getNextSession(tinyModel, '14:00');
      expect(next).toBeUndefined(); // No next session
    });
  });
});
