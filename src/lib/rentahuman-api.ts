import type { DeliveryBounty } from "./rentahuman.js";
import { buildApiPayload } from "./rentahuman.js";

export interface PostBountyResult {
  success: boolean;
  bountyId?: string;
  bountyUrl?: string;
  depositUrl?: string;
  status?: string;
  error?: string;
}

/**
 * Post a bounty to the Rent-a-Human API.
 * Requires RENTAHUMAN_API_KEY env var.
 */
export async function postBounty(bounty: DeliveryBounty): Promise<PostBountyResult> {
  const apiKey = process.env.RENTAHUMAN_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "RENTAHUMAN_API_KEY not set. Get one at rentahuman.ai/account",
    };
  }

  const payload = buildApiPayload(bounty);

  const res = await fetch("https://rentahuman.ai/api/bounties", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json() as Record<string, unknown>;

  if (!data.success) {
    return {
      success: false,
      error: (data.error as string) || "Unknown error from Rent-a-Human API",
    };
  }

  const bountyData = data.bounty as Record<string, unknown> | undefined;
  const bountyId = bountyData?.id as string | undefined;

  return {
    success: true,
    bountyId,
    bountyUrl: bountyId ? `https://rentahuman.ai/bounties/${bountyId}` : undefined,
    depositUrl: data.deposit_url as string | undefined,
    status: bountyData?.status as string || "pending_deposit",
  };
}

/**
 * Check bounty status via the Rent-a-Human API.
 */
export async function getBountyStatus(bountyId: string) {
  const apiKey = process.env.RENTAHUMAN_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RENTAHUMAN_API_KEY not set" };
  }

  const res = await fetch(`https://rentahuman.ai/api/bounties/${bountyId}`, {
    headers: { "x-api-key": apiKey },
  });

  return await res.json();
}
