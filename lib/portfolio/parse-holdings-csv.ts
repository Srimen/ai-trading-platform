// Parses and validates a holdings CSV file.
// Required columns: symbol, quantity, cost_basis. Optional: currency (USD only).
// This is a pure function with no database access, so every rule is unit-tested.

export interface ParsedHolding {
  symbol: string;
  quantity: string; // exact decimal string, e.g. "5.5"
  costBasis: string; // total cost with 2 decimals, e.g. "1500.00"
}

export interface RowError {
  row: number; // line number in the file; the header is row 1
  message: string;
}

export interface ParseResult {
  holdings: ParsedHolding[];
  errors: RowError[];
}

export const MAX_ROWS = 500;

type Column = "symbol" | "quantity" | "cost_basis" | "currency";

// Common header names people use, mapped to our column names
const HEADER_ALIASES: Record<string, Column> = {
  symbol: "symbol",
  ticker: "symbol",
  quantity: "quantity",
  shares: "quantity",
  qty: "quantity",
  cost_basis: "cost_basis",
  costbasis: "cost_basis",
  total_cost: "cost_basis",
  currency: "currency",
};

const SYMBOL_PATTERN = /^[A-Z]{1,5}$/;
const QUANTITY_PATTERN = /^\d+(\.\d{1,6})?$/;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

// Splits one CSV line into fields, supporting "quoted, values" and "" escapes.
// Returns null if a quote is never closed.
function splitCsvLine(line: string): string[] | null {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (inQuotes) return null;
  fields.push(current);
  return fields.map((field) => field.trim());
}

// Removes "$", thousands separators and spaces: "$1,500.00" -> "1500.00"
function cleanNumber(raw: string) {
  return raw.replace(/[$,\s]/g, "");
}

function trimZeros(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return {
    whole: whole.replace(/^0+(?=\d)/, ""),
    fraction: fraction.replace(/0+$/, ""),
  };
}

export function parseHoldingsCsv(text: string): ParseResult {
  const holdings: ParsedHolding[] = [];
  const errors: RowError[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);

  const headerIndex = lines.findIndex((line) => line.trim() !== "");
  if (headerIndex === -1) {
    return {
      holdings,
      errors: [{ row: 1, message: "The file is empty. Add a header row: symbol,quantity,cost_basis." }],
    };
  }

  const headerFields = splitCsvLine(lines[headerIndex]);
  if (!headerFields) {
    return {
      holdings,
      errors: [{ row: headerIndex + 1, message: 'The header row has an unclosed quote (").' }],
    };
  }

  const columns = headerFields.map((field) => HEADER_ALIASES[normalizeHeader(field)]);
  const columnIndex: Record<Column, number> = {
    symbol: columns.indexOf("symbol"),
    quantity: columns.indexOf("quantity"),
    cost_basis: columns.indexOf("cost_basis"),
    currency: columns.indexOf("currency"),
  };

  const required: Column[] = ["symbol", "quantity", "cost_basis"];
  const missing = required.filter((column) => columnIndex[column] === -1);
  if (missing.length > 0) {
    return {
      holdings,
      errors: [
        {
          row: headerIndex + 1,
          message: `Missing ${missing.length === 1 ? "column" : "columns"}: ${missing.join(", ")}. The header row must include symbol, quantity, and cost_basis.`,
        },
      ],
    };
  }

  const firstRowBySymbol = new Map<string, number>();
  let dataRows = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = i + 1;
    if (lines[i].trim() === "") continue;

    dataRows++;
    if (dataRows > MAX_ROWS) {
      errors.push({ row, message: `Too many rows. Import up to ${MAX_ROWS} holdings at a time.` });
      break;
    }

    const fields = splitCsvLine(lines[i]);
    if (!fields) {
      errors.push({ row, message: 'This row has an unclosed quote (").' });
      continue;
    }

    const read = (column: Column) => {
      const index = columnIndex[column];
      return index === -1 ? "" : (fields[index] ?? "");
    };
    const problems: string[] = [];

    // Symbol: "aapl" and "$AAPL" both become "AAPL"
    const rawSymbol = read("symbol");
    const symbol = rawSymbol.replace(/^\$/, "").toUpperCase();
    if (!rawSymbol) {
      problems.push("Symbol is missing.");
    } else if (!SYMBOL_PATTERN.test(symbol)) {
      problems.push(`"${rawSymbol}" isn't a valid symbol. Use 1 to 5 letters, like AAPL.`);
    }

    // Quantity: positive, up to 6 decimal places
    const rawQuantity = read("quantity");
    const quantityValue = cleanNumber(rawQuantity);
    let quantity = "";
    if (!rawQuantity) {
      problems.push("Quantity is missing.");
    } else if (!QUANTITY_PATTERN.test(quantityValue)) {
      problems.push(`Quantity "${rawQuantity}" must be a positive number with up to 6 decimal places.`);
    } else {
      const { whole, fraction } = trimZeros(quantityValue);
      quantity = fraction ? `${whole}.${fraction}` : whole;
      if (quantity === "0") problems.push("Quantity must be greater than 0.");
    }

    // Cost basis: 0 or more, up to 2 decimal places, stored with exactly 2
    const rawCost = read("cost_basis");
    const costValue = cleanNumber(rawCost);
    let costBasis = "";
    if (!rawCost) {
      problems.push("Cost basis is missing.");
    } else if (!MONEY_PATTERN.test(costValue)) {
      problems.push(
        `Cost basis "${rawCost}" must be an amount of 0 or more with up to 2 decimal places, like 1500.00.`
      );
    } else {
      const { whole } = trimZeros(costValue);
      const cents = (costValue.split(".")[1] ?? "").padEnd(2, "0");
      costBasis = `${whole}.${cents}`;
    }

    // Currency is optional, but only USD is supported
    const rawCurrency = read("currency");
    if (rawCurrency && rawCurrency.toUpperCase() !== "USD") {
      problems.push(`Currency "${rawCurrency}" isn't supported. Only USD is supported right now.`);
    }

    if (problems.length > 0) {
      errors.push({ row, message: problems.join(" ") });
      continue;
    }

    const firstRow = firstRowBySymbol.get(symbol);
    if (firstRow !== undefined) {
      errors.push({ row, message: `${symbol} already appears on row ${firstRow}. Combine them into one row.` });
      continue;
    }

    firstRowBySymbol.set(symbol, row);
    holdings.push({ symbol, quantity, costBasis });
  }

  if (dataRows === 0) {
    errors.push({ row: headerIndex + 2, message: "No holdings found below the header row." });
  }

  return { holdings, errors };
}

