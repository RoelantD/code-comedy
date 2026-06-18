import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { recommendSessionsHandler, RecommendSessionsInputSchema } from '../../src/tools/recommendSessions';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US3] recommend_sessions Tool - Invalid Input & Malformed Data', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Recommendations Invalid Input Event',
        eventDate: '2024-12-20',
      },
      sessions: [
        {
          id: 'session-1',
          title: 'Practical Agents',
          speakers: [{ name: 'Jordan Agent' }],
          categories: [{ id: 'agents', name: 'Agents' }],
          abstract: 'Agent systems in production.',
          language: 'English',
          sessionType: 'panel',
          startTime: '14:00',
          endTime: '15:00',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('rejects missing interests', () => {
    const result = recommendSessionsHandler(model, {});
    expect(result.ok).toBe(false);
  });

  it('rejects empty interests', () => {
    const result = recommendSessionsHandler(model, { interests: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects limit lower than minimum', () => {
    const result = recommendSessionsHandler(model, { interests: 'agents', limit: 0 });
    expect(result.ok).toBe(false);
  });

  it('rejects limit greater than maximum', () => {
    const result = recommendSessionsHandler(model, { interests: 'agents', limit: 99 });
    expect(result.ok).toBe(false);
  });

  it('rejects unknown properties', () => {
    const result = recommendSessionsHandler(model, {
      interests: 'agents',
      limit: 5,
      extra: true,
    });
    expect(result.ok).toBe(false);
  });

  it('normalization fails for malformed time ranges', () => {
    const malformed: RawEventData = {
      eventMetadata: { eventName: 'Broken', eventDate: '2024-12-20' },
      sessions: [
        {
          id: 'bad',
          title: 'Broken',
          speakers: [],
          categories: [],
          startTime: '17:00',
          endTime: '16:00',
          breakouts: [],
        },
      ],
    };

    expect(() => normalizeEventData(malformed)).toThrow();
  });

  it('schema accepts valid payload', () => {
    expect(() =>
      RecommendSessionsInputSchema.parse({ interests: 'mcp agents', limit: 3 })
    ).not.toThrow();
  });
});
