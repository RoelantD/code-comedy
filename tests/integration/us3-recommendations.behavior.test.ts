import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { recommendSessionsHandler } from '../../src/tools/recommendSessions';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US3] Recommendations - Integration Behavior', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Recommendation Integration Event',
        eventDate: '2024-12-20',
      },
      sessions: [
        {
          id: 'mcp-advanced',
          title: 'Advanced MCP Orchestration',
          speakers: [{ name: 'Morgan API' }],
          categories: [{ id: 'mcp', name: 'MCP' }],
          abstract: 'Advanced patterns for composing MCP tools and transports.',
          language: 'English',
          sessionType: 'workshop',
          startTime: '09:00',
          endTime: '10:00',
          breakouts: [],
        },
        {
          id: 'agent-ux',
          title: 'Agent UX Design',
          speakers: [{ name: 'Riley Product' }],
          categories: [{ id: 'agents', name: 'Agents' }],
          abstract: 'Designing trustworthy and explainable agent interactions.',
          language: 'English',
          sessionType: 'panel',
          startTime: '10:15',
          endTime: '11:15',
          breakouts: [],
        },
        {
          id: 'typescript-pragmatics',
          title: 'TypeScript for Production APIs',
          speakers: [{ name: 'Taylor Types' }],
          categories: [{ id: 'ts', name: 'TypeScript' }],
          abstract: 'Type-safe APIs and runtime validation with Zod.',
          language: 'English',
          sessionType: 'workshop',
          startTime: '11:30',
          endTime: '12:30',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('sorts recommendations by descending score', () => {
    const result = recommendSessionsHandler(model, {
      interests: 'mcp tool workshop',
      limit: 10,
    });

    expect(result.ok).toBe(true);
    const scores = result.data?.map((item) => item.score) ?? [];
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it('returns empty data when interests contain only separators', () => {
    const result = recommendSessionsHandler(model, {
      interests: ' , ;  . ',
      limit: 5,
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('returns deterministic output order for equal scores', () => {
    const input = { interests: 'workshop', limit: 10 };
    const first = recommendSessionsHandler(model, input);
    const second = recommendSessionsHandler(model, input);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(first.data).toEqual(second.data);
  });

  it('honors the result limit', () => {
    const result = recommendSessionsHandler(model, {
      interests: 'mcp agents typescript workshop',
      limit: 1,
    });

    expect(result.ok).toBe(true);
    expect(result.data?.length).toBeLessThanOrEqual(1);
  });
});
