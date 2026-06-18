# Implementation Plan: Code and Comedy MCP Schedule Server

**Branch**: `001-prep-spec-generation` | **Date**: 2026-06-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-mcp-event-server/spec.md`

## Summary

Build a stateless MCP server over the local Code and Comedy JSON dataset, using one tool
per capability for event metadata, schedule exploration, search, speaker/category listing,
recommendations, and session detail lookup. Implementation uses TypeScript + Node.js 22,
official MCP TypeScript SDK over stdio transport, and Zod for startup data validation,
request validation, and strongly shaped tool responses.

## Technical Context

**Language/Version**: TypeScript on Node.js 22+  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `zod`  
**Storage**: Local JSON file (`codeandcomedy-talks.json`) loaded read-only at startup  
**Testing**: Vitest (unit + integration-style tool contract tests)  
**Target Platform**: Local Node.js runtime via stdio transport (AI coding agent demos)
**Project Type**: Stateless MCP server (CLI process)  
**Performance Goals**: Tool responses complete under 150ms p95 on local demo hardware; server startup under 1s for single-file dataset  
**Constraints**: No external service calls; no writes to source data; no auth in local stdio mode; safe error messages only; deterministic output ordering  
**Scale/Scope**: Single event dataset, <500 schedule/session records, conference-demo interaction volume

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Phase 0 gate:
- [x] Tool-first design is preserved: each capability maps to a single-purpose MCP tool.
- [x] Read-only boundary is explicit: no mutation path is introduced.
- [x] Trust boundary controls are defined: JSON validation, data-only handling, no execution.
- [x] Agent-safe response strategy is defined: compact, factual, structured output shapes.
- [x] Security/observability controls are defined: least privilege, structured logs, safe errors.
- [x] Quality bar is enforceable: tests include happy path, empty, invalid input, malformed JSON.
- [x] Separation of concerns is preserved: spec describes behavior, plan describes implementation.

Post-Phase 1 re-check:
- [x] Data model and contracts preserve read-only semantics and tool boundaries.
- [x] Research, model, quickstart, and contracts include trust-boundary and malformed-data handling.
- [x] No framework/hosting leakage was introduced into functional spec artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/001-mcp-event-server/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mcp-tools.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── index.ts
├── data/
│   └── loadEventData.ts
├── domain/
│   ├── eventModel.ts
│   └── scheduleQueries.ts
└── tools/
   ├── getEventInfo.ts
   ├── listSchedule.ts
   ├── getCurrentOrNextItem.ts
   ├── searchSessions.ts
   ├── listSpeakers.ts
   ├── listCategories.ts
   ├── recommendSessions.ts
   └── getSessionDetails.ts

tests/
├── contract/
│   └── tools.contract.test.ts
├── integration/
│   └── schedule.behavior.test.ts
└── unit/
   ├── loadEventData.test.ts
   └── scheduleQueries.test.ts

docs/
└── mcp-config.example.json
```

**Structure Decision**: Single-project Node/TypeScript MCP server structure selected to keep
demo setup and maintenance simple while enforcing module-level separation between loading,
normalization/query logic, and tool handlers.

## Complexity Tracking

No constitutional violations identified; complexity exceptions are not required.
