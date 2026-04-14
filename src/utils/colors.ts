/**
 * colors.ts
 *
 * Pure colour-utility functions shared across the extension.
 * No VS Code API usage here — these run in the extension host only and are
 * also mirrored in the webview JS so that both sides stay in sync.
 */

// ── Conversion helpers ────────────────────────────────────────────────────────

/**
 * Parse a six-digit hex colour string into its R, G, B components.
 * Returns null if the string is not a valid hex colour.
 *
 * Example: hexToRgb('#61dafb') → { r: 97, g: 218, b: 251 }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) { return null; }
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

/**
 * Convert R, G, B integer components (0–255) back to a hex colour string.
 *
 * Example: rgbToHex(97, 218, 251) → '#61dafb'
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ── Interpolation ─────────────────────────────────────────────────────────────

/**
 * Linearly interpolate between two hex colours.
 *
 * `t = 0` returns `hexA`, `t = 1` returns `hexB`.
 * Used by the theme animator to produce smooth cross-fades between palettes.
 *
 * If either colour string is unparseable, `hexA` is returned unchanged so
 * that a bad palette entry never causes a crash.
 */
export function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) { return hexA; }

  const r  = Math.round(a.r + (b.r - a.r) * t);
  const g  = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex(r, g, bl);
}

// ── CSS helpers ───────────────────────────────────────────────────────────────

/**
 * Build an `rgba()` CSS value from a hex colour and an opacity between 0–1.
 *
 * Used wherever we need a translucent version of an accent colour — for
 * example, selection highlights and canvas gradients.
 *
 * Example: hexWithAlpha('#00ff88', 0.15) → 'rgba(0, 255, 136, 0.15)'
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) { return hex; }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// ── File-extension accent mapping ─────────────────────────────────────────────

/**
 * Derive a hue-shifted accent colour from a file extension.
 *
 * Each language gets a slight hue rotation so switching between a `.ts` and
 * a `.css` file produces a visible colour change in the panel without the
 * user having to configure anything.
 *
 * The hue rotation is a rough approximation — we channel-cycle the RGB
 * components rather than converting to HSL — which is fast and good enough
 * for decorative use.  Do not rely on this for colour-accurate work.
 */
export function accentFromExtension(ext: string, baseHex: string): string {
  // Map of extension → hue-shift degrees (0–360).
  // Extensions not listed here get a shift of 0 (the base colour unchanged).
  const HUE_SHIFTS: Record<string, number> = {
    ts:   0,
    tsx:  20,
    js:   40,
    jsx:  60,
    json: 80,
    css:  120,
    html: 160,
    md:   200,
    py:   240,
    rs:   280,
    go:   320,
  };

  const key   = ext.replace('.', '');
  const shift = HUE_SHIFTS[key] ?? 0;
  if (shift === 0) { return baseHex; }   // fast path — no work needed

  const rgb = hexToRgb(baseHex);
  if (!rgb) { return baseHex; }

  // Channel-cycle rotation: blend r→g→b proportionally to `shift / 360`.
  const { r, g, b } = rgb;
  const f  = shift / 360;
  const nr = Math.round(r * (1 - f) + g * f);
  const ng = Math.round(g * (1 - f) + b * f);
  const nb = Math.round(b * (1 - f) + r * f);
  return rgbToHex(
    Math.min(255, nr),
    Math.min(255, ng),
    Math.min(255, nb)
  );
}
