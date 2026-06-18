# Phase 0 Research - Code and Comedy MCP Schedule Server

## Decision 1: Runtime and SDK choice
- Decision: Use Node.js 22+ with TypeScript and the official MCP TypeScript SDK over stdio transport.
- Rationale: Matches requested implementation, aligns with demo-first usage from AI coding agents, and keeps tool wiring idiomatic for MCP.
- Alternatives considered: Python MCP SDK (rejected due to requested TypeScript stack), HTTP transport in v1 (rejected due to extra operational complexity not needed for demo).

## Decision 2: Data loading and validation strategy
- Decision: Load `codeandcomedy-talks.json` once at startup, validate with Zod schemas, and fail fast on malformed JSON.
- Rationale: Satisfies trust-boundary and malformed-data requirements while preserving deterministic behavior.
- Alternatives considered: Lazy validation per request (rejected for repeated overhead and inconsistent runtime failure timing), permissive parsing with warnings (rejected by quality and safety constraints).

## Decision 3: Internal normalization model
- Decision: Normalize top-level schedule entries, breakout groups, nested sessions, speakers, categories, and derived time ranges into a single in-memory event model.
- Rationale: Enables consistent query behavior across all tools, including flattening and overlap-preserving outputs.
- Alternatives considered: Query raw nested JSON directly in each tool (rejected due to duplicated logic and higher bug risk), denormalized one-tool-per-view caches (rejected due to unnecessary complexity for current scale).

## Decision 4: Search and matching behavior
- Decision: Implement case-insensitive partial matching using normalized lowercase tokens across title, abstract, speaker, category, and session type fields.
- Rationale: Directly matches functional requirements and demo question patterns.
- Alternatives considered: Exact-match only (rejected as too brittle), embedding/vector search (rejected as out of scope and adds external dependencies).

## Decision 5: Recommendation approach
- Decision: Use transparent keyword/category/session-type relevance scoring and return explicit `matchReasons` per recommendation.
- Rationale: Keeps recommendations explainable and source-grounded without speculative behavior.
- Alternatives considered: LLM-generated recommendations (rejected due to non-determinism and external-service constraint), opaque weighted scoring without reasons (rejected due to explainability requirement).

## Decision 6: Security and error handling
- Decision: Treat all textual JSON fields as untrusted data, never execute content, sanitize/serialize output values, and return safe structured error envelopes without stack traces.
- Rationale: Complies with constitution trust boundary and agent-safe response principles.
- Alternatives considered: Raw exception passthrough (rejected due to leakage risk), rich debug output in tool responses (rejected for demo safety and principle compliance).

## Decision 7: Testing strategy
- Decision: Use Vitest for unit and contract-oriented tool tests covering happy path, empty results, invalid inputs, malformed JSON, missing fields, and overlapping sessions.
- Rationale: Meets constitution quality bar and maps to required edge cases.
- Alternatives considered: Manual-only verification (rejected by quality bar), end-to-end tests only (rejected due to weak isolation and slower feedback).

## Decision 8: Stateless execution model
- Decision: Keep server process stateless after startup load; each tool call reads immutable in-memory model and produces deterministic output.
- Rationale: Simplifies reasoning, supports demo reliability, and preserves read-only constraints.
- Alternatives considered: Mutable in-memory updates during runtime (rejected due to read-only principle and debugging complexity).

## Clarifications resolved
- No unresolved `NEEDS CLARIFICATION` items remain for this feature.
