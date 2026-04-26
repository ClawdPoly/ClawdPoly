import { describe, it, expect } from "vitest";
import { placeOrder } from "../tools/place-order.js";
import { estimateOrder } from "../tools/estimate-order.js";

describe("estimateOrder", () => {
  it("calculates correct total with runner bounty", () => {
    const result = estimateOrder({
      items: [{ productId: "cb-dragonfly-preroll", quantity: 1 }],
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.subtotal).toBe(7);
      expect(result.deliveryFee).toBe(10); // runner bounty
      expect(result.serviceFee).toBe(2);
      expect(result.total).toBe(19);
      expect(result.currency).toBe("USD");
    }
  });

  it("rejects empty items", () => {
    const result = estimateOrder({ items: [] });
    expect("error" in result).toBe(true);
  });

  it("rejects unknown product", () => {
    const result = estimateOrder({
      items: [{ productId: "fake-product", quantity: 1 }],
    });
    expect("error" in result).toBe(true);
  });

  it("rejects invalid quantity", () => {
    const result = estimateOrder({
      items: [{ productId: "cb-dragonfly-preroll", quantity: 0 }],
    });
    expect("error" in result).toBe(true);
  });
});

describe("placeOrder", () => {
  it("creates bounty for valid Brooklyn order", async () => {
    const result = await placeOrder({
      items: [{ productId: "cb-dragonfly-preroll", quantity: 1 }],
      deliveryAddress: "483 3rd Ave, Brooklyn, NY 11215",
      customerName: "Test User",
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.status).toBe("bounty_ready");
      expect(result.dispensary.name).toBe("Chronic Brooklyn");
      expect(result.recipientName).toBe("Test User");
      expect(result.bounty.title).toContain("420");
      expect(result.bounty.description).toContain("483 3rd Ave");
      expect(result.bounty.description).toContain("Dragonfly Pre-Roll");
      expect(result.bounty.payment).toBeGreaterThan(0);
    }
  });

  it("rejects non-NYC address", async () => {
    const result = await placeOrder({
      items: [{ productId: "cb-dragonfly-preroll", quantity: 1 }],
      deliveryAddress: "123 Main St, Los Angeles, CA 90001",
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("New York City");
    }
  });

  it("rejects items from multiple dispensaries", async () => {
    const result = await placeOrder({
      items: [
        { productId: "cb-dragonfly-preroll", quantity: 1 },
        { productId: "gt-loud-gummies", quantity: 1 },
      ],
      deliveryAddress: "483 3rd Ave, Brooklyn, NY 11215",
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("multiple dispensaries");
    }
  });

  it("rejects unknown product", async () => {
    const result = await placeOrder({
      items: [{ productId: "nonexistent", quantity: 1 }],
      deliveryAddress: "483 3rd Ave, Brooklyn, NY 11215",
    });
    expect("error" in result).toBe(true);
  });
});
