import { EventModel, ToolResponse, ScheduleItem } from '../domain/eventModel';
import { successResponse, errorResponse, validateInput } from './common';
import { z } from 'zod';

export const ListScheduleInputSchema = z.object({}).strict();

/**
 * list_schedule tool
 * Returns the complete chronological schedule of all sessions and breakouts
 */
export function listScheduleHandler(
  model: EventModel,
  _input: unknown
): ToolResponse<ReadonlyArray<ScheduleItem>> {
  // Validate (input should be empty object)
  const validated = validateInput(ListScheduleInputSchema, _input);
  if ('error' in validated) {
    return validated;
  }

  try {
    const schedule = model.chronologicalSchedule.map((item) => ({
      sessionId: item.sessionId,
      startTime: item.startTime,
      endTime: item.endTime,
      title: item.title,
    }));

    return successResponse(schedule);
  } catch (error) {
    return errorResponse('Failed to retrieve schedule');
  }
}
