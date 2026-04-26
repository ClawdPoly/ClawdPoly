/**
 * Monitor & Exit Strategy: watch a position and sell at targets.
 *
 * This demonstrates the simplest agent strategy:
 * 1. Check portfolio to know current holdings
 * 2. Check price of a watched token
 * 3. Sell if take-profit or stop-loss is hit
 *
 * Run: npx tsx examples/monitor-and-exit.ts
 */
import { ClawpumpClient, RateLimitError } from "@clawpump/sdk";

const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
  retries: 1,
});

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AGENT_WALLET = process.env.AGENT_WALLET!;

// Strategy config
const WATCHED_MINT = process.env.WATCHED_TOKEN_MINT!;
const ENTRY_PRICE = Number(process.env.ENTRY_PRICE!); // Price when we bought
const TAKE_PROFIT_PCT = 0.15; // +15%
const STOP_LOSS_PCT = -0.08; // -8%

async function tick() {
  try {
    // Step 1: Check what we hold
    const portfolio = await client.getPortfolio({ wallet: AGENT_WALLET });
    const holding = portfolio.holdings.find((h) => h.mint === WATCHED_MINT);

    if (!holding || holding.uiBalance === 0) {
      console.log("No position in watched token. Holding.");
      return;
    }

    console.log(
      `Position: ${holding.uiBalance} ${holding.symbol} ($${holding.valueUsd})`,
    );

    // Step 2: Check current price
    const { price } = await client.getPrice({ mint: WATCHED_MINT });
    const changeSinceEntry = (price - ENTRY_PRICE) / ENTRY_PRICE;
    console.log(
      `Current: $${price} | Entry: $${ENTRY_PRICE} | Change: ${(changeSinceEntry * 100).toFixed(2)}%`,
    );

    // Step 3: Decide
    if (changeSinceEntry >= TAKE_PROFIT_PCT) {
      console.log("Take profit target hit! Selling...");
      await sellAll(holding.balance);
    } else if (changeSinceEntry <= STOP_LOSS_PCT) {
      console.log("Stop loss triggered! Selling...");
      await sellAll(holding.balance);
    } else {
      console.log("Within range. Holding.");
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`Rate limited. Retry after: ${error.retryAfter}`);
    } else {
      throw error;
    }
  }
}

async function sellAll(amount: string) {
  const { unsignedTransaction } = await client.executeSwap({
    inputMint: WATCHED_MINT,
    outputMint: USDC_MINT,
    amount,
    slippageBps: 100,
    userWallet: AGENT_WALLET,
  });

  console.log("Unsigned sell transaction received.");
  console.log("Sign with your wallet provider and submit to Solana.");
  // In production: sign via Privy and submit
}

tick().catch(console.error);
