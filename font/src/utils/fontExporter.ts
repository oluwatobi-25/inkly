import { FontProject } from '../types/font';
import { strokeToSvgPath, CANVAS_SIZE } from './strokeUtils';
import {
  downloadRealFont,
  compileTrueTypeFont,
  compileOpenTypeFont,
} from './realFontCompiler';

export type FontFormat = 'ttf' | 'otf' | 'svg';

/**
 * Creates an SVG font file representation of the user's glyphs.
 */
export function generateSvgFont(project: FontProject): string {
  const unitsPerEm = 1000;
  const scale = unitsPerEm / CANVAS_SIZE;
  const ascent = 800;
  const descent = -200;

  let glyphTags = '';

  for (const [char, glyph] of Object.entries(project.glyphs)) {
    if (!glyph.isCompleted || !glyph.strokes.length) continue;

    const pathData = glyph.strokes
      .map((stroke) => {
        // Transform canvas coords (top-down) to font coords (bottom-up)
        const transformedPoints = stroke.points.map((p) => ({
          x: p.x * scale,
          y: (CANVAS_SIZE - p.y) * scale - 120, // baseline offset
        }));
        return strokeToSvgPath(transformedPoints);
      })
      .join(' ');

    const unicodeHex = `&#x${char.charCodeAt(0).toString(16)};`;
    glyphTags += `    <glyph unicode="${unicodeHex}" glyph-name="${char}" horiz-adv-x="680" d="${pathData}" />\n`;
  }

  return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="${project.name.replace(/\s+/g, '-')}" horiz-adv-x="680">
      <font-face 
        font-family="${project.name}"
        units-per-em="${unitsPerEm}"
        ascent="${ascent}"
        descent="${descent}"
      />
      <missing-glyph horiz-adv-x="500" d="M0 0 L500 0 L500 700 L0 700 Z" />
${glyphTags}
    </font>
  </defs>
</svg>`;
}

/**
 * Triggers a real browser file download for the font in .ttf, .otf, or .svg format.
 */
export function downloadFontFile(project: FontProject, format: FontFormat = 'ttf') {
  if (format === 'svg') {
    const safeName = project.name.trim() || 'My Handwriting';
    const filename = `${safeName}.svg`;
    const svgContent = generateSvgFont(project);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  // Real, standards-compliant binary TrueType/OpenType font file
  downloadRealFont(project, format);
}
export { compileTrueTypeFont, compileOpenTypeFont };
