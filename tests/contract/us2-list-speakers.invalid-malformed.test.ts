import { describe, it, expect, beforeAll } from 'vitest';
import { listSpeakersHandler } from '../../src/tools/listSpeakers';
import { normalizeEventData } from '../../src/domain/normalizeEventData';
import { EventModel } from '../../src/domain/eventModel';
import { RawEventData } from '../../src/data/schemas';

describe('[US2] list_speakers Tool - Invalid Input & Malformed Data', () => {
  let model: EventModel;

  beforeAll(() => {
    const rawData: RawEventData = {
      eventMetadata: {
        eventName: 'US2 Speakers Test Event',
        eventDate: '2024-12-15',
      },
      sessions: [
        {
          id: 'session-1',
          title: 'Team Tooling',
          speakers: [
            { name: 'Bri Code', bio: null },
            { name: 'Chris Build', bio: 'Platform lead' },
          ],
          categories: [{ id: 'devx', name: 'Developer Experience' }],
          startTime: '09:00',
          endTime: '10:00',
          breakouts: [],
        },
      ],
    };

    model = normalizeEventData(rawData);
  });

  it('rejects non-empty input', () => {
    const result = listSpeakersHandler(model, { query: 'alex' });
    expect(result.ok).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = listSpeakersHandler(model, 'invalid');
    expect(result.ok).toBe(false);
  });

  it('returns sorted speakers for valid empty input', () => {
    const result = listSpeakersHandler(model, {});
    expect(result.ok).toBe(true);
    expect(result.data?.length).toBeGreaterThan(0);

    const names = result.data?.map((speaker) => speaker.name) ?? [];
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('handles null bios without crashing', () => {
    const result = listSpeakersHandler(model, {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      const hasNullableBio = result.data?.some((speaker) => speaker.bio == null);
      expect(hasNullableBio).toBe(true);
    }
  });

  it('normalization fails for malformed time ranges', () => {
    const malformed: RawEventData = {
      eventMetadata: { eventName: 'Bad', eventDate: '2024-12-15' },
      sessions: [
        {
          id: 'bad',
          title: 'Bad',
          speakers: [],
          categories: [],
          startTime: '18:00',
          endTime: '08:00',
          breakouts: [],
        },
      ],
    };

    expect(() => normalizeEventData(malformed)).toThrow();
  });
});
