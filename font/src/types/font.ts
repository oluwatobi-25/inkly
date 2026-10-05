export interface Point {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  isEraser?: boolean;
}

export interface GlyphData {
  char: string;
  strokes: Stroke[];
  undoStack: Stroke[][];
  redoStack: Stroke[][];
  isCompleted: boolean;
  svgPath?: string;
  viewBox?: string;
}

export type CharacterCategory = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';

export interface FontProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  strokeWidth: number;
  strokeColor: string;
  glyphs: Record<string, GlyphData>;
}

export interface PaperGuideConfig {
  ascender: number;
  capHeight: number;
  xHeight: number;
  baseline: number;
  descender: number;
  leftMargin: number;
  rightMargin: number;
}
