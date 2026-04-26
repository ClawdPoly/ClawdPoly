import { getProduct, getDispensary } from "../data/catalog.js";
import { parseAddress, isInNYC, isInDeliveryZone } from "../lib/address.js";
import { buildDeliveryBounty, buildApiPayload } from "../lib/rentahuman.js";
import { postBounty } from "../lib/rentahuman-api.js";

interface PlaceOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  deliveryAddress: string;
  dispensaryId?: string;
  customerName?: string;
  autoPost?: boolean;
}

export async function placeOrder(input: PlaceOrderInput) {
  const parsed = parseAddress(input.deliveryAddress);
  if (!parsed) {
    return { error: "Could not parse delivery address. Use format: '123 Broadway, New York, NY 10001'" };
  }
  if (!isInNYC(parsed)) {
    return { error: "Delivery is only available in New York City." };
  }

  if (!input.items || input.items.length === 0) {
    return { error: "No items in order." };
  }

  const resolvedItems: Array<{ name: string; quantity: number; unit: string; price: number; dispensaryId: string }> = [];
  for (const item of input.items) {
    const product = getProduct(item.productId);
    if (!product) return { error: `Product not found: ${item.productId}` };
    resolvedItems.push({
      name: product.name,
      quantity: item.quantity,
      unit: product.unit,
      price: product.price,
      dispensaryId: product.dispensaryId,
    });
  }

  const dispIds = [...new Set(resolvedItems.map((i) => i.dispensaryId))];
  if (dispIds.length > 1) {
    return {
      error: `Items are from multiple dispensaries (${dispIds.join(", ")}). All items must be from the same dispensary in a single order.`,
    };
  }

  const dispensaryId = input.dispensaryId || dispIds[0];
  const dispensary = getDispensary(dispensaryId);
  if (!dispensary) {
    return { error: `Dispensary not found: ${dispensaryId}` };
  }

  if (!isInDeliveryZone(parsed, dispensary.deliveryZones)) {
    return {
      error: `${dispensary.name} does not deliver to ${parsed.formatted}. Try a different dispensary or address.`,
    };
  }

  const recipientName = input.customerName || "Customer";
  const runnerBounty = parseFloat(process.env.RUNNER_BOUNTY_USD || "10");

  const bounty = buildDeliveryBounty({
    items: resolvedItems,
    dispensary: {
      name: dispensary.name,
      address: dispensary.address,
      phone: dispensary.phone,
    },
    deliveryAddress: parsed,
    recipientName,
    runnerBounty,
  });

  const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const result: Record<string, unknown> = {
    orderId,
    status: "bounty_ready",
    dispensary: {
      name: dispensary.name,
      address: dispensary.address,
      phone: dispensary.phone,
    },
    items: resolvedItems.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      price: i.price,
    })),
    deliveryAddress: parsed,
    recipientName,
    pricing: {
      itemsCost: resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0),
      cashForRunner: bounty.cashNeeded,
      runnerBounty,
      totalUSDC: bounty.totalBounty,
    },
    bounty,
  };

  // Auto-post to Rent-a-Human if API key is set and autoPost is true
  if (input.autoPost && process.env.RENTAHUMAN_API_KEY) {
    const postResult = await postBounty(bounty);
    result.status = postResult.success ? "bounty_posted" : "bounty_post_failed";
    result.rentahuman = postResult;
    if (postResult.depositUrl) {
      result.note = `Bounty posted! Pay the $${bounty.totalBounty} escrow deposit to make it live: ${postResult.depositUrl}`;
    }
  } else {
    result.apiPayload = buildApiPayload(bounty);
    result.note = [
      process.env.RENTAHUMAN_API_KEY
        ? "Set autoPost: true to automatically post to Rent-a-Human, or post manually."
        : "Set RENTAHUMAN_API_KEY in .env to auto-post bounties.",
      `Total cost: $${bounty.totalBounty} ($${bounty.cashNeeded} items + $${runnerBounty} runner fee).`,
    ].join("\n");
  }

  return result;
}

export const placeOrderSchema = {
  name: "place_order",
  description:
    "Place a cannabis delivery order. Validates items, address, and delivery zone, then creates a Rent-a-Human bounty. Set autoPost: true to post it automatically.",
  inputSchema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            productId: { type: "string", description: "Product ID from catalog" },
            quantity: { type: "number", description: "Quantity (1-10)" },
          },
          required: ["productId", "quantity"],
        },
        description: "Items to order (must all be from the same dispensary)",
      },
      deliveryAddress: {
        type: "string",
        description: "NYC delivery address (text or Google Maps link)",
      },
      customerName: {
        type: "string",
        description: "Recipient name for the delivery",
      },
      autoPost: {
        type: "boolean",
        description: "Automatically post the bounty to Rent-a-Human (requires RENTAHUMAN_API_KEY)",
      },
      dispensaryId: {
        type: "string",
        description: "Override dispensary ID (auto-detected from items if omitted)",
      },
    },
    required: ["items", "deliveryAddress"],
  },
};
