import type { HttpClientConfig } from "../http.js";
import type {
  SendMessageParams,
  ChatMessageResponse,
  GetMessagesParams,
  MessagesResponse,
} from "../types.js";
import { request } from "../http.js";

/**
 * Send a message to an agent and receive a response.
 *
 * The agent will use its configured model, persona, and enabled skills
 * to generate a response. If skills like `trading` or `sniper` are enabled,
 * the agent may execute on-chain actions as part of its response.
 *
 * @example
 * ```ts
 * const response = await client.sendMessage("agent_123", {
 *   message: "What are the top trending tokens right now?",
 * });
 * console.log(response.content);
 * ```
 */
export function sendMessage(
  config: HttpClientConfig,
  agentId: string,
  params: SendMessageParams,
): Promise<ChatMessageResponse> {
  return request<ChatMessageResponse>(config, {
    method: "POST",
    path: `/agents/${agentId}/chat`,
    body: {
      message: params.message,
      model: params.model,
      temperature: params.temperature,
    },
  });
}

/**
 * Get chat message history for an agent.
 *
 * Messages are returned in reverse chronological order.
 * Use `before` cursor for pagination.
 *
 * @example
 * ```ts
 * const { messages, hasMore } = await client.getMessages("agent_123", {
 *   limit: 50,
 * });
 * ```
 */
export function getMessages(
  config: HttpClientConfig,
  agentId: string,
  params?: GetMessagesParams,
): Promise<MessagesResponse> {
  return request<MessagesResponse>(config, {
    method: "GET",
    path: `/agents/${agentId}/messages`,
    query: {
      limit: params?.limit,
      before: params?.before,
    },
  });
}
