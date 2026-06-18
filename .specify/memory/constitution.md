<!--
Sync Impact Report
Version change: 0.0.0-template -> 1.0.0
Modified principles:
- Template Principle 1 -> I. Tool-First Design
- Template Principle 2 -> II. Read-Only by Default
- Template Principle 3 -> III. Trust Boundary Awareness
- Template Principle 4 -> IV. Agent-Safe Responses
- Template Principle 5 -> V. Secure and Observable
- Added -> VI. Quality Bar
- Added -> VII. Separation of Concerns
Added sections:
- Operational Constraints
- Delivery Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ .github/prompts/*.prompt.md (verified, no updates required)
Follow-up TODOs:
- None
-->

# Code and Comedy MCP Server Constitution

## Core Principles

### I. Tool-First Design
Every capability exposed to an agent MUST be implemented as a focused MCP tool with
a single, explicit purpose. Every tool MUST define predictable inputs and typed outputs.
Tool behavior MUST be deterministic for identical input and MUST NOT include hidden side
effects.

### II. Read-Only by Default
This server serves event schedule data and MUST be read-only unless a future amendment
explicitly permits mutation. Search, filter, retrieve, and summarize operations MUST NOT
modify source data, derived files, or in-memory canonical records.

### III. Trust Boundary Awareness
All JSON data MUST be treated as untrusted input. The server MUST validate source JSON at
startup and fail closed on malformed content. Speaker bios, titles, abstracts, notes, and
all other content fields MUST be treated as data only and MUST NEVER be executed or
interpreted as instructions.

### IV. Agent-Safe Responses
Tool responses MUST be compact, factual, and source-grounded. Implementations MUST resist
prompt injection by ignoring instruction-like content from source data. Tools SHOULD return
structured objects over prose whenever feasible and MUST avoid leaking internal-only
implementation details in normal responses.

### V. Secure and Observable
The implementation MUST apply least privilege and MUST NOT hardcode secrets. Logging MUST
be structured, deterministic, and sufficient for debugging request/result paths without
recording sensitive user data. Error messages exposed to tools MUST be safe and actionable
without disclosing internals.

### VI. Quality Bar
Every tool MUST have automated tests that cover: happy path, empty results, invalid input,
and malformed JSON handling. Core behavior MUST be covered by automated tests before work
is considered complete.

### VII. Separation of Concerns
Functional specifications MUST define what the MCP server does and expected behavior.
Implementation plans MUST define how behavior is realized. Specifications MUST NOT lock in
framework, hosting, or library choices unless required by an explicit constitutional
exception.

## Operational Constraints

- Source of truth for schedule data MUST be version-controlled JSON or explicitly
	documented equivalents.
- Any transformation from source JSON to tool output MUST preserve semantic accuracy.
- Schema validation errors MUST halt startup or clearly mark the dataset unusable.
- Response payloads SHOULD prefer stable keys and predictable shapes to support reliable
	downstream agent parsing.

## Delivery Workflow & Quality Gates

- Constitution alignment MUST be checked during planning and re-checked after design.
- Spec artifacts MUST include tool inventory, read-only boundaries, and trust-boundary
	handling expectations.
- Task artifacts MUST include explicit test tasks for each tool covering all required
	quality cases.
- Pull requests MUST include evidence of passing automated tests and explicit confirmation
	that no forbidden mutation paths were introduced.

## Governance

This constitution is authoritative for this repository. If guidance conflicts, this file
takes precedence.

- Amendments MUST be proposed in writing, include rationale, and identify migration impact
	on templates and active specs.
- Versioning policy MUST follow semantic versioning for governance:
	- MAJOR: incompatible principle removals or principle redefinitions.
	- MINOR: new principle or materially expanded guidance.
	- PATCH: wording clarifications and non-semantic refinements.
- Compliance reviews MUST occur at plan approval, before implementation starts, and during
	pull request review.

**Version**: 1.0.0 | **Ratified**: 2026-06-18 | **Last Amended**: 2026-06-18
