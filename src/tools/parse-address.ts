import { parseAddress as parse, isInNYC } from "../lib/address.js";

interface ParseAddressInput {
  address: string;
}

export function parseAddressTool(input: ParseAddressInput) {
  const parsed = parse(input.address);

  if (!parsed) {
    return {
      success: false,
      error:
        "Could not parse the address. Accepted formats:\n" +
        '- "123 Broadway, New York, NY 10001"\n' +
        '- "456 Atlantic Ave, Brooklyn, NY 11217"\n' +
        "- Google Maps link (https://maps.google.com/?q=...)\n" +
        '- "789 5th Ave, 10022"',
    };
  }

  const inNYC = isInNYC(parsed);

  return {
    success: true,
    address: parsed,
    inNYC,
    warning: inNYC
      ? undefined
      : "This address does not appear to be in NYC. Cannabis delivery is currently only available in New York City.",
  };
}

export const parseAddressSchema = {
  name: "parse_address",
  description:
    "Parse a delivery address from text or a Google Maps link into a structured format. Validates if the address is in NYC.",
  inputSchema: {
    type: "object" as const,
    properties: {
      address: {
        type: "string",
        description:
          "Delivery address as text or a Google Maps link",
      },
    },
    required: ["address"],
  },
};
