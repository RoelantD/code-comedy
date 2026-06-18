# Quickstart - Code and Comedy MCP Schedule Server

## Prerequisites
- Node.js 22+
- npm 10+

## 1. Install dependencies
```powershell
npm install
```

## 2. Build
```powershell
npm run build
```

## 3. Run tests
```powershell
npm test
```

## 4. Start in stdio mode
```powershell
npm run start
```

## 5. Development mode
```powershell
npm run dev
```

## Expected npm scripts
- `dev`: run server with ts-node/tsx in watch mode
- `build`: compile TypeScript
- `test`: run Vitest suite
- `start`: run compiled stdio MCP server

## Data setup
- Ensure `codeandcomedy-talks.json` exists at the configured local path.
- Server validates data at startup and exits with a safe error if malformed.

## Demo verification prompts
- "What is this event about?"
- "What sessions are about AI agents?"
- "Who is speaking after dinner?"
- "What can I attend at 19:45?"
- "Which sessions match developer productivity?"
- "Give me a recommendation if I care about MCP and agents."

## Notes
- This implementation is read-only and stateless by design.
- HTTP transport is intentionally out of scope for this demo; document-only future option.
