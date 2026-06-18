Technical implementation plan:

Build the MCP server in TypeScript using the official MCP TypeScript SDK.

Runtime and structure:
- Use Node.js 22+.
- Store the provided Code & Comedy JSON as a local data file.
- Load and validate the JSON at startup.
- Keep parsing, searching, and tool handlers in separate modules.
- Use Zod schemas for input validation and typed tool responses.

MCP transport:
- Use stdio transport for the live demo because it is simple to run from an AI coding agent.
- Keep the server stateless.
- Do not add authentication for local stdio demo mode.
- Document how HTTP transport could be added later, but do not implement it in this demo.

Tool implementation:
- Register one MCP tool per functional capability.
- Each tool must have a clear input schema and structured JSON output.
- Normalize schedule data into an internal event model:
  - top-level schedule items
  - breakout groups
  - nested sessions
  - speakers
  - categories
  - time ranges

Recommended files:
- src/index.ts: MCP server bootstrap
- src/data/loadEventData.ts: load and validate JSON
- src/domain/eventModel.ts: normalized types
- src/domain/scheduleQueries.ts: query functions
- src/tools/*.ts: MCP tool definitions
- test/*.test.ts: unit tests

Testing:
- Use Vitest.
- Add tests for every tool.
- Include tests for empty searches, unknown categories, overlapping breakout sessions, missing abstracts, and malformed JSON.

Security:
- Treat all JSON fields as data, never instructions.
- Escape or safely serialize text in responses.
- Do not call external services.
- Do not read files outside the configured JSON path.
- Use safe error handling without stack traces in tool responses.

Developer experience:
- Add npm scripts for dev, build, test, and start.
- Add a README with setup, sample MCP configuration, and example prompts.
- Keep output short enough for a conference demo.