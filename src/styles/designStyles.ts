import type { CSSProperties } from 'react';
import type { DesignStyle, GlobalStyle } from '@/src/types/customization';

export type CardStyleVariant = 'default' | 'outlined' | 'filled';

type RGB = { r: number; g: number; b: number; a: number };

const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGBA_RE =
  /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/ ]\s*([\d.]+)%?\s*)?\)$/i;

const clamp = (n: number, min = 0, max = 255): number => Math.min(max, Math.max(min, n));

export function parseColor(input: string): RGB | null {
  const value = input.trim();

  if (HEX_RE.test(value)) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((ch) => ch + ch)
        .join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    if ([r, g, b].every((n) => Number.isFinite(n))) return { r, g, b, a };
    return null;
  }

  const match = value.match(RGBA_RE);
  if (match) {
    const r = clamp(Number(match[1]));
    const g = clamp(Number(match[2]));
    const b = clamp(Number(match[3]));
    let a = 1;
    if (match[4] !== undefined) {
      const raw = Number(match[4]);
      a = raw > 1 ? raw / 100 : raw;
    }
    if ([r, g, b, a].every((n) => Number.isFinite(n))) return { r, g, b, a: clamp(a, 0, 1) };
  }

  return null;
}

export function withAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (!parsed) return color;
  const { r, g, b } = parsed;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${clamp(alpha, 0, 1)})`;
}

export function mixColors(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return a;
  const k = Math.min(1, Math.max(0, t));
  const r = Math.round(ca.r + (cb.r - ca.r) * k);
  const g = Math.round(ca.g + (cb.g - ca.g) * k);
  const bl = Math.round(ca.b + (cb.b - ca.b) * k);
  const alpha = ca.a + (cb.a - ca.a) * k;
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

export function isDarkColor(color: string): boolean {
  const parsed = parseColor(color);
  if (!parsed) return false;
  const { r, g, b } = parsed;
  // Fórmula de luminancia relativa simplificada (Rec. 709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.55;
}

export const normalizeDesignStyle = (value: unknown): DesignStyle =>
  value === 'material' ||
  value === 'flat' ||
  value === 'glassmorphism' ||
  value === 'liquidGlass' ||
  value === 'neumorphism'
    ? value
    : 'classic';

export const designStyleOf = (g: GlobalStyle): DesignStyle =>
  normalizeDesignStyle((g as { designStyle?: unknown }).designStyle);

export const DESIGN_STYLE_META: { value: DesignStyle; label: string }[] = [
  { value: 'classic', label: 'Clásico' },
  { value: 'material', label: 'Material' },
  { value: 'flat', label: 'Flat' },
  { value: 'glassmorphism', label: 'Glass' },
  { value: 'liquidGlass', label: 'Liquid' },
  { value: 'neumorphism', label: 'Neumorphism' },
];

const glassTint = (g: GlobalStyle, strong: boolean): { background: string; border: string; shadow: string } => {
  const dark = isDarkColor(g.backgroundColor);
  const cardParsed = parseColor(g.cardBackgroundColor);
  const cardIsTranslucent = cardParsed !== null && cardParsed.a < 0.95;

  if (dark) {
    return {
      background: cardIsTranslucent
        ? withAlpha(g.cardBackgroundColor, Math.max(cardParsed!.a, 0.1))
        : withAlpha('#ffffff', strong ? 0.12 : 0.09),
      border: `1px solid ${withAlpha('#ffffff', strong ? 0.32 : 0.2)}`,
      shadow: `0 10px 30px ${withAlpha('#000000', 0.28)}`,
    };
  }

  return {
    background: cardIsTranslucent
      ? g.cardBackgroundColor
      : withAlpha('#ffffff', strong ? 0.72 : 0.58),
    border: `1px solid ${withAlpha('#ffffff', strong ? 0.85 : 0.7)}`,
    shadow: `0 10px 30px ${withAlpha('#000000', 0.1)}`,
  };
};

const neuShadowPair = (bg: string): { dark: string; light: string } =>
  isDarkColor(bg)
    ? { dark: withAlpha('#000000', 0.6), light: withAlpha('#ffffff', 0.07) }
    : { dark: withAlpha('#000000', 0.14), light: withAlpha('#ffffff', 0.95) };

export const backdropStyleFor = (style: DesignStyle): CSSProperties => {
  if (style === 'glassmorphism' || style === 'liquidGlass') {
    const blur = style === 'liquidGlass' ? 'blur(22px) saturate(190%)' : 'blur(16px) saturate(160%)';
    return { backdropFilter: blur, WebkitBackdropFilter: blur };
  }
  return {};
};

export function cardSurface(
  style: DesignStyle,
  g: GlobalStyle,
  variant: CardStyleVariant,
): CSSProperties {
  const dark = isDarkColor(g.backgroundColor);

  if (variant === 'filled') {
    const tint = withAlpha(g.accentColor, dark ? 0.2 : 0.12);
    if (style === 'glassmorphism' || style === 'liquidGlass') {
      const base = cardSurface(style, g, 'default');
      return { ...base, background: tint, backgroundColor: tint, color: g.textColor };
    }
    if (style === 'neumorphism') {
      const pair = neuShadowPair(g.backgroundColor);
      return {
        backgroundColor: tint,
        color: g.textColor,
        borderRadius: '18px',
        boxShadow: `6px 6px 14px ${pair.dark}, -6px -6px 14px ${pair.light}`,
      };
    }
    if (style === 'material') {
      return {
        backgroundColor: tint,
        color: g.textColor,
        borderRadius: '16px',
        boxShadow: `0 1px 2px ${withAlpha('#000000', 0.12)}, 0 4px 12px ${withAlpha('#000000', 0.1)}, 0 16px 36px ${withAlpha('#000000', 0.1)}`,
      };
    }
    return {
      backgroundColor: tint,
      color: g.textColor,
      borderRadius: style === 'flat' ? '10px' : undefined,
      border: style === 'flat' ? `1.5px solid ${withAlpha(g.accentColor, 0.45)}` : undefined,
      boxShadow: 'none',
    };
  }

  if (variant === 'outlined') {
    switch (style) {
      case 'material':
        return {
          backgroundColor: 'transparent',
          border: `1.5px solid ${withAlpha(g.textColor, 0.16)}`,
          borderRadius: '16px',
        };
      case 'flat':
        return {
          backgroundColor: 'transparent',
          border: `1.5px solid ${withAlpha(g.textColor, 0.5)}`,
          borderRadius: '10px',
          boxShadow: 'none',
        };
      case 'glassmorphism':
      case 'liquidGlass': {
        const glass = glassTint(g, style === 'liquidGlass');
        return {
          ...backdropStyleFor(style),
          background: withAlpha(g.accentColor, dark ? 0.08 : 0.04),
          border: glass.border,
          borderRadius: style === 'liquidGlass' ? '22px' : '16px',
          boxShadow: 'none',
        };
      }
      case 'neumorphism': {
        const pair = neuShadowPair(g.backgroundColor);
        return {
          backgroundColor: mixColors(g.backgroundColor, g.cardBackgroundColor, 0.5),
          borderRadius: '18px',
          border: 'none',
          boxShadow: `inset 4px 4px 9px ${pair.dark}, inset -4px -4px 9px ${pair.light}`,
        };
      }
      default:
        return {
          backgroundColor: 'transparent',
          border: `1px solid ${g.subtextColor}`,
        };
    }
  }

  switch (style) {
    case 'material':
      return {
        backgroundColor: g.cardBackgroundColor,
        borderRadius: '16px',
        boxShadow: `0 1px 2px ${withAlpha('#000000', 0.12)}, 0 4px 12px ${withAlpha('#000000', 0.08)}, 0 16px 36px ${withAlpha('#000000', 0.1)}, inset 0 1px 0 ${withAlpha('#ffffff', 0.06)}`,
      };
    case 'flat':
      return {
        backgroundColor: g.cardBackgroundColor,
        borderRadius: '10px',
        border: `1.5px solid ${withAlpha(g.textColor, 0.12)}`,
        boxShadow: 'none',
      };
    case 'glassmorphism':
    case 'liquidGlass': {
      const glass = glassTint(g, style === 'liquidGlass');
      return {
        ...backdropStyleFor(style),
        background: glass.background,
        border: glass.border,
        borderRadius: style === 'liquidGlass' ? '22px' : '16px',
        boxShadow:
          style === 'liquidGlass'
            ? `inset 0 1px 0 ${withAlpha('#ffffff', 0.5)}, 0 10px 30px ${withAlpha('#000000', 0.16)}`
            : glass.shadow,
      };
    }
    case 'neumorphism': {
      const pair = neuShadowPair(g.backgroundColor);
      return {
        backgroundColor: mixColors(g.backgroundColor, g.cardBackgroundColor, 0.6),
        borderRadius: '18px',
        border: 'none',
        boxShadow: `8px 8px 18px ${pair.dark}, -8px -8px 18px ${pair.light}`,
      };
    }
    default:
      return { backgroundColor: g.cardBackgroundColor };
  }
}

export function imageWellStyle(
  style: DesignStyle,
  g: GlobalStyle,
  variant: CardStyleVariant,
): CSSProperties {
  if (variant === 'filled') {
    return { backgroundColor: withAlpha(g.accentColor, 0.18) };
  }

  switch (style) {
    case 'glassmorphism':
    case 'liquidGlass':
      return { backgroundColor: withAlpha(g.textColor, isDarkColor(g.backgroundColor) ? 0.12 : 0.07) };
    case 'neumorphism': {
      const pair = neuShadowPair(g.backgroundColor);
      return {
        backgroundColor: 'transparent',
        boxShadow: `inset 3px 3px 7px ${pair.dark}, inset -3px -3px 7px ${pair.light}`,
      };
    }
    default:
      return { backgroundColor: g.backgroundColor };
  }
}

export function navPillStyle(
  style: DesignStyle,
  g: GlobalStyle,
  active: boolean,
): CSSProperties {
  const accent = g.accentColor;
  const dark = isDarkColor(g.backgroundColor);

  if (active) {
    switch (style) {
      case 'material':
        return {
          backgroundColor: accent,
          color: g.buttonTextColor,
          borderRadius: '999px',
          boxShadow: `0 4px 10px ${withAlpha(accent, 0.4)}, 0 1px 2px ${withAlpha('#000000', 0.16)}`,
        };
      case 'flat':
        return { backgroundColor: accent, color: g.buttonTextColor, borderRadius: '8px', boxShadow: 'none' };
      case 'glassmorphism':
      case 'liquidGlass':
        return {
          ...backdropStyleFor(style),
          backgroundColor: accent,
          color: g.buttonTextColor,
          borderRadius: '999px',
          boxShadow: `0 6px 16px ${withAlpha(accent, 0.45)}`,
        };
      case 'neumorphism': {
        const pair = neuShadowPair(g.backgroundColor);
        return {
          backgroundColor: withAlpha(accent, dark ? 0.3 : 0.18),
          color: accent,
          borderRadius: '999px',
          boxShadow: `inset 3px 3px 7px ${pair.dark}, inset -3px -3px 7px ${pair.light}`,
        };
      }
      default:
        return {
          backgroundColor: accent,
          color: g.buttonTextColor,
          borderRadius: '999px',
          boxShadow: `0 4px 14px ${withAlpha(accent, 0.42)}`,
        };
    }
  }

  switch (style) {
    case 'material':
      return {
        backgroundColor: withAlpha(g.textColor, dark ? 0.1 : 0.06),
        color: g.subtextColor,
        borderRadius: '999px',
        boxShadow: 'none',
      };
    case 'flat':
      return {
        backgroundColor: withAlpha(g.textColor, dark ? 0.12 : 0.08),
        color: g.subtextColor,
        borderRadius: '8px',
        boxShadow: 'none',
        border: `1.5px solid ${withAlpha(g.textColor, 0.25)}`,
      };
    case 'glassmorphism':
    case 'liquidGlass': {
      const glass = glassTint(g, style === 'liquidGlass');
      return {
        ...backdropStyleFor(style),
        background: glass.background,
        color: g.subtextColor,
        border: glass.border,
        borderRadius: '999px',
        boxShadow: 'none',
      };
    }
    case 'neumorphism': {
      const pair = neuShadowPair(g.backgroundColor);
      return {
        backgroundColor: mixColors(g.backgroundColor, g.cardBackgroundColor, 0.5),
        color: g.subtextColor,
        borderRadius: '999px',
        boxShadow: `4px 4px 9px ${pair.dark}, -4px -4px 9px ${pair.light}`,
      };
    }
    default:
      return {
        backgroundColor: withAlpha(dark ? '#ffffff' : '#000000', dark ? 0.06 : 0.05),
        color: g.subtextColor,
        border: `1px solid ${withAlpha(dark ? '#ffffff' : '#000000', 0.08)}`,
        borderRadius: '999px',
      };
  }
}

export function chipStyle(style: DesignStyle, g: GlobalStyle): CSSProperties {
  if (style === 'classic') {
    return { backgroundColor: g.cardBackgroundColor, color: g.textColor };
  }
  if (style === 'neumorphism') {
    const pair = neuShadowPair(g.backgroundColor);
    return {
      backgroundColor: mixColors(g.backgroundColor, g.cardBackgroundColor, 0.5),
      color: g.textColor,
      boxShadow: `3px 3px 7px ${pair.dark}, -3px -3px 7px ${pair.light}`,
    };
  }
  if (style === 'glassmorphism' || style === 'liquidGlass') {
    const glass = glassTint(g, style === 'liquidGlass');
    return {
      ...backdropStyleFor(style),
      background: glass.background,
      border: glass.border,
      color: g.textColor,
      boxShadow: style === 'liquidGlass' ? `inset 0 1px 0 ${withAlpha('#ffffff', 0.4)}` : undefined,
    };
  }
  return {
    backgroundColor: withAlpha(g.accentColor, 0.14),
    color: g.accentColor,
    boxShadow:
      style === 'material'
        ? `0 2px 6px ${withAlpha('#000000', 0.12)}`
        : 'none',
    borderRadius: style === 'flat' ? '8px' : undefined,
  };
}

// Backdrop decorativo de página (blobs de acento) para estilos de vidrio
export function pageBackdrop(style: DesignStyle, g: GlobalStyle): CSSProperties | null {
  if (style === 'glassmorphism') {
    return {
      backgroundImage: `radial-gradient(40rem 40rem at 8% -10%, ${withAlpha(g.accentColor, 0.22)}, transparent 62%), radial-gradient(34rem 34rem at 110% 30%, ${withAlpha(g.accentColor, 0.14)}, transparent 62%)`,
    };
  }
  if (style === 'liquidGlass') {
    return {
      backgroundImage: `radial-gradient(30rem 30rem at 15% -5%, ${withAlpha(g.accentColor, 0.3)}, transparent 60%), radial-gradient(26rem 26rem at 105% 25%, ${withAlpha(g.accentColor, 0.22)}, transparent 60%), radial-gradient(38rem 38rem at 50% 115%, ${withAlpha('#ffffff', isDarkColor(g.backgroundColor) ? 0.08 : 0.5)}, transparent 65%)`,
    };
  }
  if (style === 'neumorphism') {
    return {
      backgroundImage: `radial-gradient(24rem 24rem at 90% -5%, ${withAlpha(g.textColor, 0.06)}, transparent 60%)`,
    };
  }
  return null;
}

export const bentoSpan = (index: number): boolean => index % 3 === 0;
