import { describe, it, expect } from "vitest";
import { browseMenu } from "../tools/browse-menu.js";

describe("browse_menu", () => {
  it("returns all products when no filters", () => {
    const result = browseMenu({});
    expect(result.totalProducts).toBeGreaterThan(0);
    expect(result.dispensaryCount).toBeGreaterThanOrEqual(2);
    expect(result.menu).toContain("Chronic Brooklyn");
    expect(result.menu).toContain("Green Therapy");
  });

  it("filters by dispensary", () => {
    const result = browseMenu({ dispensaryId: "chronic-brooklyn" });
    expect(result.dispensaryCount).toBe(1);
    expect(result.menu).toContain("Chronic Brooklyn");
    expect(result.menu).not.toContain("Green Therapy");
  });

  it("filters by category", () => {
    const result = browseMenu({ category: "preroll" });
    expect(result.totalProducts).toBeGreaterThan(0);
  });

  it("filters by strain", () => {
    const result = browseMenu({ strain: "sativa" });
    expect(result.totalProducts).toBeGreaterThan(0);
    expect(result.menu).toContain("[sativa]");
  });

  it("filters by max price", () => {
    const result = browseMenu({ maxPrice: 10 });
    expect(result.totalProducts).toBeGreaterThan(0);
  });

  it("combines filters", () => {
    const result = browseMenu({ category: "preroll", dispensaryId: "chronic-brooklyn" });
    expect(result.totalProducts).toBeGreaterThan(0);
    expect(result.menu).toContain("Chronic Brooklyn");
  });
});
