// Central app settings. Server-side values come from environment variables.

export const TRADING_MODE = "PAPER" as const;

const staleSetting = Number(process.env.STALE_AFTER_SECONDS);

// Quotes older than this are marked stale. Falls back to 60 seconds.
export const STALE_AFTER_SECONDS =
  Number.isFinite(staleSetting) && staleSetting > 0 ? staleSetting : 60;

