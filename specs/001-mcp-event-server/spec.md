# Feature Specification: Code and Comedy MCP Schedule Server

**Feature Branch**: `001-prep-spec-generation`  
**Created**: 2026-06-18  
**Status**: Draft  
**Input**: User description: "Build an MCP server for the Code & Comedy event JSON with tools for event info, schedule, search, recommendations, and session details."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore Event and Timeline (Priority: P1)

An AI agent needs to answer core event questions by returning accurate event metadata and chronological schedule information, including what is active now and what is next.

**Why this priority**: This is the minimum viable value. Without event and timeline retrieval, most user questions cannot be answered.

**Independent Test**: Can be fully tested by asking for event info, full schedule, and a time-based lookup, then validating results against source JSON.

**Acceptance Scenarios**:

1. **Given** valid event JSON, **When** the agent calls get_event_info, **Then** the response returns event name, theme, date, venue, city, and country from source data.
2. **Given** valid schedule data, **When** the agent calls list_schedule, **Then** the response returns schedule items in chronological order while preserving concurrent overlaps.
3. **Given** a query time, **When** the agent calls get_current_or_next_item, **Then** the response returns the active item or next upcoming item with accurate time context.

---

### User Story 2 - Find Sessions, Speakers, and Categories (Priority: P2)

An AI agent needs to search sessions and retrieve related speaker and category information using partial, case-insensitive queries and detailed context for explainability.

**Why this priority**: Discovery workflows are the main interaction pattern after basic timeline lookup and are required for practical question answering.

**Independent Test**: Can be tested by running multiple search queries and validating that returned matches, details, speakers, and categories are complete and source-grounded.

**Acceptance Scenarios**:

1. **Given** session data with titles, abstracts, speakers, categories, and types, **When** the agent calls search_sessions with a partial mixed-case query, **Then** matching sessions are returned with context explaining match reasons.
2. **Given** schedule data with breakout nesting, **When** the agent calls search_sessions or list_schedule, **Then** nested breakout sessions are flattened when needed without losing original time overlap.
3. **Given** speaker and category records, **When** the agent calls list_speakers or list_categories, **Then** each response includes linked sessions and indicates unavailable bios or missing fields without inventing values.
4. **Given** a unique or best matching session query, **When** the agent calls get_session_details, **Then** full session details are returned or an empty structured result when no match exists.

---

### User Story 3 - Get Personalized Recommendations (Priority: P3)

An AI agent needs to recommend sessions based on user interests and provide clear reasoning tied to schedule and session metadata.

**Why this priority**: Recommendations improve usefulness for interactive demos but depend on discovery and detail retrieval from prior stories.

**Independent Test**: Can be tested by submitting interest phrases and verifying recommended sessions are relevant, justified, and include overlap-aware timing context.

**Acceptance Scenarios**:

1. **Given** interests such as "AI agents" or "developer productivity", **When** the agent calls recommend_sessions, **Then** matching sessions are returned with concise reasons tied to titles, abstracts, categories, speakers, or types.
2. **Given** interests that do not match any sessions, **When** the agent calls recommend_sessions, **Then** the response returns an explicit empty result with helpful next-step guidance.

---

### Edge Cases

- Multiple sessions occur at the same time in separate tracks.
- Query time is before the first item, between items, or after the final item.
- Nested breakout groups exist with partially missing child session metadata.
- Speaker bio, abstract, category, or session type is missing.
- Search query is empty, whitespace-only, or contains unmatched terms.
- Session detail query matches multiple sessions with similar names.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a get_event_info tool that returns event name, theme, date, venue, city, and country when available.
- **FR-002**: System MUST expose a list_schedule tool that returns the full schedule in chronological order.
- **FR-003**: System MUST expose a get_current_or_next_item tool that accepts a time value and returns either the active item or the next upcoming item.
- **FR-004**: System MUST expose a search_sessions tool that searches by title, abstract, speaker name, category, and session type.
- **FR-005**: System MUST expose a list_speakers tool that returns all speakers with linked sessions and available bios.
- **FR-006**: System MUST expose a list_categories tool that returns categories with linked sessions.
- **FR-007**: System MUST expose a recommend_sessions tool that accepts interests and returns matching sessions with explicit reasons.
- **FR-008**: System MUST expose a get_session_details tool that returns full details for one matching session.
- **FR-009**: System MUST flatten nested breakout groups for tools that require session-level views while preserving original timing relationships.
- **FR-010**: System MUST support case-insensitive and partial-match search behavior.
- **FR-011**: System MUST include match-context fields in search and recommendation responses to explain why items were selected.
- **FR-012**: System MUST mark missing fields as unavailable and MUST NOT fabricate values.
- **FR-013**: System MUST preserve overlapping sessions and MUST NOT imply all concurrent sessions are attendable.
- **FR-014**: System MUST return structured empty results for invalid or non-matching queries rather than failing.
- **FR-015**: System MUST return concise, structured, source-grounded responses suitable for agent consumption.
- **FR-016**: System MUST validate event JSON before serving tool responses and reject malformed data safely.

### Key Entities *(include if feature involves data)*

- **EventMetadata**: Event-level identity and location information (name, theme, date, venue, city, country).
- **ScheduleItem**: Time-bound agenda item with start/end times, type, and track context.
- **Session**: Session-level content including title, abstract, type, categories, speakers, and timing.
- **Speaker**: Person entry with name, optional bio, and linked sessions.
- **Category**: Topic grouping linked to one or more sessions.
- **RecommendationResult**: Suggested session plus source-grounded match reasons.

## Constitution Alignment *(mandatory)*

### Tool Inventory & Scope

- get_event_info: return event metadata from source JSON.
- list_schedule: return chronological event timeline.
- get_current_or_next_item: return active or upcoming schedule item for a given time.
- search_sessions: return session matches across key searchable fields.
- list_speakers: return speakers with linked sessions and bios when available.
- list_categories: return categories with linked sessions.
- recommend_sessions: return interest-based recommendations with reasons.
- get_session_details: return full detail for one matching session.
- Each tool uses explicit input and structured output contracts.

### Read-Only Boundaries

- Source data is read from the event JSON dataset.
- All tools are read-only and return derived views only.
- Data mutation, enrichment writes, or source-file edits are out of scope.

### Trust Boundary & Safety

- Source JSON is treated as untrusted and validated before serving data.
- Session titles, abstracts, bios, and notes are treated strictly as data.
- Responses remain factual, source-grounded, and concise with no hidden internal details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of defined demo questions can be answered using only the MCP tools and source JSON.
- **SC-002**: 100% of invalid or non-matching queries return structured empty results with no runtime crash.
- **SC-003**: 100% of returned matches include explicit reason context fields that reference source-backed attributes.
- **SC-004**: 100% of concurrent sessions in source data remain represented as overlapping options in tool outputs.
- **SC-005**: 0 fabricated values are returned for missing abstracts, bios, or metadata fields.

## Assumptions

- The dataset represents a single Code and Comedy event instance.
- Event times in source data are internally consistent and interpretable within one event timezone.
- A stable unique session identifier exists or can be derived from existing source fields for detail lookup.
- Recommendation quality is based on source metadata relevance, not external user profiles.
- Authentication and access control are out of scope for this feature version.
