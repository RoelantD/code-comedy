import { z } from 'zod';
import { EventModel, ToolResponse } from '../domain/eventModel';
import * as common from './common';

const ListSpeakersInputSchema = z.object({}).strict();

export interface SpeakerInfo {
  speakerId: string;
  name: string;
  bio?: string;
  sessions: Array<{ sessionId: string; title: string }>;
}

/**
 * List all event speakers sorted by name, with linked sessions
 */
export function listSpeakersHandler(
  model: EventModel,
  input: Record<string, unknown>
): ToolResponse<SpeakerInfo[]> {
  const parseResult = common.validateInput(ListSpeakersInputSchema, input);
  if ('error' in parseResult) {
    return parseResult as { ok: false; error: string };
  }

  // Deduplicate speakers by ID
  const speakerMap = new Map<string, { name: string; bio?: string }>();
  for (const session of model.flattenedSessions) {
    for (const speaker of session.speakers) {
      if (!speakerMap.has(speaker.speakerId)) {
        speakerMap.set(speaker.speakerId, {
          name: speaker.name,
          bio: speaker.bio,
        });
      }
    }
  }

  // Sort by name
  const speakers = Array.from(speakerMap.entries())
    .map(([id, data]) => ({
      speakerId: id,
      ...data,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Link sessions to each speaker
  const results: SpeakerInfo[] = speakers.map((speaker) => ({
    speakerId: speaker.speakerId,
    name: speaker.name,
    bio: speaker.bio,
    sessions: model.flattenedSessions
      .filter((session) =>
        session.speakers.some((sp) => sp.speakerId === speaker.speakerId)
      )
      .map((session) => ({
        sessionId: session.sessionId,
        title: session.title,
      })),
  }));

  return common.successResponse(results);
}
