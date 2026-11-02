import { describe, expect, it } from "vitest";
import { getQuoteStatus } from "./staleness";
import { STALE_AFTER_SECONDS } from "@/lib/config";
import type { Quote } from "@/lib/types";

const NOW = new Date("2026-11-02T15:00:00.000Z");

function quoteAt(secondsAgo: number): Quote {
  return {
    symbol: "TEST",
    price: "100.00",
    currency: "USD",
    source: "Test fixture",
    sourceType: "fixture",
    eventTime: new Date(NOW.getTime() - secondsAgo * 1000).toISOString(),
    receivedAt: NOW.toISOString(),
  };
}

describe("getQuoteStatus", () => {
  it("marks a recent quote as fresh", () => {
    expect(getQuoteStatus(quoteAt(5), NOW)).toEqual({ status: "fresh", ageSeconds: 5 });
  });

  it("treats a quote exactly at the limit as fresh", () => {
    expect(getQuoteStatus(quoteAt(STALE_AFTER_SECONDS), NOW).status).toBe("fresh");
  });

  it("marks a quote past the limit as stale", () => {
    const age = STALE_AFTER_SECONDS + 1;
    expect(getQuoteStatus(quoteAt(age), NOW)).toEqual({ status: "stale", ageSeconds: age });
  });

  it("marks a missing quote as unavailable", () => {
    expect(getQuoteStatus(null, NOW)).toEqual({ status: "unavailable", ageSeconds: null });
  });

  it("marks a quote with a bad timestamp as unavailable", () => {
    const broken = { ...quoteAt(0), eventTime: "not-a-date" };
    expect(getQuoteStatus(broken, NOW).status).toBe("unavailable");
  });

  it("never reports a negative age for quotes timestamped in the future", () => {
    expect(getQuoteStatus(quoteAt(-30), NOW)).toEqual({ status: "fresh", ageSeconds: 0 });
  });
});

