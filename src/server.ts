#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { browseMenu } from "./tools/browse-menu.js";
import { findDispensaries } from "./tools/find-dispensaries.js";
import { parseAddressTool } from "./tools/parse-address.js";
import { estimateOrder } from "./tools/estimate-order.js";
import { placeOrder } from "./tools/place-order.js";
import { orderStatus } from "./tools/order-status.js";
import { paymentInfo } from "./tools/payment-info.js";
import { getBountyStatus } from "./lib/rentahuman-api.js";

import "dotenv/config";

const server = new McpServer({
  name: "agentweed-x402",
  version: "1.0.0",
});

server.tool(
  "browse_menu",
  "Browse the cannabis product catalog from licensed NYC dispensaries. Filter by dispensary, category, strain, or max price.",
  {
    dispensaryId: z.string().optional().describe('Filter by dispensary: "chronic-brooklyn", "green-therapy", "the-travel-agency"'),
    category: z.enum(["flower", "edible", "vape", "preroll", "concentrate"]).optional().describe("Filter by product category"),
    strain: z.enum(["indica", "sativa", "hybrid"]).optional().describe("Filter by strain type"),
    maxPrice: z.number().optional().describe("Maximum price in USD"),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(browseMenu(input), null, 2) }],
  }),
);

server.tool(
  "find_dispensaries",
  "Find licensed cannabis dispensaries that deliver to a given NYC address.",
  {
    address: z.string().describe('NYC delivery address. Example: "483 3rd Ave, Brooklyn, NY 11215"'),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(findDispensaries(input), null, 2) }],
  }),
);

server.tool(
  "parse_address",
  "Parse a delivery address from text or a Google Maps link. Validates if the address is in NYC.",
  {
    address: z.string().describe("Delivery address as text or a Google Maps link"),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(parseAddressTool(input), null, 2) }],
  }),
);

server.tool(
  "estimate_order",
  "Calculate total cost: product prices + runner bounty ($10) + service fee ($2).",
  {
    items: z.array(
      z.object({
        productId: z.string().describe("Product ID (e.g. cb-dragonfly-preroll)"),
        quantity: z.number().describe("Quantity (1-10)"),
      }),
    ).describe("Items to order"),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(estimateOrder(input), null, 2) }],
  }),
);

server.tool(
  "place_order",
  "Place a delivery order. Creates a Rent-a-Human bounty. Set autoPost: true to post it live automatically.",
  {
    items: z.array(
      z.object({
        productId: z.string().describe("Product ID from catalog"),
        quantity: z.number().describe("Quantity (1-10)"),
      }),
    ).describe("Items to order (same dispensary)"),
    deliveryAddress: z.string().describe("NYC delivery address"),
    customerName: z.string().optional().describe("Recipient name"),
    autoPost: z.boolean().optional().describe("Auto-post bounty to Rent-a-Human (requires RENTAHUMAN_API_KEY)"),
    dispensaryId: z.string().optional().describe("Override dispensary ID"),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(await placeOrder(input), null, 2) }],
  }),
);

server.tool(
  "order_status",
  "Check delivery order status.",
  {
    orderId: z.string().describe("Order ID from place_order"),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(orderStatus(input), null, 2) }],
  }),
);

server.tool(
  "track_bounty",
  "Track a Rent-a-Human bounty by ID. Shows status, applications, and completion.",
  {
    bountyId: z.string().describe("Rent-a-Human bounty ID"),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(await getBountyStatus(input.bountyId), null, 2) }],
  }),
);

server.tool(
  "get_payment_info",
  "Get USDC wallet address and payment instructions for an order.",
  {
    orderTotalUsd: z.number().describe("Total order amount in USD"),
  },
  async (input) => ({
    content: [{ type: "text", text: JSON.stringify(paymentInfo(input), null, 2) }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
