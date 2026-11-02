import { STALE_AFTER_SECONDS } from "@/lib/config";
import type { Quote, QuoteStatus } from "@/lib/types";

export function getQuoteStatus(
  quote: Quote | null,
  now: Date = new Date()
): { status: QuoteStatus; ageSeconds: number | null } {
  if (!quote) return { status: "unavailable", ageSeconds: null };

  const eventMs = Date.parse(quote.eventTime);
  if (Number.isNaN(eventMs)) return { status: "unavailable", ageSeconds: null };

  const ageSeconds = Math.max(0, Math.round((now.getTime() - eventMs) / 1000));
  return {
    status: ageSeconds > STALE_AFTER_SECONDS ? "stale" : "fresh",
    ageSeconds,
  };
} 

