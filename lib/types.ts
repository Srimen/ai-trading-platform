// Core domain types for the paper-trading prototype.
// Money and quantities are decimal strings to avoid floating-point errors.

export type Currency = "USD";

export type DataSourceType = "fixture" | "live";

export interface Quote {
  symbol: string;
  price: string; // e.g. "189.42"
  currency: Currency;
  source: string; // provider name shown to the user
  sourceType: DataSourceType;
  eventTime: string; // ISO time the provider says the price is from
  receivedAt: string; // ISO time our server received it
}

export type QuoteStatus = "fresh" | "stale" | "unavailable";

export interface WatchlistItem {
  symbol: string;
  quote: Quote | null;
  status: QuoteStatus;
  ageSeconds: number | null;
}

export interface Holding {
  symbol: string;
  quantity: string;
  costBasis: string; // total cost of the position
  currency: Currency;
}

export interface EvidenceItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedAt: string;
  retrievedAt: string;
}

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "submitted"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "rejected"
  | "unknown";

export interface OrderIntent {
  id: string;
  userId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: string;
  limitPrice?: string; // required when type is "limit"
  status: OrderStatus;
  idempotencyKey: string; // prevents duplicate paper orders on retry
  createdAt: string;
  confirmedAt?: string;
}

export interface OrderEvent {
  id: string;
  orderIntentId: string;
  status: OrderStatus;
  occurredAt: string;
  brokerOrderId?: string;
  note?: string;
}

// What the login form gets back after a sign-in or sign-up attempt
export interface AuthState {
  error: string | null;
  message: string | null;
}

// What the CSV import form gets back after an upload
export interface ImportState {
  status: "idle" | "success" | "error";
  message: string | null;
  errors: { row: number; message: string }[];
}
