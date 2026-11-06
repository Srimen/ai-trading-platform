import { describe, expect, it } from "vitest";
import { MAX_ROWS, parseHoldingsCsv } from "./parse-holdings-csv";

const HEADER = "symbol,quantity,cost_basis";
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");

// 0 -> A, 25 -> Z, 26 -> AA, ... gives unique symbols for the row-limit test
function toSymbol(n: number) {
  let symbol = "";
  let value = n + 1;
  while (value > 0) {
    value--;
    symbol = String.fromCharCode(65 + (value % 26)) + symbol;
    value = Math.floor(value / 26);
  }
  return symbol;
}

describe("parseHoldingsCsv", () => {
  it("parses a valid file and normalizes values", () => {
    const result = parseHoldingsCsv(csv("aapl,10,1500", "MSFT,5.50,1800.5"));
    expect(result.errors).toEqual([]);
    expect(result.holdings).toEqual([
      { symbol: "AAPL", quantity: "10", costBasis: "1500.00" },
      { symbol: "MSFT", quantity: "5.5", costBasis: "1800.50" },
    ]);
  });

  it("handles a byte-order mark, Windows line endings, blank lines, and common header names", () => {
    const text = '\uFEFFTicker,Shares,Cost Basis\r\n$AAPL,10,"$1,500.00"\r\n\r\nMSFT,2,300\r\n';
    const result = parseHoldingsCsv(text);
    expect(result.errors).toEqual([]);
    expect(result.holdings.map((h) => h.symbol)).toEqual(["AAPL", "MSFT"]);
    expect(result.holdings[0].costBasis).toBe("1500.00");
  });

  it("reports each invalid row with its row number", () => {
    const result = parseHoldingsCsv(
      csv("AAPL,10,1500", "BRK.B,1,100", "MSFT,0,100", "TSLA,1.1234567,100", "NVDA,2,12.345")
    );
    expect(result.errors.map((e) => e.row)).toEqual([3, 4, 5, 6]);
    expect(result.errors[0].message).toContain("isn't a valid symbol");
    expect(result.errors[1].message).toContain("greater than 0");
    expect(result.errors[2].message).toContain("6 decimal places");
    expect(result.errors[3].message).toContain("2 decimal places");
    expect(result.holdings.map((h) => h.symbol)).toEqual(["AAPL"]);
  });

  it("lists every problem in a row together", () => {
    const [error] = parseHoldingsCsv(csv("AMZN,-1,-5")).errors;
    expect(error.row).toBe(2);
    expect(error.message).toContain("Quantity");
    expect(error.message).toContain("Cost basis");
  });

  it("reports missing values", () => {
    const [error] = parseHoldingsCsv(csv("AAPL,1")).errors;
    expect(error.message).toContain("Cost basis is missing");
  });

  it("rejects duplicate symbols", () => {
    const result = parseHoldingsCsv(csv("AAPL,1,10", "MSFT,1,10", "aapl,2,20"));
    expect(result.errors).toEqual([
      { row: 4, message: "AAPL already appears on row 2. Combine them into one row." },
    ]);
  });

  it("accepts USD and rejects other currencies", () => {
    const result = parseHoldingsCsv(
      ["symbol,quantity,cost_basis,currency", "AAPL,1,10,usd", "MSFT,1,10,CAD"].join("\n")
    );
    expect(result.holdings.map((h) => h.symbol)).toEqual(["AAPL"]);
    expect(result.errors[0].row).toBe(3);
    expect(result.errors[0].message).toContain("Only USD");
  });

  it("requires the symbol, quantity, and cost_basis columns", () => {
    const result = parseHoldingsCsv("symbol,quantity\nAAPL,1");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].message).toContain("cost_basis");
  });

  it("explains an empty file and a file with only a header", () => {
    expect(parseHoldingsCsv("  \n").errors[0].message).toContain("empty");
    expect(parseHoldingsCsv(`${HEADER}\n`).errors[0].message).toContain("No holdings found");
  });

  it("reports an unclosed quote", () => {
    const [error] = parseHoldingsCsv(csv('AAPL,1,"100')).errors;
    expect(error.row).toBe(2);
    expect(error.message).toContain("unclosed quote");
  });

  it(`stops after ${MAX_ROWS} rows`, () => {
    const rows = Array.from({ length: MAX_ROWS + 1 }, (_, i) => `${toSymbol(i)},1,10`);
    const result = parseHoldingsCsv(csv(...rows));
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Too many rows");
  });
});

