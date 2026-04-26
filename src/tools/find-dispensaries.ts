import { dispensaries } from "../data/catalog.js";
import { parseAddress, isInDeliveryZone } from "../lib/address.js";

interface FindDispensariesInput {
  address: string;
}

export function findDispensaries(input: FindDispensariesInput) {
  const parsed = parseAddress(input.address);

  if (!parsed) {
    return {
      error: "Could not parse the address. Please provide a full NYC address like: '123 Broadway, New York, NY 10001'",
      dispensaries: [],
    };
  }

  const matches = dispensaries
    .filter((d) => isInDeliveryZone(parsed, d.deliveryZones))
    .map((d) => ({
      id: d.id,
      name: d.name,
      address: d.address,
      phone: d.phone,
      hours: d.hours,
      idAtDelivery: d.idAtDelivery,
    }));

  const result: Record<string, unknown> = {
    deliveryAddress: parsed,
    matchingDispensaries: matches,
    count: matches.length,
  };

  if (matches.length === 0) {
    result.error =
      "No partner dispensaries deliver to this address. Try a different NYC address.";
  }

  return result;
}

export const findDispensariesSchema = {
  name: "find_dispensaries",
  description:
    "Find licensed cannabis dispensaries that deliver to a given NYC address.",
  inputSchema: {
    type: "object" as const,
    properties: {
      address: {
        type: "string",
        description:
          'NYC delivery address (text or Google Maps link). Example: "483 3rd Ave, Brooklyn, NY 11215"',
      },
    },
    required: ["address"],
  },
};
