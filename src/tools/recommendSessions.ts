import { z } from 'zod';
import { EventModel, RecommendationResult, ToolResponse } from '../domain/eventModel';
import { recommendSessions } from '../domain/recommendationQueries';
import * as common from './common';

export const RecommendSessionsInputSchema = z
  .object({
    interests: z.string().min(1, 'Interests must not be empty'),
    limit: z.number().int().min(1).max(50).default(10),
  })
  .strict();

/**
 * recommend_sessions tool
 * Returns deterministic recommendations with explicit match reasons.
 */
export function recommendSessionsHandler(
  model: EventModel,
  input: unknown
): ToolResponse<RecommendationResult[]> {
  const parseResult = common.validateInput(RecommendSessionsInputSchema, input);
  if ('error' in parseResult) {
    return parseResult;
  }

  try {
    const recommendations = recommendSessions(
      model,
      parseResult.interests,
      parseResult.limit ?? 10
    );
    return common.successResponse(recommendations);
  } catch {
    return common.errorResponse('Failed to generate recommendations');
  }
}
