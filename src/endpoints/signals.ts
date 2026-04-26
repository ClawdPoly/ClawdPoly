import type { HttpClientConfig } from "../http.js";
import type {
  TopMoversParams,
  TopMoversResponse,
  YieldParams,
  YieldResponse,
  MacroSignalsParams,
  MacroSignalsResponse,
  AnomaliesParams,
  AnomaliesResponse,
} from "../types.js";
import { request } from "../http.js";

/**
 * Get trending/top-moving tokens on Solana by price action and volume.
 *
 * Use `minLiquidity` to filter out illiquid tokens that could be traps.
 *
 * @example
 * ```ts
 * const { movers } = await client.getTopMovers({
 *   timeframe: "1h",
 *   limit: 10,
 *   sortBy: "gainers",
 *   minLiquidity: 50_000,
 * });
 * ```
 */
export function getTopMovers(
  config: HttpClientConfig,
  params?: TopMoversParams,
): Promise<TopMoversResponse> {
  return request<TopMoversResponse>(config, {
    method: "GET",
    path: "/signals/top-movers",
    query: {
      timeframe: params?.timeframe,
      limit: params?.limit,
      sort_by: params?.sortBy,
      min_liquidity: params?.minLiquidity,
    },
  });
}

/**
 * Get DeFi yield opportunities across Solana protocols.
 *
 * Returns staking, lending, LP, and vault opportunities sorted by APY.
 *
 * @example
 * ```ts
 * const { opportunities } = await client.getYieldOpportunities({
 *   minApy: 5,
 *   limit: 10,
 * });
 * ```
 */
export function getYieldOpportunities(
  config: HttpClientConfig,
  params?: YieldParams,
): Promise<YieldResponse> {
  return request<YieldResponse>(config, {
    method: "GET",
    path: "/signals/yield",
    query: {
      protocol: params?.protocol,
      min_apy: params?.minApy,
      limit: params?.limit,
    },
  });
}

/**
 * Get macro-level market health signals.
 *
 * Includes ETF flows, stablecoin health index, fear & greed index,
 * and SOL dominance. Useful for risk-off/risk-on decisions.
 *
 * Data is cached for up to 5 minutes (macro data changes slowly).
 *
 * @example
 * ```ts
 * const { signals } = await client.getMacroSignals();
 * const fearGreed = signals.find(s => s.category === "fear_greed");
 * if (fearGreed && fearGreed.sentiment === "bearish") {
 *   // Rotate to stables
 * }
 * ```
 */
export function getMacroSignals(
  config: HttpClientConfig,
  params?: MacroSignalsParams,
): Promise<MacroSignalsResponse> {
  return request<MacroSignalsResponse>(config, {
    method: "GET",
    path: "/signals/macro",
    query: {
      include: params?.include?.join(","),
    },
  });
}

/**
 * Get on-chain anomaly detection: whale movements, liquidity spikes,
 * volume anomalies, and large transfers.
 *
 * Freshness matters here — data should be < 60 seconds old for
 * sniper strategies.
 *
 * @example
 * ```ts
 * const { anomalies } = await client.getAnomalies({
 *   timeframe: "1h",
 *   types: ["whale_movement", "liquidity_spike"],
 *   limit: 5,
 * });
 * ```
 */
export function getAnomalies(
  config: HttpClientConfig,
  params?: AnomaliesParams,
): Promise<AnomaliesResponse> {
  return request<AnomaliesResponse>(config, {
    method: "GET",
    path: "/signals/anomalies",
    query: {
      timeframe: params?.timeframe,
      types: params?.types?.join(","),
      limit: params?.limit,
    },
  });
}
