import { Connection, PublicKey } from "@solana/web3.js";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

/**
 * Get the USDC SPL token balance for a Solana wallet address.
 */
export async function getUsdcBalance(
  walletAddress: string,
  rpcUrl?: string,
): Promise<number> {
  const connection = new Connection(
    rpcUrl || process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  );

  const wallet = new PublicKey(walletAddress);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    mint: USDC_MINT,
  });

  let balance = 0;
  for (const account of tokenAccounts.value) {
    const info = account.account.data.parsed?.info;
    if (info?.tokenAmount?.uiAmount) {
      balance += info.tokenAmount.uiAmount;
    }
  }

  return balance;
}

/**
 * Get payment info for a given order total.
 */
export function getPaymentInfo(orderTotalUsd: number) {
  const walletAddress = process.env.PAYMENT_WALLET_ADDRESS;
  if (!walletAddress) {
    return {
      error: "PAYMENT_WALLET_ADDRESS not set. Add your Solana wallet to .env",
      walletAddress: "",
      network: "Solana",
      token: "USDC (SPL)",
      mint: USDC_MINT.toBase58(),
      amountUsd: orderTotalUsd,
      instructions: "Set PAYMENT_WALLET_ADDRESS in your .env file to receive USDC payments.",
    };
  }

  return {
    walletAddress,
    network: "Solana",
    token: "USDC (SPL)",
    mint: USDC_MINT.toBase58(),
    amountUsd: orderTotalUsd,
    instructions: [
      `Send exactly ${orderTotalUsd.toFixed(2)} USDC to:`,
      `  ${walletAddress}`,
      "",
      "Network: Solana mainnet",
      "Token: USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)",
      "",
      "After sending, provide the transaction signature to confirm payment.",
      "The order will be placed once payment is verified.",
    ].join("\n"),
  };
}
