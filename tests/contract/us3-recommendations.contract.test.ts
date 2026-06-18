import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { recommendSessionsHandler } from '../../src/tools/recommendSessions';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US3] recommend_sessions Tool - Contract Tests', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Code and Comedy Recommendations',
        eventDate: '2024-12-20',
      },
      sessions: [
        {
          id: 'mcp-basics',
          title: 'MCP Basics for Agent Builders',
          speakers: [{ name: 'Jamie Protocol' }],
          categories: [{ id: 'mcp', name: 'MCP' }],
          abstract: 'Build practical MCP tools with deterministic contracts.',
          language: 'English',
          sessionType: 'workshop',
          startTime: '09:30',
          endTime: '10:30',
          breakouts: [],
        },
        {
          id: 'agent-testing',
          title: 'Testing AI Agent Workflows',
          speakers: [{ name: 'Casey Test' }],
          categories: [{ id: 'agents', name: 'Agents' }],
          abstract: 'Contract and integration testing patterns for agent systems.',
          language: 'English',
          sessionType: 'panel',
          startTime: '11:00',
          endTime: '12:00',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('returns ranked recommendations for matching interests', () => {
    const result = recommendSessionsHandler(model, {
      interests: 'mcp agent testing',
      limit: 5,
    });

    expect(result.ok).toBe(true);
    expect(result.data?.length).toBeGreaterThan(0);

    const first = result.data?.[0];
    expect(first?.sessionId).toBeDefined();
    expect(first?.score).toBeGreaterThan(0);
    expect(first?.matchReasons.length).toBeGreaterThan(0);
  });

  it('returns empty recommendations when there are no matches', () => {
    const result = recommendSessionsHandler(model, {
      interests: 'quantum networking biomedical',
      limit: 3,
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});
