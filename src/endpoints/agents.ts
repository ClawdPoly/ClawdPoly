import type { HttpClientConfig } from "../http.js";
import type {
  CreateAgentParams,
  UpdateAgentParams,
  AgentResponse,
  AgentListResponse,
  SkillCatalogResponse,
  CreateAutomationParams,
  AutomationResponse,
  AutomationListResponse,
} from "../types.js";
import { request } from "../http.js";

/**
 * Create a new AI agent on ClawPump.
 *
 * Each agent gets its own isolated Solana wallet, LLM configuration,
 * and skill set. Use the `strategy` param for quick preset configuration.
 *
 * @example
 * ```ts
 * const agent = await client.createAgent({
 *   name: "Momentum Bot",
 *   strategy: "momentum",
 *   model: "llama-3.3-70b-versatile",
 * });
 * console.log(`Agent ${agent.id} created with wallet ${agent.walletAddress}`);
 * ```
 */
export function createAgent(
  config: HttpClientConfig,
  params: CreateAgentParams,
): Promise<AgentResponse> {
  return request<AgentResponse>(config, {
    method: "POST",
    path: "/agents",
    body: {
      name: params.name,
      model: params.model,
      persona: params.persona,
      system_prompt: params.systemPrompt,
      skills: params.skills,
      strategy: params.strategy,
      temperature: params.temperature,
    },
  });
}

/** Get a single agent by ID. */
export function getAgent(
  config: HttpClientConfig,
  agentId: string,
): Promise<AgentResponse> {
  return request<AgentResponse>(config, {
    method: "GET",
    path: `/agents/${agentId}`,
  });
}

/** List all agents owned by the authenticated API key. */
export function listAgents(
  config: HttpClientConfig,
): Promise<AgentListResponse> {
  return request<AgentListResponse>(config, {
    method: "GET",
    path: "/agents",
  });
}

/** Update an agent's configuration. */
export function updateAgent(
  config: HttpClientConfig,
  agentId: string,
  params: UpdateAgentParams,
): Promise<AgentResponse> {
  return request<AgentResponse>(config, {
    method: "POST",
    path: `/agents/${agentId}`,
    body: {
      name: params.name,
      model: params.model,
      persona: params.persona,
      system_prompt: params.systemPrompt,
      skills: params.skills,
      temperature: params.temperature,
      is_public: params.isPublic,
      public_description: params.publicDescription,
    },
  });
}

/** Delete an agent permanently. This cannot be undone. */
export function deleteAgent(
  config: HttpClientConfig,
  agentId: string,
): Promise<void> {
  return request<void>(config, {
    method: "DELETE",
    path: `/agents/${agentId}`,
  });
}

/**
 * Start an agent. The agent will begin processing on its cron loop
 * and executing its configured strategy.
 */
export function startAgent(
  config: HttpClientConfig,
  agentId: string,
): Promise<AgentResponse> {
  return request<AgentResponse>(config, {
    method: "POST",
    path: `/agents/${agentId}/start`,
  });
}

/** Stop an agent. The agent will cease all activity. */
export function stopAgent(
  config: HttpClientConfig,
  agentId: string,
): Promise<AgentResponse> {
  return request<AgentResponse>(config, {
    method: "POST",
    path: `/agents/${agentId}/stop`,
  });
}

/** Get the available skills catalog. */
export function listSkills(
  config: HttpClientConfig,
): Promise<SkillCatalogResponse> {
  return request<SkillCatalogResponse>(config, {
    method: "GET",
    path: "/skills",
  });
}

// ── Automations ────────────────────────────────────────────

/**
 * Create a new automation (price trigger or scheduled action) for an agent.
 *
 * @example
 * ```ts
 * const automation = await client.createAutomation({
 *   agentId: "agent_123",
 *   name: "SOL take-profit",
 *   trigger: {
 *     type: "price_threshold",
 *     mint: "So11111111111111111111111111111111111111112",
 *     operator: "gte",
 *     priceUsd: 200,
 *   },
 *   action: {
 *     type: "agent_prompt",
 *     prompt: "SOL hit $200. Sell 50% of my SOL position for USDC.",
 *   },
 *   triggerOnce: true,
 * });
 * ```
 */
export function createAutomation(
  config: HttpClientConfig,
  params: CreateAutomationParams,
): Promise<AutomationResponse> {
  return request<AutomationResponse>(config, {
    method: "POST",
    path: "/automations",
    body: {
      agent_id: params.agentId,
      name: params.name,
      description: params.description,
      trigger: params.trigger,
      action: params.action,
      trigger_once: params.triggerOnce,
    },
  });
}

/** List automations for an agent. */
export function listAutomations(
  config: HttpClientConfig,
  agentId: string,
): Promise<AutomationListResponse> {
  return request<AutomationListResponse>(config, {
    method: "GET",
    path: "/automations",
    query: { agent_id: agentId },
  });
}

/** Delete an automation. */
export function deleteAutomation(
  config: HttpClientConfig,
  automationId: string,
): Promise<void> {
  return request<void>(config, {
    method: "DELETE",
    path: `/automations/${automationId}`,
  });
}
