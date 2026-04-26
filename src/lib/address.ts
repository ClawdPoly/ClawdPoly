import type { ParsedAddress } from "./types.js";

const NYC_BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

const BOROUGH_ZIPS: Record<string, string[]> = {
  Manhattan: ["100", "101", "102"],
  Brooklyn: ["112"],
  Queens: ["110", "111", "113", "114", "116"],
  Bronx: ["104"],
  "Staten Island": ["103"],
};

/**
 * Extract a Google Maps place URL and return the query text.
 * Supports formats:
 *   https://maps.google.com/?q=...
 *   https://www.google.com/maps/place/...
 *   https://goo.gl/maps/...
 *   https://maps.app.goo.gl/...
 */
export function extractFromMapsLink(url: string): string | null {
  try {
    const u = new URL(url);

    // ?q= parameter
    const q = u.searchParams.get("q");
    if (q) return decodeURIComponent(q);

    // /maps/place/ADDRESS/...
    const placeMatch = u.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));

    // /maps/@lat,lng — not enough info
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a raw address string (or Google Maps link) into a structured address.
 */
export function parseAddress(input: string): ParsedAddress | null {
  let raw = input.trim();

  // Check if it's a Google Maps link
  if (raw.startsWith("http")) {
    const extracted = extractFromMapsLink(raw);
    if (!extracted) return null;
    raw = extracted;
  }

  // Try to parse "Street, City, State ZIP" format
  // Also handle "Street, New York, NY 10001" or "Street, Brooklyn, NY 11201"
  const parts = raw.split(",").map((s) => s.trim());

  if (parts.length < 2) return null;

  const street = parts[0];
  let city = "New York";
  let state = "NY";
  let zip = "";
  let borough: string | undefined;

  if (parts.length >= 3) {
    // "123 Broadway, New York, NY 10001"
    city = parts[1];
    const stateZip = parts[2].trim();
    const szMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5})?$/);
    if (szMatch) {
      state = szMatch[1];
      zip = szMatch[2] || "";
    } else if (/^\d{5}$/.test(stateZip)) {
      zip = stateZip;
    } else {
      state = stateZip.replace(/\d/g, "").trim() || "NY";
      zip = stateZip.replace(/\D/g, "").trim();
    }
  } else if (parts.length === 2) {
    // "123 Broadway, 10001" or "123 Broadway, Manhattan"
    const second = parts[1].trim();
    if (/^\d{5}$/.test(second)) {
      zip = second;
    } else {
      city = second;
    }
  }

  // Detect borough from city name
  for (const b of NYC_BOROUGHS) {
    if (city.toLowerCase() === b.toLowerCase()) {
      borough = b;
      city = "New York";
      break;
    }
  }

  // Detect borough from ZIP
  if (!borough && zip) {
    const prefix = zip.substring(0, 3);
    for (const [b, prefixes] of Object.entries(BOROUGH_ZIPS)) {
      if (prefixes.includes(prefix)) {
        borough = b;
        break;
      }
    }
  }

  const formatted = [street, borough || city, `${state} ${zip}`.trim()]
    .filter(Boolean)
    .join(", ");

  return { street, city, state, zip, borough, formatted };
}

/**
 * Check if a parsed address is within NYC delivery zone.
 */
export function isInNYC(address: ParsedAddress): boolean {
  if (address.state !== "NY") return false;
  if (address.borough) return true;

  const nycCities = ["new york", "new york city", "nyc", "manhattan", "brooklyn", "queens", "bronx", "staten island"];
  if (nycCities.includes(address.city.toLowerCase())) return true;

  if (address.zip) {
    const prefix = address.zip.substring(0, 3);
    const allPrefixes = Object.values(BOROUGH_ZIPS).flat();
    return allPrefixes.includes(prefix);
  }

  return false;
}

/**
 * Check if a dispensary delivers to the given address.
 */
export function isInDeliveryZone(
  address: ParsedAddress,
  deliveryZones: string[],
): boolean {
  if (address.borough && deliveryZones.includes(address.borough)) return true;
  if (address.zip && deliveryZones.includes(address.zip)) return true;
  return false;
}
