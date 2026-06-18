# Tasks: Code and Comedy MCP Schedule Server

**Input**: Design documents from `/specs/001-mcp-event-server/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED for each tool and include happy path, empty results, invalid input, and malformed JSON handling.

**Organization**: Tasks are grouped by user story to support independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (`US1`, `US2`, `US3`)
- All tasks include explicit file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize TypeScript MCP server project and developer tooling.

- [ ] T001 Initialize Node.js project metadata and scripts in package.json
- [ ] T002 Add TypeScript compiler configuration in tsconfig.json
- [ ] T003 [P] Add Vitest configuration in vitest.config.ts
- [ ] T004 [P] Add ignore and editor defaults in .gitignore
- [ ] T005 [P] Create source and test folder skeleton with barrel exports in src/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared data loading, normalization, validation, query primitives, and error envelope patterns required by all stories.

**CRITICAL**: User story work starts only after this phase is complete.

- [ ] T006 Define raw JSON Zod schemas and parsing helpers in src/data/schemas.ts
- [ ] T007 Implement validated read-only startup data loader in src/data/loadEventData.ts
- [ ] T008 Define normalized entity types and response shapes in src/domain/eventModel.ts
- [ ] T009 Implement JSON-to-model normalization including breakout flattening in src/domain/normalizeEventData.ts
- [ ] T010 Implement shared schedule and entity query primitives in src/domain/scheduleQueries.ts
- [ ] T011 Implement shared tool response/error envelope helpers in src/tools/common.ts
- [ ] T012 Wire MCP server bootstrap, immutable model load, and stateless transport in src/index.ts
- [ ] T013 [P] Add malformed and edge-case fixture dataset for tests in tests/fixtures/malformed-event.json
- [ ] T014 [P] Add loader validation unit tests (happy, invalid, malformed JSON) in tests/unit/loadEventData.test.ts
- [ ] T015 [P] Add normalization/query unit tests (overlaps, flattening, missing fields) in tests/unit/scheduleQueries.test.ts

**Checkpoint**: Foundation ready, user story implementation can begin.

---

## Phase 3: User Story 1 - Explore Event and Timeline (Priority: P1) MVP

**Goal**: Support event metadata retrieval, full schedule listing, and active/next item lookup.

**Independent Test**: Ask for event info, full schedule, and time-based status; verify responses against source JSON and overlap preservation.

### Tests for User Story 1

- [ ] T016 [P] [US1] Add contract tests for get_event_info happy and empty scenarios in tests/contract/us1-timeline.contract.test.ts
- [ ] T017 [P] [US1] Add integration tests for overlapping schedules and time-context transitions in tests/integration/us1-timeline.behavior.test.ts
- [ ] T041 [P] [US1] Add invalid-input and malformed-data tests for get_event_info in tests/contract/us1-get-event-info.invalid-malformed.test.ts
- [ ] T042 [P] [US1] Add invalid-input and malformed-data tests for list_schedule in tests/contract/us1-list-schedule.invalid-malformed.test.ts
- [ ] T043 [P] [US1] Add invalid-input and malformed-data tests for get_current_or_next_item in tests/contract/us1-current-next.invalid-malformed.test.ts

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement get_event_info tool handler and schema in src/tools/getEventInfo.ts
- [ ] T019 [P] [US1] Implement list_schedule tool handler and schema in src/tools/listSchedule.ts
- [ ] T020 [P] [US1] Implement get_current_or_next_item tool handler and schema in src/tools/getCurrentOrNextItem.ts
- [ ] T021 [US1] Register US1 tools and handlers in MCP server setup in src/index.ts
- [ ] T022 [US1] Add unavailable-field and safe error mapping for US1 outputs in src/tools/common.ts

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Find Sessions, Speakers, and Categories (Priority: P2)

**Goal**: Provide robust discovery across sessions, speakers, and categories with explainable match context.

**Independent Test**: Run mixed-case partial queries and verify flattened breakout sessions, linked speakers/categories, and source-grounded match reasons.

### Tests for User Story 2

- [ ] T023 [P] [US2] Add contract tests for search_sessions, list_speakers, list_categories, and get_session_details happy and empty scenarios in tests/contract/us2-discovery.contract.test.ts
- [ ] T024 [P] [US2] Add integration tests for partial matching, nested breakout flattening, and missing bio/abstract handling in tests/integration/us2-discovery.behavior.test.ts
- [ ] T044 [P] [US2] Add invalid-input and malformed-data tests for search_sessions in tests/contract/us2-search-sessions.invalid-malformed.test.ts
- [ ] T045 [P] [US2] Add invalid-input and malformed-data tests for list_speakers in tests/contract/us2-list-speakers.invalid-malformed.test.ts
- [ ] T046 [P] [US2] Add invalid-input and malformed-data tests for list_categories in tests/contract/us2-list-categories.invalid-malformed.test.ts
- [ ] T047 [P] [US2] Add invalid-input and malformed-data tests for get_session_details in tests/contract/us2-session-details.invalid-malformed.test.ts

### Implementation for User Story 2

- [ ] T025 [P] [US2] Implement search_sessions tool handler with matchedFields and matchReasons in src/tools/searchSessions.ts
- [ ] T026 [P] [US2] Implement list_speakers tool handler with linked sessions in src/tools/listSpeakers.ts
- [ ] T027 [P] [US2] Implement list_categories tool handler with linked sessions in src/tools/listCategories.ts
- [ ] T028 [P] [US2] Implement get_session_details tool handler with alternatives for ambiguous matches in src/tools/getSessionDetails.ts
- [ ] T029 [US2] Extend query primitives for tokenized case-insensitive partial search in src/domain/scheduleQueries.ts
- [ ] T030 [US2] Register US2 tools and handlers in MCP server setup in src/index.ts

**Checkpoint**: US1 and US2 are both independently functional and testable.

---

## Phase 5: User Story 3 - Get Personalized Recommendations (Priority: P3)

**Goal**: Return explainable session recommendations from interest terms while preserving read-only deterministic behavior.

**Independent Test**: Submit interest phrases and verify ranked recommendations include explicit reasons and stable empty results when nothing matches.

### Tests for User Story 3

- [ ] T031 [P] [US3] Add contract tests for recommend_sessions happy and empty scenarios in tests/contract/us3-recommendations.contract.test.ts
- [ ] T032 [P] [US3] Add integration tests for ranking, empty interests, and no-match scenarios in tests/integration/us3-recommendations.behavior.test.ts
- [ ] T048 [P] [US3] Add invalid-input and malformed-data tests for recommend_sessions in tests/contract/us3-recommendations.invalid-malformed.test.ts

### Implementation for User Story 3

- [ ] T033 [P] [US3] Implement recommendation scoring and reason extraction query module in src/domain/recommendationQueries.ts
- [ ] T034 [US3] Implement recommend_sessions tool handler and schema in src/tools/recommendSessions.ts
- [ ] T035 [US3] Register US3 tool and handler in MCP server setup in src/index.ts

**Checkpoint**: All user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize demo readiness, documentation, and quality gates across all stories.

- [ ] T036 [P] Add README setup, usage, and sample prompts in README.md
- [ ] T037 [P] Add sample MCP client configuration for stdio demo in docs/mcp-config.example.json
- [ ] T038 Align npm scripts for dev/build/test/start and lint commands in package.json
- [ ] T039 [P] Add final contract regression suite covering all tools in tests/contract/tools.contract.test.ts
- [ ] T040 Validate quickstart flow and record expected outcomes in specs/001-mcp-event-server/quickstart-validation.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies
- Foundational (Phase 2): depends on Setup and blocks all user stories
- User Story phases (3-5): depend on Foundational completion
- Polish (Phase 6): depends on completion of all required user stories

### User Story Dependencies

- US1 (P1): starts after Foundational, no dependency on other stories
- US2 (P2): starts after Foundational, can run in parallel with US1 but integrates with shared query module
- US3 (P3): starts after Foundational, remains independently testable, and reuses shared primitives created in Phase 2

### Within Each User Story

- Tests before implementation
- Tool handlers after query/model prerequisites
- Tool registration after handler implementation
- Story checkpoint validation before moving forward

---

## Parallel Execution Examples

### User Story 1

```bash
Task: "T016 [US1] contract tests in tests/contract/us1-timeline.contract.test.ts"
Task: "T017 [US1] integration tests in tests/integration/us1-timeline.behavior.test.ts"
Task: "T018 [US1] getEventInfo tool in src/tools/getEventInfo.ts"
Task: "T019 [US1] listSchedule tool in src/tools/listSchedule.ts"
Task: "T020 [US1] getCurrentOrNextItem tool in src/tools/getCurrentOrNextItem.ts"
```

### User Story 2

```bash
Task: "T025 [US2] searchSessions tool in src/tools/searchSessions.ts"
Task: "T026 [US2] listSpeakers tool in src/tools/listSpeakers.ts"
Task: "T027 [US2] listCategories tool in src/tools/listCategories.ts"
Task: "T028 [US2] getSessionDetails tool in src/tools/getSessionDetails.ts"
```

### User Story 3

```bash
Task: "T031 [US3] contract tests in tests/contract/us3-recommendations.contract.test.ts"
Task: "T032 [US3] integration tests in tests/integration/us3-recommendations.behavior.test.ts"
Task: "T033 [US3] recommendation queries in src/domain/recommendationQueries.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2
2. Deliver Phase 3 (US1)
3. Validate US1 independently against demo prompts and source JSON
4. Demo/deploy MVP

### Incremental Delivery

1. Foundation complete
2. Add US1 and validate
3. Add US2 and validate
4. Add US3 and validate
5. Final polish and full regression

### Parallel Team Strategy

1. One engineer finalizes foundational loader/query work
2. One engineer builds US1 timeline tools
3. One engineer builds US2 discovery tools after foundational checkpoint
4. One engineer implements US3 recommendations once search/query primitives are stable

---

## Notes

- All tasks use strict checklist format with task ID and explicit file path.
- Test coverage is mandatory per constitution quality bar.
- Keep outputs concise, structured, read-only, and source-grounded.
