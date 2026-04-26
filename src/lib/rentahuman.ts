import type { ParsedAddress } from "./types.js";

export interface DeliveryBounty {
  title: string;
  description: string;
  location: string;
  payment: number;
  estimatedDuration: string;
  evidence: string[];
  category: string;
  dispensary: {
    name: string;
    address: string;
    phone: string;
  };
  items: Array<{ name: string; quantity: number; estimatedPrice: number }>;
  deliveryAddress: string;
  recipientName: string;
  cashNeeded: number;
  totalBounty: number;
}

export function buildDeliveryBounty(opts: {
  items: Array<{ name: string; quantity: number; price: number; unit: string }>;
  dispensary: { name: string; address: string; phone: string };
  deliveryAddress: ParsedAddress;
  recipientName: string;
  runnerBounty: number;
}): DeliveryBounty {
  const itemsCost = opts.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const cashNeeded = Math.ceil(itemsCost * 1.09); // ~9% tax buffer
  const totalBounty = cashNeeded + opts.runnerBounty;

  const itemsList = opts.items
    .map((i) => `  - ${i.quantity}x ${i.name} (${i.unit}) — ~$${i.price}`)
    .join("\n");

  const neighborhood = opts.deliveryAddress.borough || "NYC";

  const description = `Cannabis Pickup & Delivery — ${neighborhood}

WHAT: Go to a licensed dispensary, buy the items below with cash, and deliver them.

DISPENSARY:
  ${opts.dispensary.name}
  ${opts.dispensary.address}
  ${opts.dispensary.phone}

ITEMS TO BUY:
${itemsList}

ESTIMATED COST: ~$${itemsCost} + tax (you'll be reimbursed $${cashNeeded})

DELIVER TO:
  ${opts.deliveryAddress.formatted}
  Recipient: ${opts.recipientName}
  Note: Recipient will present valid government ID at delivery.

INSTRUCTIONS:
1. Go to the dispensary (walk-in or call ahead)
2. Purchase the items listed above with cash
3. Get a receipt
4. Deliver to the address above
5. Hand off the items — recipient shows ID
6. Take a photo of the receipt as proof

REIMBURSEMENT: $${cashNeeded} for the purchase + $${opts.runnerBounty} runner fee = $${totalBounty} total on completion.`;

  return {
    title: `420 Delivery — ${opts.dispensary.name} → ${neighborhood}`,
    description,
    location: `${neighborhood}, NY`,
    payment: totalBounty,
    estimatedDuration: "1-2 hours",
    evidence: [
      "Photo of dispensary receipt",
      "Photo or confirmation of delivery handoff",
    ],
    category: "delivery-errands",
    dispensary: opts.dispensary,
    items: opts.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      estimatedPrice: i.price,
    })),
    deliveryAddress: opts.deliveryAddress.formatted,
    recipientName: opts.recipientName,
    cashNeeded,
    totalBounty,
  };
}

/**
 * Build the Rent-a-Human API payload from a bounty.
 */
export function buildApiPayload(bounty: DeliveryBounty, deadline?: string) {
  return {
    title: bounty.title,
    description: bounty.description,
    requirements: [
      "Must be 21+ with valid ID",
      "Must be in the NYC area",
      "Must be able to visit dispensary in person",
    ],
    skillsNeeded: ["delivery", "errands", "NYC local"],
    category: "delivery-errands",
    location: {
      city: "Brooklyn",
      state: "New York",
      country: "US",
      isRemoteAllowed: false,
    },
    deadline: deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    estimatedHours: 2,
    estimatedDurationUnit: "hours",
    priceType: "fixed",
    price: bounty.totalBounty,
    currency: "USD",
    fundingMethod: "escrow",
    spotsAvailable: 1,
    completionCriteria: `Purchased items from ${bounty.dispensary.name} and delivered to ${bounty.deliveryAddress}. Recipient confirmed delivery with valid 21+ ID.`,
    evidenceTypes: ["photo", "text"],
    evidenceCriteria: bounty.evidence.join("\n"),
  };
}
