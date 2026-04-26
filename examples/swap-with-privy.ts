/**
 * Full swap flow with Privy server-side signing.
 *
 * This shows the complete integration pattern for platforms like OMZO
 * that use Privy embedded wallets:
 *
 * 1. ClawPump SDK returns an unsigned transaction
 * 2. Privy signs it server-side (no private key exposure)
 * 3. You submit the signed transaction to Solana
 *
 * Run: npx tsx examples/swap-with-privy.ts
 */
import { ClawpumpClient } from "@clawpump/sdk";
// import { Connection } from "@solana/web3.js";  // Uncomment for real usage

const client = new ClawpumpClient({
  apiKey: process.env.CLAWPUMP_API_KEY!,
  retries: 2,
});

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AGENT_WALLET = process.env.AGENT_WALLET!;
const PRIVY_WALLET_ID = process.env.PRIVY_WALLET_ID!;
const PRIVY_APP_ID = process.env.PRIVY_APP_ID!;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;

async function swapSolToUsdc(amountLamports: string) {
  // Step 1: Get the unsigned transaction from ClawPump
  const { unsignedTransaction, expiresAt, outputAmount, priceImpact } =
    await client.executeSwap({
      inputMint: SOL_MINT,
      outputMint: USDC_MINT,
      amount: amountLamports,
      slippageBps: 50,
      userWallet: AGENT_WALLET,
    });

  console.log(`Swap: ${amountLamports} lamports SOL → ${outputAmount} USDC`);
  console.log(`Impact: ${(priceImpact * 100).toFixed(3)}%, expires: ${expiresAt}`);

  // Step 2: Sign via Privy server-side API
  const signResponse = await fetch(
    `https://auth.privy.io/api/v1/wallets/${PRIVY_WALLET_ID}/rpc`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "privy-app-id": PRIVY_APP_ID,
        Authorization: `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        method: "signTransaction",
        params: {
          transaction: unsignedTransaction, // base64 encoded
          encoding: "base64",
        },
      }),
    },
  );

  if (!signResponse.ok) {
    throw new Error(`Privy signing failed: ${signResponse.statusText}`);
  }

  const { data } = (await signResponse.json()) as {
    data: { signedTransaction: string };
  };

  console.log("Transaction signed via Privy.");

  // Step 3: Submit to Solana
  // const connection = new Connection("https://api.mainnet-beta.solana.com");
  // const txBuffer = Buffer.from(data.signedTransaction, "base64");
  // const txId = await connection.sendRawTransaction(txBuffer);
  // console.log(`Submitted: https://solscan.io/tx/${txId}`);

  console.log("(Dry run — uncomment Solana submission for production)");
  return data.signedTransaction;
}

swapSolToUsdc("100000000").catch(console.error); // 0.1 SOL
