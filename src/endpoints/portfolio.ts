import type { HttpClientConfig } from "../http.js";
import type { GetPortfolioParams, PortfolioResponse } from "../types.js";
import { request } from "../http.js";

/**
 * Get all token holdings for a Solana wallet address.
 *
 * Returns native SOL balance plus all SPL token holdings with current
 * USD valuations.
 *
 * @example
 * ```ts
 * const portfolio = await client.getPortfolio({
 *   wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
 * });
 * console.log(`Total: $${portfolio.totalValueUsd}`);
 * for (const token of portfolio.holdings) {
 *   console.log(`  ${token.symbol}: ${token.uiBalance} ($${token.valueUsd})`);
 * }
 * ```
 */
export function getPortfolio(
  config: HttpClientConfig,
  params: GetPortfolioParams,
): Promise<PortfolioResponse> {
  return request<PortfolioResponse>(config, {
    method: "GET",
    path: "/portfolio",
    query: {
      wallet: params.wallet,
    },
  });
}
