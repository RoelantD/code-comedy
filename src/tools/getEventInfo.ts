import { EventModel, ToolResponse, EventMetadata } from '../domain/eventModel';
import { successResponse, errorResponse, validateInput } from './common';
import { z } from 'zod';

export const GetEventInfoInputSchema = z.object({}).strict();

export interface GetEventInfoOutput {
  readonly eventMetadata: EventMetadata;
  readonly totalSessions: number;
  readonly totalScheduleItems: number;
  readonly startTime: string;
  readonly endTime: string;
}

/**
 * get_event_info tool
 * Returns event metadata and overall schedule statistics
 */
export function getEventInfoHandler(
  model: EventModel,
  _input: unknown
): ToolResponse<GetEventInfoOutput> {
  // Validate (input should be empty object)
  const validated = validateInput(GetEventInfoInputSchema, _input);
  if ('error' in validated) {
    return validated;
  }

  try {
    const schedule = model.chronologicalSchedule;
    if (schedule.length === 0) {
      return errorResponse('No schedule items found');
    }

    return successResponse({
      eventMetadata: model.eventMetadata,
      totalSessions: model.flattenedSessions.length,
      totalScheduleItems: schedule.length,
      startTime: schedule[0].startTime,
      endTime: schedule[schedule.length - 1].endTime,
    });
  } catch (error) {
    return errorResponse('Failed to retrieve event info');
  }
}
