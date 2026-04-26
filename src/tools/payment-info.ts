import { getPaymentInfo } from "../lib/payment.js";

interface PaymentInfoInput {
  orderTotalUsd: number;
}

export function paymentInfo(input: PaymentInfoInput) {
  if (!input.orderTotalUsd || input.orderTotalUsd <= 0) {
    return {
      error: "Invalid order total. Use estimate_order first to calculate the total.",
    };
  }

  const info = getPaymentInfo(input.orderTotalUsd);

  return {
    ...info,
    orderTotal: `$${input.orderTotalUsd.toFixed(2)}`,
    breakdown: [
      `Order total: $${input.orderTotalUsd.toFixed(2)} USDC`,
      `Network: Solana mainnet`,
      `Token: USDC (SPL)`,
      ``,
      `Send to: ${info.walletAddress}`,
      ``,
      `After payment, the agent will call the dispensary to place your order.`,
      `You will need to show valid 21+ ID at delivery.`,
    ].join("\n"),
  };
}

export const paymentInfoSchema = {
  name: "get_payment_info",
  description:
    "Get the USDC wallet address and payment instructions for an order. Use after estimate_order to show the user where to send payment.",
  inputSchema: {
    type: "object" as const,
    properties: {
      orderTotalUsd: {
        type: "number",
        description: "Total order amount in USD (from estimate_order)",
      },
    },
    required: ["orderTotalUsd"],
  },
};
