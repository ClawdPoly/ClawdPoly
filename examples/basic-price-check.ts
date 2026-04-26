/**
 * Basic example: check the price of SOL and a meme token.
 *
 * Run: npx tsx examples/basic-price-check.ts
 */
import { ClawpumpClient } from "@clawpump/sdk";

const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
});

// Well-known mint addresses
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function main() {
  // Get SOL price
  const sol = await client.getPrice({ mint: SOL_MINT });
  console.log(`SOL: $${sol.price} (24h: ${formatChange(sol.change24h)})`);

  // Get USDC price (should be ~$1)
  const usdc = await client.getPrice({ mint: USDC_MINT });
  console.log(`USDC: $${usdc.price}`);
}

function formatChange(change: number | null): string {
  if (change === null) return "N/A";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${(change * 100).toFixed(2)}%`;
}

main().catch(console.error);
