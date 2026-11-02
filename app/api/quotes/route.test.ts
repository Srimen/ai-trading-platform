import { describe, expect, it } from "vitest";
import { GET } from "./route";

async function callQuotes(query = "") {
  const res = await GET(new Request(`http://localhost/api/quotes${query}`));
  return { status: res.status, body: await res.json() };
}

describe("GET /api/quotes", () => {
  it("returns the default watchlist", async () => {
    const { status, body } = await callQuotes();
    expect(status).toBe(200);
    expect(body.items.map((i: { symbol: string }) => i.symbol)).toEqual([
      "AAPL",
      "MSFT",
      "NVDA",
      "TSLA",
    ]);
  });

  it("gives every quote a source and a price time", async () => {
    const { body } = await callQuotes();
    for (const item of body.items) {
      if (item.quote) {
        expect(item.quote.source).toBeTruthy();
        expect(item.quote.eventTime).toBeTruthy();
      }
    }
  });

  it("marks fixture quotes as fresh, stale, or unavailable", async () => {
    const { body } = await callQuotes();
    const statusOf = (symbol: string) =>
      body.items.find((i: { symbol: string }) => i.symbol === symbol).status;

    expect(statusOf("AAPL")).toBe("fresh");
    expect(statusOf("NVDA")).toBe("stale");
    expect(statusOf("TSLA")).toBe("unavailable");
  });

  it("accepts lowercase symbols", async () => {
    const { status, body } = await callQuotes("?symbols=aapl,msft");
    expect(status).toBe(200);
    expect(body.items.map((i: { symbol: string }) => i.symbol)).toEqual(["AAPL", "MSFT"]);
  });

  it("rejects invalid symbols", async () => {
    const { status, body } = await callQuotes("?symbols=aapl!");
    expect(status).toBe(400);
    expect(body.error).toContain("AAPL!");
  });

  it("rejects more than 20 symbols", async () => {
    const tooMany = Array(21).fill("AAPL").join(",");
    const { status } = await callQuotes(`?symbols=${tooMany}`);
    expect(status).toBe(400);
  });
});

