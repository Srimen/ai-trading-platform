// Display helpers for decimal strings. Values are never converted to JavaScript
// numbers, so the exact decimals from the calculation engines are what users see.

// "6416.7" -> "6,416.7", "-1283.34" -> "-1,283.34"
export function withCommas(value: string) {
  const negative = value.startsWith("-");
  const [whole, fraction] = value.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${fraction ? `.${fraction}` : ""}`;
}

export function isZero(value: string) {
  return /^-?0(\.0+)?$/.test(value);
}

// Adds a "+" to positive values: "394.20" -> "+394.20"
export function signed(value: string) {
  return value.startsWith("-") || isZero(value) ? withCommas(value) : `+${withCommas(value)}`;
}

// Green for gains, red for losses, gray for zero or missing
export function pnlClass(value: string | null) {
  if (!value || isZero(value)) return "text-muted";
  return value.startsWith("-") ? "text-danger" : "text-fresh";
}

// "2026-11-06T15:00:00.000Z" -> "2026-11-06 at 15:00:00 UTC"
export function formatUtc(iso: string) {
  return `${iso.slice(0, 10)} at ${iso.slice(11, 19)} UTC`;
}

