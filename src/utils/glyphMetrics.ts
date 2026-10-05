import { GlyphData } from '../types/font';
import { DEFAULT_GUIDES } from './strokeUtils';

export const UNITS_PER_EM = 1000;
export const CANVAS_SCALE = 2.65; // Scaled so canvas letter heights match standard font proportions
export const BASELINE_CANVAS = DEFAULT_GUIDES.baseline; // 360

// Synchronized font vertical metrics (derived directly from canvas guidelines)
export const FONT_METRICS = {
  unitsPerEm: UNITS_PER_EM,
  ascender: 800, // Top of uppercase/ascenders
  descender: -200, // Bottom of descenders (g, j, p, q, y)
  capHeight: Math.round((DEFAULT_GUIDES.baseline - DEFAULT_GUIDES.capHeight) * CANVAS_SCALE), // ~610
  xHeight: Math.round((DEFAULT_GUIDES.baseline - DEFAULT_GUIDES.xHeight) * CANVAS_SCALE), // ~360
  baseline: 0,
};

export interface GlyphMetrics {
  char: string;
  hasInk: boolean;
  minX: number; // in font units
  maxX: number;
  minY: number; // font units relative to baseline (0)
  maxY: number;
  inkWidth: number;
  inkHeight: number;
  lsb: number; // left side bearing
  rsb: number; // right side bearing
  advanceWidth: number;
  shiftX: number; // amount to translate points so leftmost ink starts at lsb
}

/**
 * Returns balanced Left and Right Side Bearings for a character
 * to ensure natural letter-spacing and rhythm like real handwriting.
 */
export function getCharacterSideBearings(char: string): { lsb: number; rsb: number } {
  // Punctuation
  if (['.', ',', ':', ';'].includes(char)) {
    return { lsb: 30, rsb: 45 };
  }
  if (["'", '"', '`', '^'].includes(char)) {
    return { lsb: 25, rsb: 35 };
  }
  if (['!', '?', '|', '/', '\\'].includes(char)) {
    return { lsb: 35, rsb: 40 };
  }
  if (['-', '_', '–', '—'].includes(char)) {
    return { lsb: 25, rsb: 25 };
  }

  // Narrow lowercase letters
  if (['i', 'l', 'j', 't', 'f'].includes(char)) {
    return { lsb: 30, rsb: 30 };
  }
  if (char === 'r') {
    return { lsb: 35, rsb: 25 };
  }

  // Round lowercase letters
  if (['o', 'c', 'e'].includes(char)) {
    return { lsb: 35, rsb: 35 };
  }

  // Wide lowercase letters
  if (['m', 'w'].includes(char)) {
    return { lsb: 40, rsb: 40 };
  }

  // Wide capital letters
  if (['M', 'W'].includes(char)) {
    return { lsb: 50, rsb: 50 };
  }

  // Narrow capitals
  if (['I', 'J'].includes(char)) {
    return { lsb: 40, rsb: 40 };
  }

  // Standard uppercase
  if (char >= 'A' && char <= 'Z') {
    return { lsb: 45, rsb: 45 };
  }

  // Numbers
  if (char >= '0' && char <= '9') {
    return { lsb: 35, rsb: 35 };
  }

  // Default lowercase or other
  return { lsb: 35, rsb: 35 };
}

/**
 * Computes exact typographic bounding box, side bearings, and advance width
 * for a glyph from its hand-drawn strokes.
 */
export function computeGlyphMetrics(
  glyphData: GlyphData | undefined,
  char: string
): GlyphMetrics {
  const { lsb, rsb } = getCharacterSideBearings(char);

  if (char === ' ') {
    return {
      char: ' ',
      hasInk: false,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      inkWidth: 0,
      inkHeight: 0,
      lsb: 0,
      rsb: 0,
      advanceWidth: 320,
      shiftX: 0,
    };
  }

  const validStrokes =
    glyphData?.strokes?.filter((s) => !s.isEraser && s.points && s.points.length > 0) || [];

  if (validStrokes.length === 0) {
    // Fallback metrics for unwritten character
    const defaultWidth = char >= 'A' && char <= 'Z' ? 520 : 380;
    return {
      char,
      hasInk: false,
      minX: lsb,
      maxX: lsb + defaultWidth,
      minY: 0,
      maxY: char >= 'A' && char <= 'Z' ? FONT_METRICS.capHeight : FONT_METRICS.xHeight,
      inkWidth: defaultWidth,
      inkHeight: char >= 'A' && char <= 'Z' ? FONT_METRICS.capHeight : FONT_METRICS.xHeight,
      lsb,
      rsb,
      advanceWidth: defaultWidth + lsb + rsb,
      shiftX: 0,
    };
  }

  let minCanvasX = Infinity;
  let maxCanvasX = -Infinity;
  let minCanvasY = Infinity;
  let maxCanvasY = -Infinity;

  for (const stroke of validStrokes) {
    const halfWidth = (stroke.width || 6) / 2;
    for (const p of stroke.points) {
      if (p.x - halfWidth < minCanvasX) minCanvasX = p.x - halfWidth;
      if (p.x + halfWidth > maxCanvasX) maxCanvasX = p.x + halfWidth;
      if (p.y - halfWidth < minCanvasY) minCanvasY = p.y - halfWidth;
      if (p.y + halfWidth > maxCanvasY) maxCanvasY = p.y + halfWidth;
    }
  }

  // Convert to font coordinates (0 at baseline, positive upwards)
  const minFontX = Math.round(minCanvasX * CANVAS_SCALE);
  const maxFontX = Math.round(maxCanvasX * CANVAS_SCALE);
  const maxFontY = Math.round((BASELINE_CANVAS - minCanvasY) * CANVAS_SCALE); // top of ink
  const minFontY = Math.round((BASELINE_CANVAS - maxCanvasY) * CANVAS_SCALE); // bottom of ink

  const inkWidth = Math.max(20, maxFontX - minFontX);
  const inkHeight = Math.max(20, maxFontY - minFontY);

  // shiftX moves leftmost ink to lsb
  const shiftX = lsb - minFontX;
  const advanceWidth = Math.max(140, inkWidth + lsb + rsb);

  return {
    char,
    hasInk: true,
    minX: minFontX,
    maxX: maxFontX,
    minY: minFontY,
    maxY: maxFontY,
    inkWidth,
    inkHeight,
    lsb,
    rsb,
    advanceWidth,
    shiftX,
  };
}
