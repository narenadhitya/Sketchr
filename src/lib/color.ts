/** Sentinel colour meaning "punch a hole" — used by the transparent fill. */
export const TRANSPARENT_FILL = 'transparent';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsv {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
}

export const hexToRgb = (hex: string): Rgb => {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

export const rgbToHex = ({ r, g, b }: Rgb) =>
  `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')}`;

export const rgbToHsv = ({ r, g, b }: Rgb): Hsv => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : d / max, v: max };
};

export const hsvToRgb = ({ h, s, v }: Hsv): Rgb => {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = v - c;

  const [r, g, b] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
};

export const hexToHsv = (hex: string) => rgbToHsv(hexToRgb(hex));
export const hsvToHex = (hsv: Hsv) => rgbToHex(hsvToRgb(hsv));

/** Perceived luminance, 0 (black) .. 1 (white). */
export const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** Readable foreground for a swatch of this colour. */
export const contrastInk = (hex: string) => (luminance(hex) > 0.58 ? '#16171e' : '#ffffff');

export const isValidHex = (value: string) =>
  /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

export const normalizeHex = (value: string) => {
  const v = value.trim().replace('#', '');
  const full =
    v.length === 3
      ? v
          .split('')
          .map((c) => c + c)
          .join('')
      : v;
  return `#${full.toLowerCase()}`;
};

/**
 * A ramp from near-black through the colour to near-white — the shades and
 * tints you actually reach for when shading a drawing.
 */
export const shadeRamp = (hex: string, steps = 9): string[] => {
  const { h, s, v } = hexToHsv(hex);
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    return t < 0.5
      ? // darker half: drop value, keep saturation
        hsvToHex({ h, s, v: v * (0.2 + 1.6 * t) })
      : // lighter half: wash out saturation towards white
        hsvToHex({ h, s: s * (1 - (t - 0.5) * 1.7), v: Math.min(1, v + (t - 0.5) * (1 - v) * 2) });
  });
};

/** Classic colour-wheel relationships for the current colour. */
export const harmonies = (hex: string) => {
  const { h, s, v } = hexToHsv(hex);
  const at = (deg: number) => hsvToHex({ h: h + deg, s, v });
  return [
    { label: 'Complement', colors: [at(180)] },
    { label: 'Analogous', colors: [at(-30), at(30)] },
    { label: 'Triad', colors: [at(120), at(240)] },
    { label: 'Split', colors: [at(150), at(210)] },
  ];
};
