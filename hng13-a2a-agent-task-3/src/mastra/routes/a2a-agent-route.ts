import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

/**
 * Custom A2A (Agent-to-Agent) API Route
 *
 * This route wraps Mastra agent responses in A2A protocol format
 * following JSON-RPC 2.0 specification with proper artifacts structure
 */
export const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
  method: "POST",
  handler: async (c) => {
    let requestId: string | null = null;
    try {
      const mastra = c.get("mastra");
      const agentId = c.req.param("agentId");

      // Parse JSON-RPC 2.0 request
      const body = await c.req.json();
      const { jsonrpc, id, method, params } = body;
      requestId = id;

      if (jsonrpc !== "2.0" || !requestId) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId || null,
            error: {
              code: -32600,
              message:
                'Invalid Request: jsonrpc must be "2.0" and id is required',
            },
          },
          400
        );
      }

      // Validate method
      if (method !== "message/send") {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32601,
              message: `Invalid method: expected "message/send", got "${method}"`,
            },
          },
          400
        );
      }

      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message: `Agent '${agentId}' not found`,
            },
          },
          404
        );
      }

      const { message, configuration } = params || {};

      // Validate message structure
      if (!message || typeof message !== "object") {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message: "Invalid params: message is required",
            },
          },
          400
        );
      }

      // Validate message structure
      if (message.kind !== "message" || !message.role || !message.parts) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message:
                'Invalid message: must have kind "message", role, and parts array',
            },
          },
          400
        );
      }

      const currentTaskId = message.taskId || randomUUID();
      const conversationContext = message.contextId || randomUUID();

      // Convert message parts to Mastra format
      const mastraMessage = {
        role: message.role,
        content:
          message.parts
            .map((part: any) => {
              if (part.kind === "text") return part.text;
              if (part.kind === "data") return JSON.stringify(part.data);
              return "";
            })
            .join("\n") || "",
      };

      const response = await agent.generate([mastraMessage]);

      const agentText = response.text || "";
      const responseMessageId = randomUUID();

      // Build artifacts array
      const artifacts: any[] = [];

      if (response.toolResults && response.toolResults.length > 0) {
        response.toolResults.forEach((result: any) => {
          artifacts.push({
            artifactId: randomUUID(),
            name: result.name || "ToolResult",
            parts: [
              {
                kind: "data",
                data: result,
              },
            ],
          });
        });
      }

      // Build history array
      const history = [
        {
          kind: "message",
          role: message.role,
          parts: message.parts,
          messageId: message.messageId || randomUUID(),
          taskId: currentTaskId,
        },
        {
          kind: "message",
          role: "agent",
          parts: [
            {
              kind: "text",
              text: agentText,
            },
          ],
          messageId: responseMessageId,
          taskId: currentTaskId,
        },
      ];

      // Build response according to A2A protocol
      const a2aResponse = {
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: currentTaskId,
          contextId: conversationContext,
          status: {
            state: "completed",
            timestamp: new Date().toISOString(),
            message: {
              messageId: responseMessageId,
              role: "agent",
              parts: [
                {
                  kind: "text",
                  text: agentText,
                },
              ],
              kind: "message",
            },
          },
          artifacts,
          history,
          kind: "task",
        },
      };

      // Handle non-blocking requests if specified
      // For now, we're returning synchronously but you can extend this for async webhooks
      if (configuration?.blocking === false) {
        if (configuration?.pushNotificationConfig?.url) {
          // TODO: Implement async processing with webhook callback
          console.log(
            "Non-blocking request with webhook:",
            configuration.pushNotificationConfig.url
          );
        }
        // For non-blocking requests, we might want to return immediately
        // and process in background, but for now we'll process synchronously
      }

      return c.json(a2aResponse);
    } catch (error: any) {
      console.error("A2A Agent Route Error:", error);

      return c.json(
        {
          jsonrpc: "2.0",
          id: requestId,
          error: {
            code: -32603,
            message: "Internal error",
            data: {
              details: error.message,
            },
          },
        },
        500
      );
    }
  },
});
