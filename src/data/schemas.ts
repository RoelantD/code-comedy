import { z } from 'zod';

/**
 * Raw JSON schema validation for codeandcomedy-talks.json
 * Treats all fields as untrusted data on startup
 */

// Speaker schema
export const RawSpeakerSchema = z.object({
  name: z.string().min(1, 'Speaker name cannot be empty'),
  bio: z.string().optional().nullable(),
}).strict();

// Category schema
export const RawCategorySchema = z.object({
  id: z.string().min(1, 'Category ID cannot be empty'),
  name: z.string().min(1, 'Category name cannot be empty'),
}).strict();

// Breakout session (nested within parent session)
export const RawBreakoutSchema = z.object({
  title: z.string().min(1, 'Breakout title cannot be empty'),
  speakers: z.array(RawSpeakerSchema).default([]),
  categories: z.array(RawCategorySchema).default([]),
  abstract: z.string().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm format'),
}).strict();

// Main session schema
export const RawSessionSchema = z.object({
  id: z.string().min(1, 'Session ID cannot be empty'),
  title: z.string().min(1, 'Session title cannot be empty'),
  speakers: z.array(RawSpeakerSchema).default([]),
  categories: z.array(RawCategorySchema).default([]),
  abstract: z.string().optional().nullable(),
  language: z.string().default('English'),
  sessionType: z.string().min(1).default('breakout'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm format'),
  breakouts: z.array(RawBreakoutSchema).default([]),
}).strict();

// Event metadata
export const RawEventMetadataSchema = z.object({
  eventName: z.string().min(1, 'Event name cannot be empty'),
  eventDate: z.string().min(1, 'Event date cannot be empty'),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
}).strict();

// Root schema
export const RawEventDataSchema = z.object({
  eventMetadata: RawEventMetadataSchema,
  sessions: z.array(RawSessionSchema),
}).strict();

export type RawEventData = z.infer<typeof RawEventDataSchema>;
export type RawSession = z.infer<typeof RawSessionSchema>;
export type RawBreakout = z.infer<typeof RawBreakoutSchema>;
export type RawEventMetadata = z.infer<typeof RawEventMetadataSchema>;
export type RawSpeaker = z.infer<typeof RawSpeakerSchema>;
export type RawCategory = z.infer<typeof RawCategorySchema>;

// Source schema currently used by codeandcomedy-talks.json
export const SourceLocationSchema = z
  .object({
    name: z.string().min(1),
    city: z.string().optional(),
    country: z.string().optional(),
  })
  .strict();

export const SourceEventSchema = z
  .object({
    name: z.string().min(1),
    theme: z.string().optional(),
    date: z.string().min(1),
    location: SourceLocationSchema.optional(),
  })
  .strict();

export const SourceTalkSchema = z
  .object({
    title: z.string().min(1),
    speakers: z.array(RawSpeakerSchema).default([]),
    categories: z.array(z.string().min(1)).default([]),
    abstract: z.string().optional(),
    language: z.string().optional(),
  })
  .strict();

export const SourceScheduleItemSchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    title: z.string().min(1),
    type: z.string().min(1),
    speakers: z.array(RawSpeakerSchema).default([]),
    categories: z.array(z.string().min(1)).default([]),
    abstract: z.string().optional(),
    language: z.string().optional(),
    sessions: z.array(SourceTalkSchema).optional(),
  })
  .strict();

export const SourceEventDataSchema = z
  .object({
    source: z.string().optional(),
    generatedAt: z.string().optional(),
    event: SourceEventSchema,
    schedule: z.array(SourceScheduleItemSchema),
    notes: z.array(z.string()).optional(),
  })
  .strict();

type SourceEventData = z.infer<typeof SourceEventDataSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function mapSourceTypeToSessionType(type: string): string {
  switch (type) {
    case 'keynote':
      return 'keynote';
    case 'comedy':
      return 'panel';
    case 'breakout-group':
      return 'breakout';
    default:
      return 'workshop';
  }
}

function mapCategoryStringsToRawCategories(categories: ReadonlyArray<string>): RawCategory[] {
  return categories.map((category) => ({
    id: slugify(category),
    name: category,
  }));
}

function mapSourceToRawEventData(sourceData: SourceEventData): RawEventData {
  const sessions = sourceData.schedule.map((item, index) => {
    const id = `${slugify(item.title)}-${index + 1}`;

    return {
      id,
      title: item.title,
      speakers: item.speakers,
      categories: mapCategoryStringsToRawCategories(item.categories),
      abstract: item.abstract,
      language: item.language ?? 'English',
      sessionType: mapSourceTypeToSessionType(item.type),
      startTime: item.startTime,
      endTime: item.endTime,
      breakouts: (item.sessions ?? []).map((session) => ({
        title: session.title,
        speakers: session.speakers,
        categories: mapCategoryStringsToRawCategories(session.categories),
        abstract: session.abstract,
        startTime: item.startTime,
        endTime: item.endTime,
      })),
    };
  });

  const locationParts = [
    sourceData.event.location?.name,
    sourceData.event.location?.city,
    sourceData.event.location?.country,
  ].filter(Boolean);

  return {
    eventMetadata: {
      eventName: sourceData.event.name,
      eventDate: sourceData.event.date,
      location: locationParts.length > 0 ? locationParts.join(', ') : undefined,
      description: sourceData.event.theme,
    },
    sessions,
  };
}

/**
 * Parse and validate raw JSON data
 * Throws ZodError on validation failure (fail-fast behavior)
 */
export function parseRawEventData(data: unknown): RawEventData {
  const canonical = RawEventDataSchema.safeParse(data);
  if (canonical.success) {
    return canonical.data;
  }

  const sourceData = SourceEventDataSchema.parse(data);
  return mapSourceToRawEventData(sourceData);
}
