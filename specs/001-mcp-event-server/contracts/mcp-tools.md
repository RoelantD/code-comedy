# MCP Tool Contracts - Code and Comedy

This document defines the external tool interface contract exposed by the MCP server.
All responses are structured JSON objects and remain read-only.

## Shared contract rules
- Input validation errors return:
  - `ok: false`
  - `error.code: "INVALID_INPUT"`
  - `error.message: string`
- Data availability issues return:
  - `ok: false`
  - `error.code: "DATA_UNAVAILABLE"`
- No-match queries return:
  - `ok: true`
  - empty arrays or `null` detail fields
  - optional `message` guidance
- Tool success returns:
  - `ok: true`
  - typed payload fields specific to tool

## get_event_info
- Input: `{}`
- Output:
  - `ok: true`
  - `event: { name, theme, date, venue, city, country, source?, generatedAt? }`

## list_schedule
- Input:
  - `includeFlattenedSessions?: boolean` (default `false`)
- Output:
  - `ok: true`
  - `schedule: Array<{ itemId, title, type, startTime, endTime, isBreakoutGroup, sessions? }>`
  - Overlaps are preserved by independent items sharing time windows.

## get_current_or_next_item
- Input:
  - `time: string` (`HH:mm`)
- Output:
  - `ok: true`
  - `current: ScheduleItem | null`
  - `next: ScheduleItem | null`
  - `timeContext: { queryTime, status }` where `status in ["before", "during", "between", "after"]`

## search_sessions
- Input:
  - `query: string`
  - `limit?: number` (default `10`, max `50`)
- Output:
  - `ok: true`
  - `matches: Array<{ session, matchReasons: string[], matchedFields: string[] }>`

## list_speakers
- Input:
  - `query?: string`
- Output:
  - `ok: true`
  - `speakers: Array<{ speakerId, name, bio, sessions: SessionSummary[] }>`

## list_categories
- Input:
  - `query?: string`
- Output:
  - `ok: true`
  - `categories: Array<{ categoryId, label, sessions: SessionSummary[] }>`

## recommend_sessions
- Input:
  - `interests: string[]`
  - `limit?: number` (default `5`, max `20`)
- Output:
  - `ok: true`
  - `recommendations: Array<{ session, score, matchReasons: string[] }>`

## get_session_details
- Input:
  - `query: string`
- Output:
  - `ok: true`
  - `session: SessionDetail | null`
  - `alternatives?: SessionSummary[]` when multiple close matches exist

## Reusable shapes
- `SessionSummary`: `{ sessionId, title, startTime, endTime, type, speakerNames, categories }`
- `SessionDetail`: `SessionSummary + { abstract, language, breakoutGroupTitle, overlapWindow }`
- All missing optional textual fields are returned as `null` and may include `unavailableFields: string[]`.
