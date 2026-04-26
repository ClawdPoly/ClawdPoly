import { getProduct } from "../data/catalog.js";
import type { OrderItem, OrderEstimate } from "../lib/types.js";

interface EstimateOrderInput {
  items: OrderItem[];
}

const RUNNER_BOUNTY = parseFloat(process.env.RUNNER_BOUNTY_USD || "10");

export function estimateOrder(input: EstimateOrderInput): OrderEstimate | { error: string } {
  const serviceFee = parseFloat(process.env.SERVICE_FEE_USD || "2.00");

  if (!input.items || input.items.length === 0) {
    return { error: "No items provided. Add at least one product to the order." };
  }

  const resolvedItems: OrderEstimate["items"] = [];
  const errors: string[] = [];

  for (const item of input.items) {
    const product = getProduct(item.productId);
    if (!product) {
      errors.push(`Product not found: ${item.productId}`);
      continue;
    }
    if (item.quantity < 1 || item.quantity > 10) {
      errors.push(`Invalid quantity for ${product.name}: ${item.quantity} (must be 1-10)`);
      continue;
    }
    resolvedItems.push({
      product,
      quantity: item.quantity,
      subtotal: product.price * item.quantity,
    });
  }

  if (errors.length > 0) {
    return { error: errors.join("\n") };
  }

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const total = subtotal + RUNNER_BOUNTY + serviceFee;

  return {
    items: resolvedItems,
    subtotal,
    deliveryFee: RUNNER_BOUNTY,
    serviceFee,
    total,
    currency: "USD",
    usdcTotal: total,
  };
}

export const estimateOrderSchema = {
  name: "estimate_order",
  description:
    "Calculate the total cost for an order including product prices, runner bounty ($10), and service fee ($2). Returns the USDC amount to send.",
  inputSchema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "Product ID from the catalog",
            },
            quantity: {
              type: "number",
              description: "Quantity to order (1-10)",
            },
          },
          required: ["productId", "quantity"],
        },
        description: "List of items to order",
      },
    },
    required: ["items"],
  },
};
