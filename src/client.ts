import type { ClawpumpClientConfig } from "./types.js";
import type { HttpClientConfig } from "./http.js";
import { createHttpConfig } from "./http.js";

import type {
  GetPriceParams,
  PriceResponse,
  SwapQuoteParams,
  SwapQuoteResponse,
  SwapExecuteParams,
  SwapExecuteResponse,
  GetPortfolioParams,
  PortfolioResponse,
  TopMoversParams,
  TopMoversResponse,
  YieldParams,
  YieldResponse,
  MacroSignalsParams,
  MacroSignalsResponse,
  AnomaliesParams,
  AnomaliesResponse,
  GetIndicatorsParams,
  IndicatorsResponse,
  CreateAgentParams,
  UpdateAgentParams,
  AgentResponse,
  AgentListResponse,
  SendMessageParams,
  ChatMessageResponse,
  GetMessagesParams,
  MessagesResponse,
  SkillCatalogResponse,
  CreateAutomationParams,
  AutomationResponse,
  AutomationListResponse,
} from "./types.js";

import { getPrice } from "./endpoints/price.js";
import { getSwapQuote, executeSwap } from "./endpoints/swap.js";
import { getPortfolio } from "./endpoints/portfolio.js";
import {
  getTopMovers,
  getYieldOpportunities,
  getMacroSignals,
  getAnomalies,
} from "./endpoints/signals.js";
import { getIndicators } from "./endpoints/indicators.js";
import {
  createAgent,
  getAgent,
  listAgents,
  updateAgent,
  deleteAgent,
  startAgent,
  stopAgent,
  listSkills,
  createAutomation,
  listAutomations,
  deleteAutomation,
} from "./endpoints/agents.js";
import { sendMessage, getMessages } from "./endpoints/chat.js";

/**
 * ClawPump SDK client for launching AI trading agents on Solana.
 *
 * Two main capabilities:
 * 1. **Agent Management** — create, configure, start/stop, and chat with AI agents
 * 2. **Market Intelligence** — prices, indicators, signals, swap execution
 *
 * @example
 * ```ts
 * import { ClawpumpClient } from "@clawpump/sdk";
 *
 * const client = new ClawpumpClient({
 *   apiKey: process.env.CLAWPUMP_API_KEY!,
 * });
 *
 * // Launch an agent
 * const agent = await client.createAgent({
 *   name: "Momentum Bot",
 *   strategy: "momentum",
 * });
 *
 * // Start it
 * await client.startAgent(agent.id);
 *
 * // Chat with it
 * const reply = await client.sendMessage(agent.id, {
 *   message: "What's trending right now?",
 * });
 * ```
 */
export class ClawpumpClient {
  private readonly http: HttpClientConfig;

  constructor(config: ClawpumpClientConfig) {
    if (!config.apiKey) {
      throw new Error("ClawpumpClient requires an apiKey");
    }
    this.http = createHttpConfig(config);
  }

  // ── Agent Management ───────────────────────────────────

  /**
   * Create a new AI agent on ClawPump.
   *
   * Each agent gets its own Solana wallet, LLM config, and skill set.
   * Use `strategy` for quick presets or `skills` for custom configurations.
   */
  createAgent(params: CreateAgentParams): Promise<AgentResponse> {
    return createAgent(this.http, params);
  }

  /** Get an agent by ID. */
  getAgent(agentId: string): Promise<AgentResponse> {
    return getAgent(this.http, agentId);
  }

  /** List all agents owned by your API key. */
  listAgents(): Promise<AgentListResponse> {
    return listAgents(this.http);
  }

  /** Update an agent's configuration (name, model, skills, etc.). */
  updateAgent(
    agentId: string,
    params: UpdateAgentParams,
  ): Promise<AgentResponse> {
    return updateAgent(this.http, agentId, params);
  }

  /** Delete an agent permanently. This cannot be undone. */
  deleteAgent(agentId: string): Promise<void> {
    return deleteAgent(this.http, agentId);
  }

  /** Start an agent — it will begin executing its strategy. */
  startAgent(agentId: string): Promise<AgentResponse> {
    return startAgent(this.http, agentId);
  }

  /** Stop an agent — it will cease all activity. */
  stopAgent(agentId: string): Promise<AgentResponse> {
    return stopAgent(this.http, agentId);
  }

  // ── Agent Chat ─────────────────────────────────────────

  /**
   * Send a message to an agent and receive a response.
   * The agent uses its skills to take actions (trade, research, etc.).
   */
  sendMessage(
    agentId: string,
    params: SendMessageParams,
  ): Promise<ChatMessageResponse> {
    return sendMessage(this.http, agentId, params);
  }

  /** Get chat message history for an agent. */
  getMessages(
    agentId: string,
    params?: GetMessagesParams,
  ): Promise<MessagesResponse> {
    return getMessages(this.http, agentId, params);
  }

  // ── Skills & Automations ───────────────────────────────

  /** Get the available skills catalog. */
  listSkills(): Promise<SkillCatalogResponse> {
    return listSkills(this.http);
  }

  /**
   * Create a price trigger or scheduled automation for an agent.
   * When the trigger fires, the agent executes the configured action.
   */
  createAutomation(
    params: CreateAutomationParams,
  ): Promise<AutomationResponse> {
    return createAutomation(this.http, params);
  }

  /** List automations for an agent. */
  listAutomations(agentId: string): Promise<AutomationListResponse> {
    return listAutomations(this.http, agentId);
  }

  /** Delete an automation. */
  deleteAutomation(automationId: string): Promise<void> {
    return deleteAutomation(this.http, automationId);
  }

  // ── Price ──────────────────────────────────────────────

  /** Get the current price of any SPL token by mint address. */
  getPrice(params: GetPriceParams): Promise<PriceResponse> {
    return getPrice(this.http, params);
  }

  // ── Swap ───────────────────────────────────────────────

  /**
   * Get a swap quote (expected output, price impact, route) without executing.
   * Use this to validate a trade before committing.
   */
  getSwapQuote(params: SwapQuoteParams): Promise<SwapQuoteResponse> {
    return getSwapQuote(this.http, params);
  }

  /**
   * Execute a swap and receive an unsigned Solana transaction.
   *
   * The returned transaction must be signed by `userWallet` and submitted
   * to Solana by the caller. ClawPump never has access to private keys.
   */
  executeSwap(params: SwapExecuteParams): Promise<SwapExecuteResponse> {
    return executeSwap(this.http, params);
  }

  // ── Portfolio ──────────────────────────────────────────

  /** Get all token holdings and USD valuations for a wallet address. */
  getPortfolio(params: GetPortfolioParams): Promise<PortfolioResponse> {
    return getPortfolio(this.http, params);
  }

  // ── Signals ────────────────────────────────────────────

  /** Get trending/top-moving tokens on Solana. */
  getTopMovers(params?: TopMoversParams): Promise<TopMoversResponse> {
    return getTopMovers(this.http, params);
  }

  /** Get DeFi yield opportunities across Solana protocols. */
  getYieldOpportunities(params?: YieldParams): Promise<YieldResponse> {
    return getYieldOpportunities(this.http, params);
  }

  /** Get macro-level market signals (ETF flows, stablecoin health, fear/greed). */
  getMacroSignals(params?: MacroSignalsParams): Promise<MacroSignalsResponse> {
    return getMacroSignals(this.http, params);
  }

  /** Get on-chain anomaly detection (whale moves, liquidity spikes, volume anomalies). */
  getAnomalies(params?: AnomaliesParams): Promise<AnomaliesResponse> {
    return getAnomalies(this.http, params);
  }

  // ── Indicators ─────────────────────────────────────────

  /** Get technical indicators (RSI, EMA, SMA, MACD) for a token. */
  getIndicators(params: GetIndicatorsParams): Promise<IndicatorsResponse> {
    return getIndicators(this.http, params);
  }
}
