import { EventModel, ToolResponse, SessionDetail } from '../domain/eventModel';
import { successResponse, errorResponse, validateInput, formatSessionDetail } from './common';
import { getCurrentSession, getNextSession } from '../domain/scheduleQueries';
import { z } from 'zod';

export const GetCurrentOrNextInputSchema = z
  .object({
    currentTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm format')
      .optional(),
  })
  .strict();

export interface CurrentOrNextOutput {
  readonly current: Partial<SessionDetail> | null;
  readonly next: Partial<SessionDetail> | null;
}

/**
 * get_current_or_next_item tool
 * Returns the current and next session based on time context
 */
export function getCurrentOrNextHandler(
  model: EventModel,
  input: unknown
): ToolResponse<CurrentOrNextOutput> {
  // Validate input
  const validated = validateInput(GetCurrentOrNextInputSchema, input);
  if ('error' in validated) {
    return validated;
  }

  try {
    // Use provided time or current time
    let timeToCheck = validated.currentTime;
    if (!timeToCheck) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      timeToCheck = `${hours}:${minutes}`;
    }

    const current = getCurrentSession(model, timeToCheck);
    const next = getNextSession(model, timeToCheck);

    return successResponse({
      current: current ? formatSessionDetail(current) : null,
      next: next ? formatSessionDetail(next) : null,
    });
  } catch (error) {
    return errorResponse('Failed to determine current or next session');
  }
}
