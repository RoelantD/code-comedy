import { describe, it, expect, beforeAll } from 'vitest';
import { getSessionDetailsHandler } from '../../src/tools/getSessionDetails';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US2] get_session_details Tool - Invalid Input & Malformed Data', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'US2 Session Details Event',
        eventDate: '2024-12-15',
      },
      sessions: [
        {
          id: 'session-main',
          title: 'Architecture Deep Dive',
          speakers: [{ name: 'Eli System' }],
          categories: [{ id: 'arch', name: 'Architecture' }],
          abstract: 'System design at scale',
          language: 'English',
          sessionType: 'workshop',
          startTime: '15:00',
          endTime: '16:00',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('rejects missing sessionId', () => {
    const result = getSessionDetailsHandler(model, {});
    expect(result.ok).toBe(false);
  });

  it('rejects empty sessionId', () => {
    const result = getSessionDetailsHandler(model, { sessionId: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects unknown properties', () => {
    const result = getSessionDetailsHandler(model, { sessionId: 'session-main', query: 'x' });
    expect(result.ok).toBe(false);
  });

  it('returns an error when session does not exist', () => {
    const result = getSessionDetailsHandler(model, { sessionId: 'missing-session' });
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns a matching session for valid input', () => {
    const result = getSessionDetailsHandler(model, { sessionId: 'session-main' });
    expect(result.ok).toBe(true);
    expect(result.data?.sessionId).toBe('session-main');
  });

  it('throws on malformed source data while normalizing', () => {
    const malformed: RawEventData = {
      eventMetadata: { eventName: 'Broken', eventDate: '2024-12-15' },
      sessions: [
        {
          id: 'broken-1',
          title: 'Broken Time',
          speakers: [],
          categories: [],
          startTime: '12:30',
          endTime: '11:00',
          breakouts: [],
        },
      ],
    };

    expect(() => normalizeEventData(malformed)).toThrow();
  });
});
