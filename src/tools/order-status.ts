interface OrderStatusInput {
  orderId: string;
}

export function orderStatus(input: OrderStatusInput) {
  if (!input.orderId) {
    return { error: "Missing orderId." };
  }

  return {
    orderId: input.orderId,
    status: "awaiting_runner",
    note: [
      "Check Rent-a-Human (rentahuman.ai) for bounty status.",
      "Statuses: posted → accepted → in_progress → completed",
      "",
      "When a runner accepts:",
      "- They will go to the dispensary and buy the items",
      "- They will deliver to the specified address",
      "- They will submit photo proof (receipt + delivery)",
      "",
      "You can also check via the Rent-a-Human MCP server:",
      "  get_orchestration({ orchestrationId: '<id>' })",
    ].join("\n"),
  };
}

export const orderStatusSchema = {
  name: "order_status",
  description:
    "Check the status of a delivery order. Returns instructions for checking the Rent-a-Human bounty status.",
  inputSchema: {
    type: "object" as const,
    properties: {
      orderId: {
        type: "string",
        description: "The order ID from place_order",
      },
    },
    required: ["orderId"],
  },
};
