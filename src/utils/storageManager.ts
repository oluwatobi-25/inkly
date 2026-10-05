import { GlyphData } from '../types/font';

const STORAGE_KEY = 'inkly_font_project_v1';

export interface SavedProjectData {
  version: number;
  name: string;
  strokeWidth: number;
  strokeColor: string;
  glyphs: Record<string, GlyphData>;
  savedAt: string;
}

/**
 * Saves font project state to localStorage safely.
 */
export function saveFontProjectToStorage(project: {
  name: string;
  strokeWidth: number;
  strokeColor: string;
  glyphs: Record<string, GlyphData>;
}): boolean {
  try {
    const data: SavedProjectData = {
      version: 1,
      name: project.name || 'My Handwriting',
      strokeWidth: project.strokeWidth || 6,
      strokeColor: project.strokeColor || '#19191C',
      glyphs: project.glyphs,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('Inkly AutoSave: could not write to localStorage:', err);
    return false;
  }
}

/**
 * Loads previously saved font project state from localStorage if available.
 */
export function loadFontProjectFromStorage(): SavedProjectData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProjectData;
    if (parsed && parsed.glyphs && typeof parsed.glyphs === 'object') {
      return parsed;
    }
  } catch (err) {
    console.warn('Inkly AutoSave: could not parse stored project:', err);
  }
  return null;
}

/**
 * Clears the saved project from localStorage.
 */
export function clearFontProjectStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
