import type { HttpClientConfig } from "../http.js";
import type { GetIndicatorsParams, IndicatorsResponse } from "../types.js";
import { request } from "../http.js";

/**
 * Get technical analysis indicators for an SPL token.
 *
 * Supports RSI, EMA, SMA, and MACD with configurable timeframes and periods.
 * Request multiple indicators in a single call.
 *
 * @example
 * ```ts
 * const { indicators } = await client.getIndicators({
 *   mint: "So11111111111111111111111111111111111111112",
 *   indicators: ["rsi", "ema"],
 *   timeframe: "1h",
 *   period: 14,
 * });
 *
 * const rsi = indicators.find(i => i.indicator === "rsi");
 * if (rsi?.indicator === "rsi" && rsi.signal === "oversold") {
 *   // Potential buy signal
 * }
 * ```
 */
export function getIndicators(
  config: HttpClientConfig,
  params: GetIndicatorsParams,
): Promise<IndicatorsResponse> {
  return request<IndicatorsResponse>(config, {
    method: "GET",
    path: "/indicators",
    query: {
      mint: params.mint,
      indicators: params.indicators.join(","),
      timeframe: params.timeframe,
      period: params.period,
    },
  });
}
