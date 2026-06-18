# Phase 1 Data Model - Code and Comedy MCP Schedule Server

## Entities

### EventMetadata
- Fields:
  - `name: string`
  - `theme: string | null`
  - `date: string` (ISO date)
  - `venueName: string | null`
  - `city: string | null`
  - `country: string | null`
  - `source: string | null`
  - `generatedAt: string | null`
- Validation rules:
  - `name` required, non-empty
  - `date` required, must parse as date

### Speaker
- Fields:
  - `speakerId: string` (derived stable slug)
  - `name: string`
  - `bio: string | null`
  - `sessionIds: string[]`
- Validation rules:
  - `name` required, non-empty
  - `sessionIds` unique list

### Category
- Fields:
  - `categoryId: string` (normalized token)
  - `label: string`
  - `sessionIds: string[]`
- Validation rules:
  - `label` required, non-empty
  - `sessionIds` unique list

### Session
- Fields:
  - `sessionId: string` (derived stable slug/hash)
  - `title: string`
  - `abstract: string | null`
  - `type: string | null`
  - `categories: string[]`
  - `speakerIds: string[]`
  - `speakerNames: string[]`
  - `startTime: string` (`HH:mm`)
  - `endTime: string` (`HH:mm`)
  - `language: string | null`
  - `parentBreakoutGroupTitle: string | null`
  - `trackKey: string | null`
- Validation rules:
  - `title`, `startTime`, `endTime` required
  - `startTime < endTime` within event day
  - missing `abstract` and `type` must be represented as `null` (not fabricated)

### ScheduleItem
- Fields:
  - `itemId: string`
  - `title: string`
  - `type: string`
  - `startTime: string` (`HH:mm`)
  - `endTime: string` (`HH:mm`)
  - `speakerIds: string[]`
  - `sessionIds: string[]`
  - `isBreakoutGroup: boolean`
- Validation rules:
  - `title`, `type`, `startTime`, `endTime` required
  - if `isBreakoutGroup=true`, `sessionIds` may contain nested sessions

### RecommendationResult
- Fields:
  - `sessionId: string`
  - `score: number`
  - `matchReasons: string[]`
  - `matchedInterestTerms: string[]`
- Validation rules:
  - `matchReasons` must be non-empty for non-empty recommendations
  - recommendations sorted by `score` descending

## Relationships
- `EventMetadata` 1..* `ScheduleItem`
- `ScheduleItem` 0..* `Session`
- `Session` *..* `Speaker`
- `Session` *..* `Category`
- `RecommendationResult` 1..1 `Session`

## Derived Views for Tools
- `flattenedSessions`: all sessions, including nested breakout sessions, preserving original time windows.
- `chronologicalSchedule`: top-level schedule items sorted by start/end with overlap retained.
- `speakerIndex`: speakerId -> speaker + linked sessions.
- `categoryIndex`: categoryId -> category + linked sessions.

## State and Lifecycle
- Startup states:
  1. `Uninitialized`
  2. `LoadingData`
  3. `ValidatedAndNormalized`
  4. `Ready`
  5. `Failed` (malformed JSON or schema violations)
- Runtime behavior:
  - No mutation transitions after `Ready`.
  - Tool calls read immutable normalized model and return structured outputs.
