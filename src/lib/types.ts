export interface Product {
  id: string;
  name: string;
  category: "flower" | "edible" | "vape" | "preroll" | "concentrate";
  strain?: "indica" | "sativa" | "hybrid";
  thc: string;
  price: number;
  unit: string;
  dispensaryId: string;
  description: string;
}

export interface Dispensary {
  id: string;
  name: string;
  phone: string;
  address: string;
  deliveryZones: string[];
  hours: string;
  acceptsCard: boolean;
  idAtDelivery: boolean;
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  borough?: string;
  formatted: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface OrderEstimate {
  items: Array<{ product: Product; quantity: number; subtotal: number }>;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  currency: "USD";
  usdcTotal: number;
}

export interface PlacedOrder {
  orderId: string;
  dispensary: Dispensary;
  items: OrderItem[];
  deliveryAddress: ParsedAddress;
  estimatedTotal: number;
  status: "bounty_ready" | "posted" | "accepted" | "completed" | "failed";
  bountyId?: string;
  bountyUrl?: string;
}
