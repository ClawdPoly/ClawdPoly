import type { Product, Dispensary } from "../lib/types.js";

export const dispensaries: Dispensary[] = [
  {
    id: "chronic-brooklyn",
    name: "Chronic Brooklyn",
    phone: "+17185763423",
    address: "483 3rd Ave, Brooklyn, NY 11215",
    deliveryZones: [
      "Brooklyn",
      "11201", "11205", "11206", "11211", "11215", "11216", "11217",
      "11220", "11225", "11226", "11231", "11232", "11233", "11238",
    ],
    hours: "Mon-Wed 11am-8pm, Thu-Sat 11am-9pm, Sun 11am-7pm",
    acceptsCard: false,
    idAtDelivery: true,
  },
  {
    id: "green-therapy",
    name: "Green Therapy NYC",
    phone: "+15167103419",
    address: "Brooklyn, NY",
    deliveryZones: [
      "Brooklyn", "Manhattan", "Queens", "Bronx",
      "11201", "11205", "11206", "11211", "11215", "11216", "11217",
      "11220", "11225", "11226", "11231", "11232", "11233", "11238",
      "10001", "10002", "10003", "10009", "10010", "10011", "10012",
      "10013", "10014", "10016", "10017", "10018", "10019",
    ],
    hours: "Mon-Fri 11am-11pm",
    acceptsCard: false,
    idAtDelivery: true,
  },
  {
    id: "the-travel-agency",
    name: "The Travel Agency",
    phone: "+17184001420",
    address: "253 Flatbush Ave, Brooklyn, NY 11217",
    deliveryZones: [
      "Brooklyn", "Manhattan",
      "11201", "11205", "11215", "11217", "11231",
      "10001", "10002", "10003", "10011", "10012", "10014",
    ],
    hours: "10am-midnight daily",
    acceptsCard: false,
    idAtDelivery: true,
  },
];

export const products: Product[] = [
  // Chronic Brooklyn — real products from website scrape
  {
    id: "cb-hashtag-honey-preroll",
    name: "Hashtag Honey Pre-Roll",
    category: "preroll",
    strain: "hybrid",
    thc: "20%",
    price: 8,
    unit: "1g",
    dispensaryId: "chronic-brooklyn",
    description: "Classic pre-roll. Smooth smoke, great for a quick session. 2 for $15 deal available.",
  },
  {
    id: "cb-dragonfly-preroll",
    name: "Dragonfly Pre-Roll",
    category: "preroll",
    strain: "sativa",
    thc: "18%",
    price: 7,
    unit: "0.5g",
    dispensaryId: "chronic-brooklyn",
    description: "Light sativa pre-roll. Uplifting and clean. 3 for $21 deal available.",
  },
  {
    id: "cb-lil-lefties-preroll",
    name: "Lil Lefties Pre-Roll",
    category: "preroll",
    strain: "hybrid",
    thc: "22%",
    price: 7,
    unit: "0.5g",
    dispensaryId: "chronic-brooklyn",
    description: "Compact pre-roll, surprisingly potent. 3 for $21 deal.",
  },
  {
    id: "cb-lil-lefties-infused",
    name: "Lil Lefties Infused Pre-Roll",
    category: "preroll",
    strain: "hybrid",
    thc: "35%",
    price: 10,
    unit: "0.5g",
    dispensaryId: "chronic-brooklyn",
    description: "Infused with concentrate for extra potency. 3 for $30 deal.",
  },
  {
    id: "cb-breakfast-conn-preroll",
    name: "Breakfast Conn Pre-Roll",
    category: "preroll",
    strain: "sativa",
    thc: "20%",
    price: 9,
    unit: "0.75g",
    dispensaryId: "chronic-brooklyn",
    description: "Morning wake-and-bake pick. 3 for $25 deal.",
  },
  {
    id: "cb-golden-garden-preroll",
    name: "Golden Garden Pre-Roll",
    category: "preroll",
    strain: "hybrid",
    thc: "19%",
    price: 11,
    unit: "1g",
    dispensaryId: "chronic-brooklyn",
    description: "Included free with many flower bundle deals.",
  },
  {
    id: "cb-minny-grown-gummies",
    name: "Minny Grown Gummies",
    category: "edible",
    thc: "100mg",
    price: 15,
    unit: "10pk",
    dispensaryId: "chronic-brooklyn",
    description: "Budget-friendly gummies. 2 for $30 deal. 10mg per piece.",
  },
  {
    id: "cb-hashtag-honey-gummies",
    name: "Hashtag Honey Gummies",
    category: "edible",
    thc: "100mg",
    price: 13,
    unit: "10pk",
    dispensaryId: "chronic-brooklyn",
    description: "Sweet honey-flavored gummies. 2 for $25 deal.",
  },
  {
    id: "cb-dank-amnesia-haze",
    name: "Dank Amnesia Haze 3.5g",
    category: "flower",
    strain: "sativa",
    thc: "22%",
    price: 31,
    unit: "3.5g",
    dispensaryId: "chronic-brooklyn",
    description: "Budget sativa eighth + free Golden Garden pre-roll. Energizing cerebral high.",
  },
  {
    id: "cb-rolling-green-white-choc",
    name: "Rolling Green White Chocolate Chip 3.5g",
    category: "flower",
    strain: "hybrid",
    thc: "24%",
    price: 37,
    unit: "3.5g",
    dispensaryId: "chronic-brooklyn",
    description: "Dessert strain + free pre-roll. Sweet vanilla aroma, balanced effects.",
  },

  // Green Therapy NYC — real products from website scrape
  {
    id: "gt-loud-gummies",
    name: "LOUD THC Gummies 500mg",
    category: "edible",
    thc: "500mg",
    price: 20,
    unit: "1pk",
    dispensaryId: "green-therapy",
    description: "Monster gummies. On sale from $25. Multiple flavors.",
  },
  {
    id: "gt-sugar-high-gummies",
    name: "Sugar High Gummies 500mg",
    category: "edible",
    thc: "500mg",
    price: 25,
    unit: "1pk",
    dispensaryId: "green-therapy",
    description: "Hot item. On sale from $30.",
  },
  {
    id: "gt-loud-chocolate",
    name: "LOUD Chocolate 500mg",
    category: "edible",
    thc: "500mg",
    price: 25,
    unit: "1 bar",
    dispensaryId: "green-therapy",
    description: "Handcrafted premium liquid diamond chocolate. On sale from $35.",
  },
  {
    id: "gt-punch-bar",
    name: "Punch Bar Extreme 1000mg",
    category: "edible",
    thc: "1000mg",
    price: 30,
    unit: "1 bar",
    dispensaryId: "green-therapy",
    description: "Heavy hitter chocolate bar. On sale from $40.",
  },
  {
    id: "gt-burst-gummies",
    name: "Burst by Sauce Live Resin Gummies 800mg",
    category: "edible",
    thc: "800mg",
    price: 30,
    unit: "1pk",
    dispensaryId: "green-therapy",
    description: "Live resin infused. Spring sale from $50.",
  },
  {
    id: "gt-puff-la-gummies",
    name: "Puff LA Hash Rosin Gummies 500mg",
    category: "edible",
    thc: "500mg",
    price: 25,
    unit: "1pk",
    dispensaryId: "green-therapy",
    description: "Liquid diamond hash rosin gummies.",
  },
];

export function getDispensary(id: string): Dispensary | undefined {
  return dispensaries.find((d) => d.id === id);
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByDispensary(dispensaryId: string): Product[] {
  return products.filter((p) => p.dispensaryId === dispensaryId);
}

export function getProductsByCategory(
  category: Product["category"],
): Product[] {
  return products.filter((p) => p.category === category);
}
