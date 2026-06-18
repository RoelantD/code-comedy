import { z } from 'zod';
import { EventModel, ToolResponse } from '../domain/eventModel';
import * as common from './common';

const SearchSessionsInputSchema = z
  .object({
    query: z.string().min(1, 'Query must not be empty'),
  })
  .strict();

export interface SearchMatch {
  sessionId: string;
  title: string;
  abstract?: string;
  speakers: Array<{ speakerId: string; name: string; bio?: string }>;
  categories: string[];
  matchedFields: string[];
  matchReasons: string[];
}

/**
 * Search sessions by keywords across title, abstract, speakers, and categories
 */
export function searchSessionsHandler(
  model: EventModel,
  input: Record<string, unknown>
): ToolResponse<SearchMatch[]> {
  const parseResult = common.validateInput(SearchSessionsInputSchema, input);
  if ('error' in parseResult) {
    return parseResult as { ok: false; error: string };
  }

  const query = parseResult.query.toLowerCase();
  const results: SearchMatch[] = [];

  for (const session of model.flattenedSessions) {
    const matchedFields: string[] = [];
    const matchReasons: string[] = [];

    // Check title match
    if (session.title.toLowerCase().includes(query)) {
      matchedFields.push('title');
      matchReasons.push(`Title contains "${query}"`);
    }

    // Check abstract match
    if (session.abstract && session.abstract.toLowerCase().includes(query)) {
      matchedFields.push('abstract');
      matchReasons.push(`Abstract contains "${query}"`);
    }

    // Check speaker matches
    const matchingSpeakers = session.speakers.filter((sp) =>
      sp.name.toLowerCase().includes(query)
    );
    if (matchingSpeakers.length > 0) {
      matchedFields.push('speakers');
      matchReasons.push(
        `Speaker names: ${matchingSpeakers.map((sp) => sp.name).join(', ')}`
      );
    }

    // Check category matches
    const matchingCategories = session.categories.filter((c) =>
      c.name.toLowerCase().includes(query)
    );
    if (matchingCategories.length > 0) {
      matchedFields.push('categories');
      matchReasons.push(
        `Categories: ${matchingCategories.map((c) => c.name).join(', ')}`
      );
    }

    // Add to results if any match found
    if (matchedFields.length > 0) {
      results.push({
        sessionId: session.sessionId,
        title: session.title,
        abstract: session.abstract,
        speakers: Array.from(session.speakers),
        categories: session.categories.map((category) => category.name),
        matchedFields,
        matchReasons,
      });
    }
  }

  return common.successResponse(results);
}
