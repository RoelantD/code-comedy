import { describe, it, expect, beforeAll } from 'vitest';
import { searchSessionsHandler } from '../../src/tools/searchSessions';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US2] search_sessions Tool - Invalid Input & Malformed Data', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'US2 Search Test Event',
        eventDate: '2024-12-15',
      },
      sessions: [
        {
          id: 'ai-session',
          title: 'AI Agents in Production',
          speakers: [{ name: 'Alex Dev' }],
          categories: [{ id: 'ai', name: 'AI' }],
          abstract: 'Using agents for reliability and productivity.',
          language: 'English',
          sessionType: 'workshop',
          startTime: '10:00',
          endTime: '11:00',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('rejects missing query', () => {
    const result = searchSessionsHandler(model, {});
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects empty query', () => {
    const result = searchSessionsHandler(model, { query: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects unknown properties', () => {
    const result = searchSessionsHandler(model, { query: 'ai', limit: 10 });
    expect(result.ok).toBe(false);
  });

  it('returns empty matches when no session matches query', () => {
    const result = searchSessionsHandler(model, { query: 'non-existent-term' });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('throws on malformed source data while normalizing', () => {
    const malformed: RawEventData = {
      eventMetadata: {
        eventName: 'Malformed',
        eventDate: '2024-12-15',
      },
      sessions: [
        {
          id: 'bad-time',
          title: 'Broken Session',
          speakers: [],
          categories: [],
          startTime: '11:00',
          endTime: '10:30',
          breakouts: [],
        },
      ],
    };

    expect(() => normalizeEventData(malformed)).toThrow();
  });
});
