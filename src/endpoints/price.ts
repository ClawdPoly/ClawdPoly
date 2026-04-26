import type { HttpClientConfig } from "../http.js";
import type { GetPriceParams, PriceResponse } from "../types.js";
import { request } from "../http.js";

/**
 * Get the current price of any SPL token.
 *
 * @example
 * ```ts
 * const sol = await client.getPrice({ mint: "So11111111111111111111111111111111111111112" });
 * console.log(`SOL: $${sol.price}`);
 * ```
 */
export function getPrice(
  config: HttpClientConfig,
  params: GetPriceParams,
): Promise<PriceResponse> {
  return request<PriceResponse>(config, {
    method: "GET",
    path: "/price",
    query: {
      mint: params.mint,
      currency: params.currency,
    },
  });
}
