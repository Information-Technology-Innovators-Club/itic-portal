/**
 * Darkens/lightens a hex color by `percent` (-100..100) for a gradient's second stop.
 * Accepts 3-digit (#rgb) or 6-digit (#rrggbb) hex, with or without the leading `#`.
 * Falls back to the original input if it isn't a valid hex color.
 */
export function shade(hex: string, percent: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;

  const num = parseInt(normalized, 16);
  const amt = Math.round(2.55 * percent);

  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0x00ff) + amt);
  const b = clamp((num & 0x0000ff) + amt);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function clamp(value: number): number {
  return Math.min(255, Math.max(0, value));
}

/** Expands #rgb to #rrggbb and strips `#`; returns null if invalid. */
export function normalizeHex(hex: string): string | null {
  const stripped = hex.replace("#", "").trim();

  if (/^[0-9a-fA-F]{3}$/.test(stripped)) {
    return stripped
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (/^[0-9a-fA-F]{6}$/.test(stripped)) {
    return stripped;
  }

  return null;
}
