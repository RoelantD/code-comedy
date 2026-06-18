import { z } from 'zod';
import { EventModel, ToolResponse } from '../domain/eventModel';
import * as common from './common';

const ListCategoriesInputSchema = z.object({}).strict();

export interface CategoryInfo {
  categoryId: string;
  name: string;
  sessions: Array<{ sessionId: string; title: string }>;
}

/**
 * List all session categories sorted by name, with linked sessions
 */
export function listCategoriesHandler(
  model: EventModel,
  input: Record<string, unknown>
): ToolResponse<CategoryInfo[]> {
  const parseResult = common.validateInput(ListCategoriesInputSchema, input);
  if ('error' in parseResult) {
    return parseResult as { ok: false; error: string };
  }

  // Deduplicate categories by ID
  const categoryMap = new Map<string, string>();
  for (const session of model.flattenedSessions) {
    for (const category of session.categories) {
      if (!categoryMap.has(category.categoryId)) {
        categoryMap.set(category.categoryId, category.name);
      }
    }
  }

  // Sort by name
  const categories = Array.from(categoryMap.entries())
    .map(([id, name]) => ({
      categoryId: id,
      name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Link sessions to each category
  const results: CategoryInfo[] = categories.map((category) => ({
    categoryId: category.categoryId,
    name: category.name,
    sessions: model.flattenedSessions
      .filter((session) =>
        session.categories.some((c) => c.categoryId === category.categoryId)
      )
      .map((session) => ({
        sessionId: session.sessionId,
        title: session.title,
      })),
  }));

  return common.successResponse(results);
}
