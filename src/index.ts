import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createServer, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { loadEventDataSync } from './data/loadEventData.js';
import { normalizeEventData } from './domain/normalizeEventData.js';
import { EventModel } from './domain/eventModel.js';
import * as commonTools from './tools/common.js';
import { getEventInfoHandler } from './tools/getEventInfo.js';
import { listScheduleHandler } from './tools/listSchedule.js';
import { getCurrentOrNextHandler } from './tools/getCurrentOrNextItem.js';
import { searchSessionsHandler } from './tools/searchSessions.js';
import { listSpeakersHandler } from './tools/listSpeakers.js';
import { listCategoriesHandler } from './tools/listCategories.js';
import { getSessionDetailsHandler } from './tools/getSessionDetails.js';
import { recommendSessionsHandler } from './tools/recommendSessions.js';

let eventModel: EventModel;
const MCP_ENDPOINT = '/mcp';

/**
 * Create MCP server with loaded event model.
 */
function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'code-comedy-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register list_tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      // US1 tools (P1: Event & Timeline)
      {
        name: 'get_event_info',
        description: 'Get event metadata and overall schedule statistics',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_schedule',
        description: 'List the complete chronological schedule of all sessions',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_current_or_next_item',
        description: 'Get the current or next session based on time context',
        inputSchema: {
          type: 'object',
          properties: {
            currentTime: {
              type: 'string',
              description: 'Current time in HH:mm format (optional, defaults to now)',
            },
          },
          required: [],
        },
      },
      // US2 tools (P2: Discovery)
      {
        name: 'search_sessions',
        description: 'Search sessions by keywords (title, abstract, speakers, categories)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query text',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_speakers',
        description: 'List all event speakers',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_categories',
        description: 'List all session categories',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_session_details',
        description: 'Get detailed information about a specific session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID to look up',
            },
          },
          required: ['sessionId'],
        },
      },
      // US3 tools (P3: Recommendations)
      {
        name: 'recommend_sessions',
        description: 'Get personalized session recommendations based on interests',
        inputSchema: {
          type: 'object',
          properties: {
            interests: {
              type: 'string',
              description: 'Interest keywords or phrases',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of recommendations (1-50, default 10)',
            },
          },
          required: ['interests'],
        },
      },
    ],
  }));

  // Register call_tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const input = (request.params.arguments ?? {}) as Record<string, unknown>;

    try {
      switch (toolName) {
        // US1 tools
        case 'get_event_info': {
          const result = getEventInfoHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        case 'list_schedule': {
          const result = listScheduleHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        case 'get_current_or_next_item': {
          const result = getCurrentOrNextHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        // US2 tools (Discovery)
        case 'search_sessions': {
          const result = searchSessionsHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        case 'list_speakers': {
          const result = listSpeakersHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        case 'list_categories': {
          const result = listCategoriesHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        case 'get_session_details': {
          const result = getSessionDetailsHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        // US3 tools
        case 'recommend_sessions': {
          const result = recommendSessionsHandler(eventModel, input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(commonTools.errorResponse(`Unknown tool: ${toolName}`)),
              },
            ],
          };
      }
    } catch (error) {
      console.error(`[MCP] Tool ${toolName} error:`, error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              commonTools.errorResponse('An error occurred while processing your request')
            ),
          },
        ],
      };
    }
  });

  return server;
}

/**
 * Load and validate data once at startup.
 */
function loadModelOrExit(): void {
  try {
    const rawData = loadEventDataSync();
    eventModel = normalizeEventData(rawData);
    console.error('[MCP] Event data loaded and validated');
  } catch (error) {
    console.error('[MCP] Fatal: Failed to load event data:', error);
    process.exit(1);
  }
}

function sendNotFound(res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

async function handleMcpRequest(req: any, res: any): Promise<void> {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  await transport.handleRequest(req, res);

  res.on('close', () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });
}

async function main() {
  loadModelOrExit();

  const port = Number(process.env.PORT ?? '3000');

  const httpServer = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? '', `http://${req.headers.host}`);

      if (req.method === 'GET' && requestUrl.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            name: 'code-comedy-mcp',
            transport: 'streamable-http',
            endpoint: MCP_ENDPOINT,
          })
        );
        return;
      }

      if (
        requestUrl.pathname === MCP_ENDPOINT &&
        (req.method === 'GET' || req.method === 'POST' || req.method === 'DELETE')
      ) {
        await handleMcpRequest(req, res);
        return;
      }

      sendNotFound(res);
    } catch (error) {
      console.error('[MCP] HTTP server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  httpServer.listen(port, () => {
    console.error(`[MCP] Streamable HTTP server listening on http://localhost:${port}${MCP_ENDPOINT}`);
  });
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
