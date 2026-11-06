import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAlpacaAdapter } from "./alpaca-adapter";

const adapter = createAlpacaAdapter("test-key-id", "test-secret");

function mockFetch(response: Response | Error) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
}

describe("createAlpacaAdapter", () => {
  beforeEach(() => {
    // Keep expected error logs out of the test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("turns the latest trade into a quote with its source and trade time", async () => {
    mockFetch(
      new Response(JSON.stringify({ symbol: "AAPL", trade: { t: "2026-11-06T15:30:00.123456789Z", p: 189.42 } }), {
        status: 200,
      })
    );

    const quote = await adapter.getQuote("AAPL");

    expect(quote).toMatchObject({
      symbol: "AAPL",
      price: "189.42",
      currency: "USD",
      source: "Alpaca (IEX)",
      sourceType: "live",
      eventTime: "2026-11-06T15:30:00.123Z",
    });
  });

  it("sends the API keys as headers and asks for the free IEX feed", async () => {
    const fetchSpy = mockFetch(new Response(JSON.stringify({ trade: { t: "2026-11-06T15:30:00Z", p: 1 } })));

    await adapter.getQuote("MSFT");

    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://data.alpaca.markets/v2/stocks/MSFT/trades/latest?feed=iex");
    expect(options?.headers).toMatchObject({
      "APCA-API-KEY-ID": "test-key-id",
      "APCA-API-SECRET-KEY": "test-secret",
    });
  });

  it("returns null when Alpaca rejects the request", async () => {
    mockFetch(new Response("forbidden", { status: 403 }));
    expect(await adapter.getQuote("AAPL")).toBeNull();
  });

  it("returns null when the response has no trade", async () => {
    mockFetch(new Response(JSON.stringify({ symbol: "ZZZZ" }), { status: 200 }));
    expect(await adapter.getQuote("ZZZZ")).toBeNull();
  });

  it("returns null on a network error or timeout", async () => {
    mockFetch(new Error("network down"));
    expect(await adapter.getQuote("AAPL")).toBeNull();
  });
});

