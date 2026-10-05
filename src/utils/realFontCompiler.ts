import opentype from 'opentype.js';
import svg2ttf from 'svg2ttf';
import { FontProject, Stroke, Point } from '../types/font';
import {
  UNITS_PER_EM,
  CANVAS_SCALE,
  BASELINE_CANVAS,
  FONT_METRICS,
  computeGlyphMetrics,
} from './glyphMetrics';

/**
 * Transforms canvas coordinates to standard font coordinates
 * with horizontal shift applied to normalize left side bearing (LSB)
 * and vertical coordinate locked to baseline (0 at baseline).
 */
function toShiftedFontCoords(p: Point, shiftX: number): { x: number; y: number } {
  return {
    x: Math.round(p.x * CANVAS_SCALE + shiftX),
    y: Math.round((BASELINE_CANVAS - p.y) * CANVAS_SCALE),
  };
}

/**
 * Converts stroke points with thickness into a closed vector ribbon path
 * in font coordinates with normalized LSB.
 */
function strokeToRibbonPathString(stroke: Stroke, shiftX: number): string {
  const points = stroke.points;
  if (!points || points.length === 0) return '';

  const thickness = Math.max(48, Math.round((stroke.width || 6) * CANVAS_SCALE * 3.4));
  const r = thickness / 2;

  // Filter duplicate adjacent points
  const cleanPts: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleanPts[cleanPts.length - 1];
    const curr = points[i];
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 0.5) {
      cleanPts.push(curr);
    }
  }

  // Single dot
  if (cleanPts.length === 1) {
    const pt = toShiftedFontCoords(cleanPts[0], shiftX);
    return `M ${pt.x - r} ${pt.y} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  }

  const n = cleanPts.length;
  const fontPoints = cleanPts.map((p) => toShiftedFontCoords(p, shiftX));

  const leftSide: { x: number; y: number }[] = [];
  const rightSide: { x: number; y: number }[] = [];
  const tangents: { dx: number; dy: number }[] = [];

  for (let i = 0; i < n; i++) {
    let dx = 0;
    let dy = 0;

    if (i === 0) {
      dx = fontPoints[1].x - fontPoints[0].x;
      dy = fontPoints[1].y - fontPoints[0].y;
    } else if (i === n - 1) {
      dx = fontPoints[n - 1].x - fontPoints[n - 2].x;
      dy = fontPoints[n - 1].y - fontPoints[n - 2].y;
    } else {
      dx = fontPoints[i + 1].x - fontPoints[i - 1].x;
      dy = fontPoints[i + 1].y - fontPoints[i - 1].y;
    }

    const len = Math.hypot(dx, dy) || 1;
    const udx = dx / len;
    const udy = dy / len;
    tangents.push({ dx: udx, dy: udy });

    const nx = -udy * r;
    const ny = udx * r;

    leftSide.push({
      x: Math.round(fontPoints[i].x + nx),
      y: Math.round(fontPoints[i].y + ny),
    });
    rightSide.push({
      x: Math.round(fontPoints[i].x - nx),
      y: Math.round(fontPoints[i].y - ny),
    });
  }

  // Build SVG path
  let d = `M ${leftSide[0].x} ${leftSide[0].y}`;
  for (let i = 1; i < n; i++) {
    d += ` L ${leftSide[i].x} ${leftSide[i].y}`;
  }

  const lastTangent = tangents[n - 1];
  const endTipX = Math.round(fontPoints[n - 1].x + lastTangent.dx * r);
  const endTipY = Math.round(fontPoints[n - 1].y + lastTangent.dy * r);
  d += ` L ${endTipX} ${endTipY}`;
  d += ` L ${rightSide[n - 1].x} ${rightSide[n - 1].y}`;

  for (let i = n - 2; i >= 0; i--) {
    d += ` L ${rightSide[i].x} ${rightSide[i].y}`;
  }

  const firstTangent = tangents[0];
  const startTipX = Math.round(fontPoints[0].x - firstTangent.dx * r);
  const startTipY = Math.round(fontPoints[0].y - firstTangent.dy * r);
  d += ` L ${startTipX} ${startTipY}`;
  d += ` L ${leftSide[0].x} ${leftSide[0].y}`;
  d += ' Z';

  return d;
}

/**
 * Converts a stroke into an opentype.Path contour with normalized LSB.
 */
function strokeToOpentypeContour(path: opentype.Path, stroke: Stroke, shiftX: number) {
  const points = stroke.points;
  if (!points || points.length === 0) return;

  const thickness = Math.max(52, Math.round((stroke.width || 6) * CANVAS_SCALE * 3.6));
  const r = thickness / 2;

  const cleanPts: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleanPts[cleanPts.length - 1];
    const curr = points[i];
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 0.5) {
      cleanPts.push(curr);
    }
  }

  if (cleanPts.length === 1) {
    const pt = toShiftedFontCoords(cleanPts[0], shiftX);
    const k = r * 0.5522847498;
    path.moveTo(pt.x - r, pt.y);
    path.bezierCurveTo(pt.x - r, pt.y + k, pt.x - k, pt.y + r, pt.x, pt.y + r);
    path.bezierCurveTo(pt.x + k, pt.y + r, pt.x + r, pt.y + k, pt.x + r, pt.y);
    path.bezierCurveTo(pt.x + r, pt.y - k, pt.x + k, pt.y - r, pt.x, pt.y - r);
    path.bezierCurveTo(pt.x - k, pt.y - r, pt.x - r, pt.y - k, pt.x - r, pt.y);
    path.close();
    return;
  }

  const n = cleanPts.length;
  const fontPoints = cleanPts.map((p) => toShiftedFontCoords(p, shiftX));

  const leftSide: { x: number; y: number }[] = [];
  const rightSide: { x: number; y: number }[] = [];
  const tangents: { dx: number; dy: number }[] = [];

  for (let i = 0; i < n; i++) {
    let dx = 0;
    let dy = 0;

    if (i === 0) {
      dx = fontPoints[1].x - fontPoints[0].x;
      dy = fontPoints[1].y - fontPoints[0].y;
    } else if (i === n - 1) {
      dx = fontPoints[n - 1].x - fontPoints[n - 2].x;
      dy = fontPoints[n - 1].y - fontPoints[n - 2].y;
    } else {
      dx = fontPoints[i + 1].x - fontPoints[i - 1].x;
      dy = fontPoints[i + 1].y - fontPoints[i - 1].y;
    }

    const len = Math.hypot(dx, dy) || 1;
    const udx = dx / len;
    const udy = dy / len;
    tangents.push({ dx: udx, dy: udy });

    const nx = -udy * r;
    const ny = udx * r;

    leftSide.push({
      x: Math.round(fontPoints[i].x + nx),
      y: Math.round(fontPoints[i].y + ny),
    });
    rightSide.push({
      x: Math.round(fontPoints[i].x - nx),
      y: Math.round(fontPoints[i].y - ny),
    });
  }

  // Counter-Clockwise (CCW) contour order: mandatory for PostScript CFF fonts (Adobe Photoshop)
  path.moveTo(rightSide[0].x, rightSide[0].y);
  for (let i = 1; i < n; i++) {
    path.lineTo(rightSide[i].x, rightSide[i].y);
  }

  const lastTangent = tangents[n - 1];
  path.lineTo(
    Math.round(fontPoints[n - 1].x + lastTangent.dx * r),
    Math.round(fontPoints[n - 1].y + lastTangent.dy * r)
  );
  path.lineTo(leftSide[n - 1].x, leftSide[n - 1].y);

  for (let i = n - 2; i >= 0; i--) {
    path.lineTo(leftSide[i].x, leftSide[i].y);
  }

  const firstTangent = tangents[0];
  path.lineTo(
    Math.round(fontPoints[0].x - firstTangent.dx * r),
    Math.round(fontPoints[0].y - firstTangent.dy * r)
  );
  path.lineTo(rightSide[0].x, rightSide[0].y);
  path.close();
}

/**
 * Builds the intermediate SVG font definition with normalized side bearings
 * and advance widths synchronized to typography metrics.
 */
function buildSvgFontDefinition(project: FontProject): string {
  const safeName = project.name.trim() || 'My Handwriting';
  const cleanId = safeName.replace(/[^a-zA-Z0-9]/g, '') || 'MyHandwriting';

  let glyphTags = '';

  for (const [char, glyphData] of Object.entries(project.glyphs)) {
    if (!char) continue;

    const metrics = computeGlyphMetrics(glyphData, char);
    const validStrokes = glyphData.strokes.filter((s) => !s.isEraser && s.points.length > 0);

    if (validStrokes.length === 0) continue;

    const paths = validStrokes
      .map((stroke) => strokeToRibbonPathString(stroke, metrics.shiftX))
      .filter(Boolean)
      .join(' ');

    const unicodeHex = `&#x${char.charCodeAt(0).toString(16)};`;
    glyphTags += `      <glyph unicode="${unicodeHex}" glyph-name="${char}" horiz-adv-x="${metrics.advanceWidth}" d="${paths}" />\n`;
  }

  // Ensure space glyph has precise proportional advance width
  glyphTags += `      <glyph unicode=" " glyph-name="space" horiz-adv-x="320" d="" />\n`;

  return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="${cleanId}" horiz-adv-x="1000">
      <font-face 
        font-family="${safeName}"
        units-per-em="${UNITS_PER_EM}"
        ascent="${FONT_METRICS.ascender}"
        descent="${FONT_METRICS.descender}"
        cap-height="${FONT_METRICS.capHeight}"
        x-height="${FONT_METRICS.xHeight}"
      />
      <missing-glyph horiz-adv-x="500" d="M 50 0 L 450 0 L 450 700 L 50 700 Z M 100 50 L 100 650 L 400 650 L 400 50 Z" />
${glyphTags}
    </font>
  </defs>
</svg>`;
}

/**
 * Compiles a 100% genuine TrueType font (.ttf) with TrueType outline tables
 * and '00 01 00 00' magic bytes that passes Windows and macOS font validators.
 */
export function compileTrueTypeFont(project: FontProject): Uint8Array {
  const svgFontXml = buildSvgFontDefinition(project);

  const ttfResult = svg2ttf(svgFontXml, {
    copyright: 'Inkly Typography Studio',
    version: '1.0',
    description: 'Handwritten font created with Inkly Studio',
  });

  return ttfResult.buffer;
}

/**
 * Compiles an OpenType font (.otf) with PostScript CFF outlines and 'OTTO' header,
 * with proportional side-bearings and synchronized baseline.
 */
export function compileOpenTypeFont(project: FontProject): ArrayBuffer {
  const safeName = project.name.trim() || 'My Handwriting';
  const glyphList: opentype.Glyph[] = [];

  // Index 0: .notdef
  const notdefPath = new opentype.Path();
  notdefPath.moveTo(50, 0);
  notdefPath.lineTo(450, 0);
  notdefPath.lineTo(450, 700);
  notdefPath.lineTo(50, 700);
  notdefPath.close();
  notdefPath.moveTo(100, 50);
  notdefPath.lineTo(100, 650);
  notdefPath.lineTo(400, 650);
  notdefPath.lineTo(400, 50);
  notdefPath.close();

  glyphList.push(
    new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 500,
      path: notdefPath,
    })
  );

  // Index 1: space
  glyphList.push(
    new opentype.Glyph({
      name: 'space',
      unicode: 32,
      advanceWidth: 320,
      path: new opentype.Path(),
    })
  );

  // User glyphs with normalized side-bearings
  for (const [char, glyphData] of Object.entries(project.glyphs)) {
    if (!char) continue;
    const unicode = char.charCodeAt(0);
    const metrics = computeGlyphMetrics(glyphData, char);
    const validStrokes = glyphData.strokes.filter((s) => !s.isEraser && s.points.length > 0);

    const path = new opentype.Path();
    for (const stroke of validStrokes) {
      strokeToOpentypeContour(path, stroke, metrics.shiftX);
    }

    glyphList.push(
      new opentype.Glyph({
        name: char,
        unicode,
        advanceWidth: metrics.advanceWidth,
        leftSideBearing: metrics.lsb,
        path,
      })
    );
  }

  const font = new opentype.Font({
    familyName: safeName,
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: FONT_METRICS.ascender,
    descender: FONT_METRICS.descender,
    weightClass: '400',
    glyphs: glyphList,
  });

  // Ensure robust OS/2 typographic metrics for Adobe Photoshop & Illustrator
  const os2Table = font.tables.os2 as Record<string, unknown> | undefined;
  if (os2Table) {
    os2Table.usWeightClass = 400;
    os2Table.sWeightClass = 400;
    os2Table.fsSelection = 0x40; // Regular
    os2Table.achVendID = 'INKL';
    os2Table.sTypoAscender = FONT_METRICS.ascender;
    os2Table.sTypoDescender = FONT_METRICS.descender;
    os2Table.sTypoLineGap = 90;
    os2Table.usWinAscent = FONT_METRICS.ascender;
    os2Table.usWinDescent = Math.abs(FONT_METRICS.descender);
  }

  return font.toArrayBuffer();
}

/**
 * Downloads the font in either .ttf or .otf format directly in the browser.
 */
export function downloadRealFont(
  project: FontProject,
  format: 'ttf' | 'otf' = 'ttf'
) {
  const safeName = project.name.trim() || 'My Handwriting';
  const filename = `${safeName}.${format}`;

  let blob: Blob;

  if (format === 'ttf') {
    const ttfBytes = compileTrueTypeFont(project);
    blob = new Blob([ttfBytes as unknown as BlobPart], { type: 'font/ttf' });
  } else {
    const otfBuffer = compileOpenTypeFont(project);
    blob = new Blob([new Uint8Array(otfBuffer) as unknown as BlobPart], { type: 'font/otf' });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
