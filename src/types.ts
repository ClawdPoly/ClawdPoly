// ─── Common ────────────────────────────────────────────────

/** Metadata included in every API response. */
export interface ApiMeta {
  /** ISO 8601 timestamp of when the response was generated. */
  timestamp: string;
  /** Unique request ID — include in support requests for debugging. */
  requestId: string;
}

// ─── Price ─────────────────────────────────────────────────

export interface GetPriceParams {
  /** SPL token mint address. */
  mint: string;
  /** Currency for price denomination. Default: `"usd"`. */
  currency?: string;
}

export interface PriceResponse {
  mint: string;
  symbol: string | null;
  name: string | null;
  /** Current price in the requested currency. */
  price: number;
  currency: string;
  /** 24h price change as a decimal (e.g., 0.05 = +5%). */
  change24h: number | null;
  /** 24h volume in USD. */
  volume24h: number | null;
  /** Market cap in USD. */
  marketCap: number | null;
  meta: ApiMeta;
}

// ─── Swap ──────────────────────────────────────────────────

export interface SwapQuoteParams {
  /** Input token mint address (e.g., native SOL mint). */
  inputMint: string;
  /** Output token mint address. */
  outputMint: string;
  /** Amount in smallest unit (lamports for SOL). Use string for precision. */
  amount: string;
  /** Slippage tolerance in basis points (e.g., 50 = 0.5%). Default: 50. */
  slippageBps?: number;
}

export interface SwapRoute {
  /** DEX or aggregator used for this leg. */
  source: string;
  /** Percentage of the swap routed through this source. */
  percentage: number;
}

export interface SwapQuoteResponse {
  inputMint: string;
  outputMint: string;
  /** Quoted input amount in smallest unit. */
  inputAmount: string;
  /** Expected output amount in smallest unit. */
  outputAmount: string;
  /** Price impact as a decimal (e.g., 0.002 = 0.2%). */
  priceImpact: number;
  /** Route breakdown. */
  routes: SwapRoute[];
  /** Seconds until this quote expires. */
  expiresIn: number;
  meta: ApiMeta;
}

export interface SwapExecuteParams {
  /** Input token mint address. */
  inputMint: string;
  /** Output token mint address. */
  outputMint: string;
  /** Amount in smallest unit. */
  amount: string;
  /** Slippage tolerance in basis points. Default: 50. */
  slippageBps?: number;
  /** The wallet address that will sign the transaction. */
  userWallet: string;
}

export interface SwapExecuteResponse {
  /**
   * Base64-encoded unsigned serialized Solana transaction.
   *
   * The caller must:
   * 1. Deserialize with `@solana/web3.js`
   * 2. Sign with their wallet (Phantom, Privy, etc.)
   * 3. Broadcast to Solana RPC
   */
  unsignedTransaction: string;
  /** Input amount in smallest unit. */
  inputAmount: string;
  /** Expected output amount in smallest unit. */
  outputAmount: string;
  /** Estimated price impact as a decimal. */
  priceImpact: number;
  /** ISO 8601 expiry — caller must sign and submit before this time. */
  expiresAt: string;
  meta: ApiMeta;
}

// ─── Portfolio ─────────────────────────────────────────────

export interface GetPortfolioParams {
  /** Solana wallet address to query. */
  wallet: string;
}

export interface TokenHolding {
  mint: string;
  symbol: string | null;
  name: string | null;
  /** Raw balance in smallest unit. */
  balance: string;
  /** Human-readable balance (e.g., 1.5 SOL, not 1500000000 lamports). */
  uiBalance: number;
  /** Current USD value of this holding. */
  valueUsd: number;
  /** Current token price in USD. */
  priceUsd: number;
  /** 24h price change as a decimal. */
  change24h: number | null;
}

export interface PortfolioResponse {
  wallet: string;
  /** Total portfolio value in USD. */
  totalValueUsd: number;
  /** Native SOL balance (not wrapped SOL). */
  solBalance: number;
  holdings: TokenHolding[];
  meta: ApiMeta;
}

// ─── Signals: Top Movers ───────────────────────────────────

export interface TopMoversParams {
  /** Time window. Default: `"24h"`. */
  timeframe?: "1h" | "4h" | "24h";
  /** Number of results. Default: 20, max: 100. */
  limit?: number;
  /** Sort criteria. Default: `"gainers"`. */
  sortBy?: "gainers" | "losers" | "volume";
  /** Minimum liquidity in USD to filter out illiquid tokens. */
  minLiquidity?: number;
}

export interface TopMover {
  mint: string;
  symbol: string | null;
  name: string | null;
  /** Current price in USD. */
  price: number;
  /** Price change over the requested timeframe as a decimal. */
  change: number;
  /** Volume in USD over the timeframe. */
  volume: number;
  /** Market cap in USD. */
  marketCap: number | null;
  /** Liquidity in USD. */
  liquidity: number | null;
}

export interface TopMoversResponse {
  timeframe: string;
  movers: TopMover[];
  meta: ApiMeta;
}

// ─── Signals: Yield Opportunities ──────────────────────────

export interface YieldParams {
  /** Filter by protocol name. */
  protocol?: string;
  /** Minimum APY filter. */
  minApy?: number;
  /** Maximum results. Default: 20. */
  limit?: number;
}

export interface YieldOpportunity {
  protocol: string;
  pool: string;
  /** Token mint addresses in the pool/vault. */
  tokens: string[];
  /** Annual percentage yield. */
  apy: number;
  /** Total value locked in USD. */
  tvl: number;
  /** Risk assessment. */
  risk: "low" | "medium" | "high";
  /** Type of yield (staking, lending, LP, vault, etc.). */
  type: string;
}

export interface YieldResponse {
  opportunities: YieldOpportunity[];
  meta: ApiMeta;
}

// ─── Signals: Macro ────────────────────────────────────────

export interface MacroSignalsParams {
  /** Specific signal categories to include. Returns all if omitted. */
  include?: Array<
    "etf_flows" | "stablecoin_health" | "fear_greed" | "sol_dominance"
  >;
}

export interface MacroSignal {
  /** Signal category identifier. */
  category: string;
  /** Human-readable signal name. */
  signal: string;
  /** Numeric or string value depending on signal type. */
  value: number | string;
  /** Directional interpretation. */
  sentiment: "bullish" | "bearish" | "neutral";
  /** ISO 8601 — when this data point was last updated. */
  updatedAt: string;
}

export interface MacroSignalsResponse {
  signals: MacroSignal[];
  meta: ApiMeta;
}

// ─── Signals: Anomalies ────────────────────────────────────

export interface AnomaliesParams {
  /** Time window. Default: `"24h"`. */
  timeframe?: "1h" | "4h" | "24h";
  /** Filter by anomaly type. Returns all if omitted. */
  types?: Array<
    "whale_movement" | "liquidity_spike" | "volume_anomaly" | "large_transfer"
  >;
  /** Maximum results. Default: 20. */
  limit?: number;
}

export interface Anomaly {
  type:
    | "whale_movement"
    | "liquidity_spike"
    | "volume_anomaly"
    | "large_transfer";
  /** Token mint addresses involved. */
  mints: string[];
  /** Human-readable description. */
  description: string;
  /** Severity from 0 (low) to 1 (critical). */
  severity: number;
  /** ISO 8601 — when the anomaly was detected. */
  detectedAt: string;
  /** Additional context data. */
  details: Record<string, unknown>;
}

export interface AnomaliesResponse {
  timeframe: string;
  anomalies: Anomaly[];
  meta: ApiMeta;
}

// ─── Technical Indicators ──────────────────────────────────

export type IndicatorType = "rsi" | "ema" | "sma" | "macd";

export interface GetIndicatorsParams {
  /** SPL token mint address. */
  mint: string;
  /** Which indicators to calculate. */
  indicators: IndicatorType[];
  /** Candle timeframe. Default: `"1h"`. */
  timeframe?: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  /** Period for moving averages. Default: 14. */
  period?: number;
}

export interface RSIValue {
  indicator: "rsi";
  value: number;
  /** Interpretation based on standard thresholds. */
  signal: "overbought" | "oversold" | "neutral";
}

export interface EMAValue {
  indicator: "ema";
  value: number;
  period: number;
}

export interface SMAValue {
  indicator: "sma";
  value: number;
  period: number;
}

export interface MACDValue {
  indicator: "macd";
  macd: number;
  signal: number;
  histogram: number;
  trend: "bullish" | "bearish";
}

export type IndicatorValue = RSIValue | EMAValue | SMAValue | MACDValue;

export interface IndicatorsResponse {
  mint: string;
  timeframe: string;
  indicators: IndicatorValue[];
  meta: ApiMeta;
}

// ─── Agent Management ──────────────────────────────────────

export type AgentStatus = "running" | "stopped" | "error";

/** Available skill identifiers that can be enabled on an agent. */
export type SkillSlug =
  | "trading"
  | "token-launch"
  | "portfolio"
  | "market-intelligence"
  | "social"
  | "sniper"
  | "wallet";

/** Convenience strategy presets that auto-configure skills + persona. */
export type StrategyPreset =
  | "monitor-exit"
  | "momentum"
  | "defi-yield"
  | "macro-guard"
  | "sniper";

export interface CreateAgentParams {
  /** Agent display name. */
  name: string;
  /** LLM model ID. Omit for the platform default. */
  model?: string;
  /** Agent personality description (e.g., "conservative trader focused on blue chips"). */
  persona?: string;
  /** Custom system prompt. Overrides persona if both are set. */
  systemPrompt?: string;
  /** Skills to enable. Omit to use strategy defaults. */
  skills?: SkillSlug[];
  /**
   * Convenience preset that auto-configures skills and persona.
   * If `skills` is also provided, `skills` takes precedence.
   */
  strategy?: StrategyPreset;
  /** LLM temperature (0-1). Default: 0.7. */
  temperature?: number;
}

export interface UpdateAgentParams {
  name?: string;
  model?: string;
  persona?: string;
  systemPrompt?: string;
  skills?: SkillSlug[];
  temperature?: number;
  /** Set to true to make this agent publicly visible. */
  isPublic?: boolean;
  /** Public description shown in the directory. */
  publicDescription?: string;
}

export interface AgentResponse {
  id: string;
  name: string;
  status: AgentStatus;
  /** Solana wallet address assigned to this agent. */
  walletAddress: string | null;
  /** Currently enabled skills. */
  skills: string[];
  model: string | null;
  persona: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  meta: ApiMeta;
}

export interface AgentListResponse {
  agents: Omit<AgentResponse, "meta">[];
  meta: ApiMeta;
}

// ─── Agent Chat ────────────────────────────────────────────

export interface SendMessageParams {
  /** The message text to send. */
  message: string;
  /** LLM model override for this message. */
  model?: string;
  /** Temperature override for this message. */
  temperature?: number;
}

export interface ChatMessageResponse {
  role: "assistant";
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  meta: ApiMeta;
}

export interface GetMessagesParams {
  /** Max messages to return. Default: 20. */
  limit?: number;
  /** ISO 8601 cursor — return messages before this timestamp. */
  before?: string;
}

export interface MessageEntry {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  createdAt: string;
}

export interface MessagesResponse {
  messages: MessageEntry[];
  hasMore: boolean;
  meta: ApiMeta;
}

// ─── Skills Catalog ────────────────────────────────────────

export interface SkillInfo {
  slug: string;
  name: string;
  description: string;
  /** If true, this skill is always active and cannot be disabled. */
  alwaysOn: boolean;
}

export interface SkillCatalogResponse {
  skills: SkillInfo[];
  meta: ApiMeta;
}

// ─── Automations ───────────────────────────────────────────

export type AutomationStatus =
  | "armed"
  | "paused"
  | "cancelled"
  | "completed"
  | "error";

export interface CreateAutomationParams {
  /** Agent to attach the automation to. */
  agentId: string;
  name: string;
  description?: string;
  trigger:
    | {
        type: "price_threshold";
        mint: string;
        operator: "gte" | "lte";
        priceUsd: number;
      }
    | {
        type: "schedule";
        /** ISO 8601 datetime to fire at. */
        scheduledAt: string;
      };
  action:
    | {
        type: "agent_prompt";
        /** Message to send to the agent when triggered. */
        prompt: string;
      }
    | {
        type: "tool_call";
        tool: string;
        args: Record<string, unknown>;
      };
  /** If true, automation fires once then completes. Default: false. */
  triggerOnce?: boolean;
}

export interface AutomationResponse {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  triggerType: string;
  actionType: string;
  runCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  meta: ApiMeta;
}

export interface AutomationListResponse {
  automations: Omit<AutomationResponse, "meta">[];
  meta: ApiMeta;
}

// ─── Client Configuration ──────────────────────────────────

export interface ClawpumpClientConfig {
  /** Your ClawPump API key. */
  apiKey: string;
  /** API base URL. Default: `"https://agents.clawpump.tech/api/v1"`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number;
  /** Number of retries for transient errors (5xx, network, timeout). Default: 0. */
  retries?: number;
  /** Base delay between retries in milliseconds (doubled each attempt). Default: 1000. */
  retryDelay?: number;
  /** Custom fetch implementation for testing or edge runtimes. */
  fetch?: typeof globalThis.fetch;
}
