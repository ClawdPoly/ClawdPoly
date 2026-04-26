import {
  products,
  dispensaries,
  getProductsByDispensary,
  getProductsByCategory,
} from "../data/catalog.js";
import type { Product } from "../lib/types.js";

interface BrowseMenuInput {
  dispensaryId?: string;
  category?: Product["category"];
  strain?: Product["strain"];
  maxPrice?: number;
}

export function browseMenu(input: BrowseMenuInput = {}) {
  let filtered = [...products];

  if (input.dispensaryId) {
    filtered = getProductsByDispensary(input.dispensaryId);
  }

  if (input.category) {
    filtered = filtered.filter((p) => p.category === input.category);
  }

  if (input.strain) {
    filtered = filtered.filter((p) => p.strain === input.strain);
  }

  if (input.maxPrice) {
    filtered = filtered.filter((p) => p.price <= input.maxPrice!);
  }

  const grouped = new Map<string, Product[]>();
  for (const product of filtered) {
    const existing = grouped.get(product.dispensaryId) || [];
    existing.push(product);
    grouped.set(product.dispensaryId, existing);
  }

  const sections: string[] = [];

  for (const [dispId, items] of grouped) {
    const disp = dispensaries.find((d) => d.id === dispId);
    if (!disp) continue;

    const lines = [
      `## ${disp.name}`,
      `${disp.address} | ${disp.hours}`,
      `ID required at delivery: ${disp.idAtDelivery ? "Yes (21+)" : "No"}`,
      "",
    ];

    for (const item of items) {
      const strainTag = item.strain ? ` [${item.strain}]` : "";
      lines.push(
        `- **${item.name}**${strainTag} — $${item.price} / ${item.unit}`,
      );
      lines.push(`  THC: ${item.thc} | ${item.description}`);
      lines.push(`  ID: \`${item.id}\``);
    }

    sections.push(lines.join("\n"));
  }

  return {
    totalProducts: filtered.length,
    dispensaryCount: grouped.size,
    menu: sections.join("\n\n"),
    filters: {
      dispensaryId: input.dispensaryId || "all",
      category: input.category || "all",
      strain: input.strain || "all",
      maxPrice: input.maxPrice || "none",
    },
  };
}

export const browseMenuSchema = {
  name: "browse_menu",
  description:
    "Browse the cannabis product catalog from licensed NYC dispensaries. Filter by dispensary, category, strain, or max price.",
  inputSchema: {
    type: "object" as const,
    properties: {
      dispensaryId: {
        type: "string",
        description:
          'Filter by dispensary ID: "housing-works", "the-green-room", "smacked-village"',
      },
      category: {
        type: "string",
        enum: ["flower", "edible", "vape", "preroll", "concentrate"],
        description: "Filter by product category",
      },
      strain: {
        type: "string",
        enum: ["indica", "sativa", "hybrid"],
        description: "Filter by strain type",
      },
      maxPrice: {
        type: "number",
        description: "Maximum price in USD",
      },
    },
  },
};
