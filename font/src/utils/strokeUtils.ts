import { Point, Stroke, GlyphData } from '../types/font';

export const CANVAS_SIZE = 500;

export const DEFAULT_GUIDES = {
  ascender: 80,
  capHeight: 130,
  xHeight: 220,
  baseline: 360,
  descender: 430,
  leftMargin: 90,
  rightMargin: 410,
};

/**
 * Converts a sequence of points to a smooth SVG path `d` string
 * using midpoint quadratic bezier curves.
 */
export function strokeToSvgPath(points: Point[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} l 0.1 0.1`;
  }
  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    return `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}, ${xc.toFixed(1)} ${yc.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

/**
 * Converts all strokes in a glyph into an SVG string or path array.
 */
export function strokesToSvg(strokes: Stroke[], viewBoxSize = CANVAS_SIZE): string {
  if (!strokes || strokes.length === 0) return '';
  return strokes
    .filter((s) => !s.isEraser && s.points.length > 0)
    .map((stroke) => {
      const pathData = strokeToSvgPath(stroke.points);
      return `<path d="${pathData}" fill="none" stroke="${stroke.color}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join('');
}

/**
 * Calculates bounding box and advance width of a glyph's strokes.
 */
export function getGlyphBounds(strokes: Stroke[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let hasPoints = false;
  strokes.forEach((s) => {
    if (s.isEraser) return;
    s.points.forEach((p) => {
      hasPoints = true;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
  });

  if (!hasPoints) {
    return { minX: 0, minY: 0, maxX: CANVAS_SIZE, maxY: CANVAS_SIZE, width: CANVAS_SIZE, height: CANVAS_SIZE };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(20, maxX - minX),
    height: Math.max(20, maxY - minY),
  };
}

/**
 * Draws a single stroke on HTML5 2D canvas context.
 */
export function drawStrokeOnCanvas(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, color, width, isEraser } = stroke;
  if (!points || points.length === 0) return;

  ctx.save();
  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
  }

  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}
