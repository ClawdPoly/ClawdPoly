import { describe, it, expect } from "vitest";
import { parseAddressTool } from "../tools/parse-address.js";
import { parseAddress, extractFromMapsLink, isInNYC } from "../lib/address.js";

describe("parseAddress", () => {
  it("parses standard NYC address", () => {
    const result = parseAddress("420 Broadway, New York, NY 10012");
    expect(result).not.toBeNull();
    expect(result!.street).toBe("420 Broadway");
    expect(result!.city).toBe("New York");
    expect(result!.state).toBe("NY");
    expect(result!.zip).toBe("10012");
  });

  it("parses Brooklyn address with borough detection", () => {
    const result = parseAddress("123 Atlantic Ave, Brooklyn, NY 11201");
    expect(result).not.toBeNull();
    expect(result!.borough).toBe("Brooklyn");
    expect(result!.zip).toBe("11201");
  });

  it("parses address with just ZIP", () => {
    const result = parseAddress("789 5th Ave, 10022");
    expect(result).not.toBeNull();
    expect(result!.zip).toBe("10022");
    expect(result!.borough).toBe("Manhattan");
  });

  it("detects Manhattan from ZIP prefix 100", () => {
    const result = parseAddress("1 Times Square, New York, NY 10036");
    expect(result).not.toBeNull();
    expect(result!.borough).toBe("Manhattan");
  });

  it("detects Brooklyn from ZIP prefix 112", () => {
    const result = parseAddress("100 Montague St, Brooklyn, NY 11201");
    expect(result).not.toBeNull();
    expect(result!.borough).toBe("Brooklyn");
  });

  it("returns null for unparseable input", () => {
    expect(parseAddress("just some text")).toBeNull();
  });
});

describe("extractFromMapsLink", () => {
  it("extracts from ?q= parameter", () => {
    const result = extractFromMapsLink(
      "https://maps.google.com/?q=420+Broadway+New+York+NY",
    );
    expect(result).toBe("420 Broadway New York NY");
  });

  it("extracts from /maps/place/ path", () => {
    const result = extractFromMapsLink(
      "https://www.google.com/maps/place/420+Broadway,+New+York,+NY+10012/@40.7,-74.0",
    );
    expect(result).toContain("420 Broadway");
  });

  it("returns null for non-maps URL", () => {
    expect(extractFromMapsLink("https://example.com")).toBeNull();
  });
});

describe("isInNYC", () => {
  it("recognizes Manhattan ZIP", () => {
    const addr = parseAddress("420 Broadway, New York, NY 10012")!;
    expect(isInNYC(addr)).toBe(true);
  });

  it("recognizes Brooklyn", () => {
    const addr = parseAddress("123 Atlantic Ave, Brooklyn, NY 11201")!;
    expect(isInNYC(addr)).toBe(true);
  });

  it("rejects non-NYC address", () => {
    const addr = parseAddress("123 Main St, Los Angeles, CA 90001")!;
    expect(isInNYC(addr)).toBe(false);
  });
});

describe("parseAddressTool", () => {
  it("returns success for valid NYC address", () => {
    const result = parseAddressTool({ address: "420 Broadway, New York, NY 10012" });
    expect(result.success).toBe(true);
    expect(result.inNYC).toBe(true);
  });

  it("warns for non-NYC address", () => {
    const result = parseAddressTool({ address: "123 Main St, Chicago, IL 60601" });
    expect(result.success).toBe(true);
    expect(result.inNYC).toBe(false);
    expect(result.warning).toContain("not appear to be in NYC");
  });

  it("returns error for unparseable address", () => {
    const result = parseAddressTool({ address: "lol" });
    expect(result.success).toBe(false);
  });
});
