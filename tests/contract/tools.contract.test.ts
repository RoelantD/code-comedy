import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';
import { getEventInfoHandler } from '../../src/tools/getEventInfo';
import { listScheduleHandler } from '../../src/tools/listSchedule';
import { getCurrentOrNextHandler } from '../../src/tools/getCurrentOrNextItem';
import { searchSessionsHandler } from '../../src/tools/searchSessions';
import { listSpeakersHandler } from '../../src/tools/listSpeakers';
import { listCategoriesHandler } from '../../src/tools/listCategories';
import { getSessionDetailsHandler } from '../../src/tools/getSessionDetails';
import { recommendSessionsHandler } from '../../src/tools/recommendSessions';

describe('All Tools - Contract Regression Suite', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'Contract Regression Event',
        eventDate: '2024-12-20',
        location: 'Main Venue',
      },
      sessions: [
        {
          id: 'opening',
          title: 'Opening Keynote',
          speakers: [{ name: 'Pat Intro' }],
          categories: [{ id: 'keynote', name: 'Keynote' }],
          abstract: 'Conference kickoff and roadmap.',
          language: 'English',
          sessionType: 'keynote',
          startTime: '09:00',
          endTime: '10:00',
          breakouts: [],
        },
        {
          id: 'mcp-lab',
          title: 'MCP Tooling Lab',
          speakers: [{ name: 'Lee Protocol' }],
          categories: [{ id: 'mcp', name: 'MCP' }],
          abstract: 'Hands-on MCP implementation lab.',
          language: 'English',
          sessionType: 'workshop',
          startTime: '10:30',
          endTime: '11:30',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('get_event_info returns success payload', () => {
    const result = getEventInfoHandler(model, {});
    expect(result.ok).toBe(true);
    expect(result.data?.totalSessions).toBeGreaterThan(0);
  });

  it('list_schedule returns chronological items', () => {
    const result = listScheduleHandler(model, {});
    expect(result.ok).toBe(true);
    const starts = result.data?.map((item) => item.startTime) ?? [];
    const sorted = [...starts].sort();
    expect(starts).toEqual(sorted);
  });

  it('get_current_or_next_item returns context objects', () => {
    const result = getCurrentOrNextHandler(model, { currentTime: '09:15' });
    expect(result.ok).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('search_sessions returns structured match details', () => {
    const result = searchSessionsHandler(model, { query: 'mcp' });
    expect(result.ok).toBe(true);
    const first = result.data?.[0];
    if (first) {
      expect(first.matchedFields.length).toBeGreaterThan(0);
      expect(first.matchReasons.length).toBeGreaterThan(0);
    }
  });

  it('list_speakers returns linked sessions', () => {
    const result = listSpeakersHandler(model, {});
    expect(result.ok).toBe(true);
    expect(result.data?.[0].sessions).toBeDefined();
  });

  it('list_categories returns linked sessions', () => {
    const result = listCategoriesHandler(model, {});
    expect(result.ok).toBe(true);
    expect(result.data?.[0].sessions).toBeDefined();
  });

  it('get_session_details returns data for known session', () => {
    const result = getSessionDetailsHandler(model, { sessionId: 'opening' });
    expect(result.ok).toBe(true);
    expect(result.data?.title).toContain('Opening');
  });

  it('recommend_sessions returns explainable recommendations', () => {
    const result = recommendSessionsHandler(model, { interests: 'mcp tools', limit: 5 });
    expect(result.ok).toBe(true);
    const first = result.data?.[0];
    if (first) {
      expect(first.score).toBeGreaterThan(0);
      expect(first.matchReasons.length).toBeGreaterThan(0);
    }
  });
});
