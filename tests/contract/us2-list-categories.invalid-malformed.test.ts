import { describe, it, expect, beforeAll } from 'vitest';
import { listCategoriesHandler } from '../../src/tools/listCategories';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US2] list_categories Tool - Invalid Input & Malformed Data', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'US2 Categories Test Event',
        eventDate: '2024-12-15',
      },
      sessions: [
        {
          id: 'session-1',
          title: 'Practical MCP',
          speakers: [{ name: 'Dana API' }],
          categories: [
            { id: 'mcp', name: 'MCP' },
            { id: 'agents', name: 'Agents' },
          ],
          startTime: '13:00',
          endTime: '14:00',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('rejects non-empty input', () => {
    const result = listCategoriesHandler(model, { query: 'mcp' });
    expect(result.ok).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = listCategoriesHandler(model, 123);
    expect(result.ok).toBe(false);
  });

  it('returns categories and linked sessions for valid empty input', () => {
    const result = listCategoriesHandler(model, {});
    expect(result.ok).toBe(true);
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.[0].sessions.length).toBeGreaterThan(0);
  });

  it('returns categories sorted by name', () => {
    const result = listCategoriesHandler(model, {});
    const names = result.data?.map((category) => category.name) ?? [];
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('throws when malformed session data is normalized', () => {
    const malformed: RawEventData = {
      eventMetadata: { eventName: 'Broken', eventDate: '2024-12-15' },
      sessions: [
        {
          id: 'broken',
          title: 'Broken',
          speakers: [],
          categories: [],
          startTime: '10:30',
          endTime: '09:30',
          breakouts: [],
        },
      ],
    };

    expect(() => normalizeEventData(malformed)).toThrow();
  });
});
