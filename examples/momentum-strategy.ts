/**
 * Momentum Strategy: find trending tokens, check RSI, execute a swap.
 *
 * This demonstrates the full flow an AI trading agent would use:
 * 1. Get top movers to find candidates
 * 2. Check RSI to find oversold entries
 * 3. Get a quote to preview the trade
 * 4. Execute the swap (returns unsigned transaction)
 *
 * Run: npx tsx examples/momentum-strategy.ts
 */
import { ClawpumpClient, InsufficientLiquidityError } from "@clawpump/sdk";

const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
  retries: 2, // Retry transient errors (recommended for cron-based agents)
});

const SOL_MINT = "So11111111111111111111111111111111111111112";
const AGENT_WALLET = process.env.AGENT_WALLET!;

async function tick() {
  // Step 1: Find top movers with real liquidity
  const { movers } = await client.getTopMovers({
    timeframe: "1h",
    limit: 5,
    sortBy: "gainers",
    minLiquidity: 50_000,
  });

  if (movers.length === 0) {
    console.log("No movers found, holding.");
    return;
  }

  // Step 2: Check RSI on top candidate
  const candidate = movers[0];
  console.log(
    `Top mover: ${candidate.symbol} (${(candidate.change * 100).toFixed(1)}%)`,
  );

  const { indicators } = await client.getIndicators({
    mint: candidate.mint,
    indicators: ["rsi", "ema"],
    timeframe: "1h",
    period: 14,
  });

  const rsi = indicators.find((i) => i.indicator === "rsi");
  if (!rsi || rsi.indicator !== "rsi") {
    console.log("No RSI data, skipping.");
    return;
  }

  console.log(`RSI: ${rsi.value} (${rsi.signal})`);

  // Only buy if RSI is oversold or neutral (not overbought)
  if (rsi.signal === "overbought") {
    console.log("RSI overbought, holding.");
    return;
  }

  // Step 3: Get a quote
  const quote = await client.getSwapQuote({
    inputMint: SOL_MINT,
    outputMint: candidate.mint,
    amount: "50000000", // 0.05 SOL
    slippageBps: 100,
  });

  console.log(
    `Quote: ${quote.inputAmount} SOL → ${quote.outputAmount} ${candidate.symbol}`,
  );
  console.log(`Price impact: ${(quote.priceImpact * 100).toFixed(3)}%`);

  // Abort if price impact is too high
  if (quote.priceImpact > 0.03) {
    console.log("Price impact too high, skipping.");
    return;
  }

  // Step 4: Execute the swap
  try {
    const { unsignedTransaction, expiresAt } = await client.executeSwap({
      inputMint: SOL_MINT,
      outputMint: candidate.mint,
      amount: "50000000",
      slippageBps: 100,
      userWallet: AGENT_WALLET,
    });

    console.log(`Unsigned transaction received (expires: ${expiresAt})`);
    console.log(`Transaction (base64): ${unsignedTransaction.slice(0, 40)}...`);

    // In production: sign with Privy/Phantom and submit to Solana RPC
    // See examples/swap-with-privy.ts for the signing flow
  } catch (error) {
    if (error instanceof InsufficientLiquidityError) {
      console.log("Insufficient liquidity for this trade.");
    } else {
      throw error;
    }
  }
}

tick().catch(console.error);
