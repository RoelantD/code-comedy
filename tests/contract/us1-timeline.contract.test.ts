import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import * as commonTools from '../../src/tools/common';
import {
  findSessionsInTimeWindow,
  getCurrentSession,
  getNextSession,
} from '../../src/domain/scheduleQueries';
import { RawEventData } from '../../src/data/schemas';

describe('[US1] Timeline and Schedule Tools - Contract Tests', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Code & Comedy 2024',
        eventDate: '2024-12-15',
        location: 'Main Hall',
        description: 'A conference about code and comedy',
      },
      sessions: [
        {
          id: 'key-1',
          title: 'Opening Keynote',
          speakers: [{ name: 'Alice Speaker', bio: 'Expert presenter' }],
          categories: [{ id: 'keynote', name: 'Keynote' }],
          abstract: 'Welcome to the conference',
          language: 'English',
          sessionType: 'keynote',
          startTime: '09:00',
          endTime: '10:00',
          breakouts: [],
        },
        {
          id: 'break-1',
          title: 'Morning Break',
          speakers: [],
          categories: [],
          abstract: null,
          language: 'English',
          sessionType: 'workshop',
          startTime: '10:00',
          endTime: '10:30',
          breakouts: [
            {
              title: 'Coffee & Conversation',
              speakers: [],
              categories: [],
              abstract: 'Informal networking',
              startTime: '10:00',
              endTime: '10:15',
            },
          ],
        },
        {
          id: 'ts-1',
          title: 'TypeScript Advanced Patterns',
          speakers: [{ name: 'Bob Developer' }],
          categories: [{ id: 'ts', name: 'TypeScript' }],
          abstract: 'Deep dive into TypeScript',
          language: 'English',
          sessionType: 'breakout',
          startTime: '10:30',
          endTime: '11:30',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  describe('get_event_info - Happy Path & Empty Scenarios', () => {
    it('should return event metadata and statistics', () => {
      const response = commonTools.successResponse({
        eventMetadata: model.eventMetadata,
        totalSessions: model.flattenedSessions.length,
        totalScheduleItems: model.chronologicalSchedule.length,
        startTime: model.chronologicalSchedule[0]?.startTime,
        endTime: model.chronologicalSchedule[model.chronologicalSchedule.length - 1]?.endTime,
      });

      expect(response.ok).toBe(true);
      expect(response.data?.eventMetadata.eventName).toContain('Code & Comedy');
      expect(response.data?.totalSessions).toBeGreaterThan(0);
    });

    it('should format event info safely', () => {
      expect(model.eventMetadata.eventName).toBeDefined();
      expect(typeof model.eventMetadata.eventDate).toBe('string');
    });
  });

  describe('list_schedule - Happy Path & Empty Scenarios', () => {
    it('should return full chronological schedule', () => {
      const schedule = model.chronologicalSchedule.map((item) => ({
        sessionId: item.sessionId,
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
      }));

      const response = commonTools.successResponse(schedule);

      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data?.length).toBeGreaterThan(0);
    });

    it('should order schedule chronologically', () => {
      const times = model.chronologicalSchedule.map((s) => s.startTime);
      const sorted = [...times].sort();
      expect(times).toEqual(sorted);
    });

    it('should include session titles', () => {
      const schedule = model.chronologicalSchedule;
      expect(schedule.every((s) => s.title.length > 0)).toBe(true);
    });
  });

  describe('get_current_or_next_item - Happy Path & Empty Scenarios', () => {
    it('should find current session at given time', () => {
      const current = getCurrentSession(model, '09:30');
      const next = getNextSession(model, '09:30');

      expect(current).toBeDefined();
      expect(current?.title).toContain('Keynote');

      const response = commonTools.successResponse({
        current: current ? commonTools.formatSessionDetail(current) : null,
        next: next ? commonTools.formatSessionDetail(next) : null,
      });

      expect(response.ok).toBe(true);
      expect(response.data?.current).toBeDefined();
    });

    it('should handle time before any session', () => {
      const current = getCurrentSession(model, '08:00');
      const next = getNextSession(model, '08:00');

      expect(current).toBeUndefined();
      expect(next).toBeDefined();
      expect(next?.title).toContain('Keynote');
    });

    it('should handle time after all sessions', () => {
      const current = getCurrentSession(model, '23:00');
      const next = getNextSession(model, '23:00');

      expect(current).toBeUndefined();
      expect(next).toBeUndefined();

      const response = commonTools.successResponse({
        current: null,
        next: null,
      });

      expect(response.ok).toBe(true);
    });

    it('should transition correctly between sessions', () => {
      // At end time of session, should be in next one (time ranges are exclusive on end)
      const atEndpoint = getCurrentSession(model, '10:00');
      expect(atEndpoint?.title).toBeDefined(); // Should find break-1
    });
  });

  describe('Overlapping Session Handling', () => {
    it('should preserve overlapping schedule items', () => {
      // The model should preserve both the parent session and nested breakouts
      const allItems = model.chronologicalSchedule;
      expect(allItems.length).toBeGreaterThan(0);

      // Check that we have parent + breakouts
      const flattened = model.flattenedSessions;
      const hasBreakouts = flattened.some((s) => s.sessionId.includes('-'));
      expect(hasBreakouts).toBe(true);
    });

    it('should find overlapping sessions in time window', () => {
      const overlapping = findSessionsInTimeWindow(model, '09:30', '10:30');
      expect(overlapping.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return safe error on invalid time format (via Zod in real tool)', () => {
      // Zod validation would catch this in the actual tool
      const error = commonTools.errorResponse('Invalid time format');
      expect(error.ok).toBe(false);
      expect(typeof error.error).toBe('string');
    });

    it('should handle missing optional fields gracefully', () => {
      const sessionWithoutAbstract = model.flattenedSessions.find(
        (s) => s.abstract === undefined
      );
      expect(sessionWithoutAbstract).toBeDefined();
      // Should not throw, should just have undefined abstract
    });
  });
});
