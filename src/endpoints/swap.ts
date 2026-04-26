import type { HttpClientConfig } from "../http.js";
import type {
  SwapQuoteParams,
  SwapQuoteResponse,
  SwapExecuteParams,
  SwapExecuteResponse,
} from "../types.js";
import { request } from "../http.js";

/**
 * Get a swap quote without executing. Use this to preview expected output
 * amounts and price impact before committing to a trade.
 *
 * @example
 * ```ts
 * const quote = await client.getSwapQuote({
 *   inputMint: "So11111111111111111111111111111111111111112",
 *   outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *   amount: "100000000", // 0.1 SOL in lamports
 * });
 * console.log(`Expected output: ${quote.outputAmount} USDC (impact: ${quote.priceImpact}%)`);
 * ```
 */
export function getSwapQuote(
  config: HttpClientConfig,
  params: SwapQuoteParams,
): Promise<SwapQuoteResponse> {
  return request<SwapQuoteResponse>(config, {
    method: "POST",
    path: "/swap/quote",
    body: {
      input_mint: params.inputMint,
      output_mint: params.outputMint,
      amount: params.amount,
      slippage_bps: params.slippageBps,
    },
  });
}

/**
 * Execute a swap and receive an unsigned Solana transaction.
 *
 * The returned `unsignedTransaction` is a base64-encoded serialized
 * Solana transaction. You must:
 * 1. Deserialize it with `@solana/web3.js`
 * 2. Sign it with the `userWallet`'s private key (via Privy, Phantom, etc.)
 * 3. Submit the signed transaction to a Solana RPC node
 *
 * ClawPump never has access to your private keys.
 *
 * @example
 * ```ts
 * const { unsignedTransaction } = await client.executeSwap({
 *   inputMint: "So11111111111111111111111111111111111111112",
 *   outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *   amount: "100000000",
 *   userWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
 * });
 * // Sign and submit with your wallet provider
 * ```
 */
export function executeSwap(
  config: HttpClientConfig,
  params: SwapExecuteParams,
): Promise<SwapExecuteResponse> {
  return request<SwapExecuteResponse>(config, {
    method: "POST",
    path: "/swap/execute",
    body: {
      input_mint: params.inputMint,
      output_mint: params.outputMint,
      amount: params.amount,
      slippage_bps: params.slippageBps,
      user_wallet: params.userWallet,
    },
  });
}
