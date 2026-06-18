import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { loadEventDataSync } from './data/loadEventData.js';
import { normalizeEventData } from './domain/normalizeEventData.js';
import { EventModel } from './domain/eventModel.js';
import * as commonTools from './tools/common.js';
import { getEventInfoHandler } from './tools/getEventInfo.js';
import { listScheduleHandler } from './tools/listSchedule.js';
import { getCurrentOrNextHandler } from './tools/getCurrentOrNextItem.js';

let eventModel: EventModel;

/**
 * Initialize MCP server with loaded event model
 */
async function initializeServer(): Promise<Server> {
  const server = new Server(
    {
      name: 'code-comedy-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {},
    }
  );

  // Load and normalize event data once at startup
  try {
    const rawData = loadEventDataSync();
    eventModel = normalizeEventData(rawData);
    console.error('[MCP] Event data loaded and validated');
  } catch (error) {
    console.error('[MCP] Fatal: Failed to load event data:', error);
    process.exit(1);
  }

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
    const input = request.params.arguments;

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

        // US2 tools (not yet implemented)
        case 'search_sessions':
        case 'list_speakers':
        case 'list_categories':
        case 'get_session_details':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(commonTools.errorResponse(`Tool ${toolName} not yet implemented`)),
              },
            ],
          };

        // US3 tools (not yet implemented)
        case 'recommend_sessions':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(commonTools.errorResponse(`Tool ${toolName} not yet implemented`)),
              },
            ],
          };

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
 * Main entry point
 */
async function main() {
  const server = await initializeServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('[MCP] Server started on stdio transport');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
