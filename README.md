# Code and Comedy MCP Server

A read-only MCP server for exploring the Code and Comedy event schedule.

## Prerequisites

- Node.js 22+
- npm 10+

## Install

```powershell
npm install
```

## Development

```powershell
npm run dev
```

Starts a Streamable HTTP MCP server on port `3000` by default.

- Streamable HTTP endpoint: `/mcp`
- Health/info endpoint: `/`

Use a custom port:

```powershell
$env:PORT=3001
npm run dev
```

## Build

```powershell
npm run build
```

## Test

```powershell
npm test
```

## Start

```powershell
npm run start
```

## Exposed Tools

- get_event_info
- list_schedule
- get_current_or_next_item
- search_sessions
- list_speakers
- list_categories
- get_session_details
- recommend_sessions

## Example Prompts

- What is this event about?
- What sessions are about MCP and agents?
- Who is speaking after lunch?
- What can I attend at 19:45?
- Which sessions match developer productivity?
- Recommend sessions if I care about agents and tooling.
