/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { CharacterGridMatrix } from './components/CharacterGridMatrix';
import { HandwritingCanvas } from './components/HandwritingCanvas';
import { LivePreviewPanel } from './components/LivePreviewPanel';
import { GenerateFontModal } from './components/GenerateFontModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { downloadFontFile } from './utils/fontExporter';
import {
  FontProject,
  GlyphData,
  Stroke,
  CharacterCategory,
} from './types/font';
import { getSampleGlyphs } from './utils/sampleAlphabet';
import {
  saveFontProjectToStorage,
  loadFontProjectFromStorage,
} from './utils/storageManager';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBER_CHARS = '0123456789.,!?-\':;'.split('');

function createInitialGlyphs(): Record<string, GlyphData> {
  const glyphs: Record<string, GlyphData> = {};
  const sampleStrokes = getSampleGlyphs();

  const allChars = [...UPPERCASE_CHARS, ...LOWERCASE_CHARS, ...NUMBER_CHARS];

  allChars.forEach((c) => {
    const hasSample = Boolean(sampleStrokes[c]);
    glyphs[c] = {
      char: c,
      strokes: hasSample ? sampleStrokes[c] : [],
      undoStack: [],
      redoStack: [],
      isCompleted: hasSample,
    };
  });
  return glyphs;
}

export default function App() {
  const initialSaved = useMemo(() => loadFontProjectFromStorage(), []);

  const [fontName, setFontName] = useState(initialSaved?.name || 'My Handwriting');
  const [strokeWidth, setStrokeWidth] = useState(initialSaved?.strokeWidth || 6);
  const [strokeColor, setStrokeColor] = useState(initialSaved?.strokeColor || '#19191C');
  const [activeCategory, setActiveCategory] = useState<CharacterCategory>('uppercase');
  const [activeChar, setActiveChar] = useState<string>('A');
  const [glyphs, setGlyphs] = useState<Record<string, GlyphData>>(
    initialSaved?.glyphs && Object.keys(initialSaved.glyphs).length > 0
      ? initialSaved.glyphs
      : createInitialGlyphs
  );
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Autosave to localStorage on every change
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveFontProjectToStorage({
        name: fontName,
        strokeWidth,
        strokeColor,
        glyphs,
      });
      setSaveStatus('saved');
    }, 400);

    return () => clearTimeout(timer);
  }, [fontName, glyphs, strokeWidth, strokeColor]);

  // Current category characters
  const currentCategoryChars = useMemo(() => {
    switch (activeCategory) {
      case 'uppercase':
        return UPPERCASE_CHARS;
      case 'lowercase':
        return LOWERCASE_CHARS;
      case 'numbers':
        return NUMBER_CHARS;
      default:
        return UPPERCASE_CHARS;
    }
  }, [activeCategory]);

  // Ensure activeChar belongs to current category
  useEffect(() => {
    if (!currentCategoryChars.includes(activeChar)) {
      setActiveChar(currentCategoryChars[0]);
    }
  }, [activeCategory, currentCategoryChars, activeChar]);

  // Overall completed count across all glyphs
  const completedCount = useMemo(() => {
    return Object.values(glyphs).filter((g) => g.isCompleted && g.strokes?.length > 0).length;
  }, [glyphs]);

  const totalCount = UPPERCASE_CHARS.length + LOWERCASE_CHARS.length + NUMBER_CHARS.length;

  // Update character strokes
  const handleUpdateStrokes = useCallback((char: string, strokes: Stroke[]) => {
    setGlyphs((prev) => ({
      ...prev,
      [char]: {
        char,
        strokes,
        undoStack: [],
        redoStack: [],
        isCompleted: strokes.length > 0,
      },
    }));
  }, []);

  // Pre-fill entire sample alphabet
  const handleLoadSampleAlphabet = () => {
    const sampleStrokes = getSampleGlyphs();
    const updated: Record<string, GlyphData> = { ...glyphs };
    const allChars = [...UPPERCASE_CHARS, ...LOWERCASE_CHARS, ...NUMBER_CHARS];
    allChars.forEach((c) => {
      if (sampleStrokes[c]) {
        updated[c] = {
          char: c,
          strokes: sampleStrokes[c],
          undoStack: [],
          redoStack: [],
          isCompleted: true,
        };
      }
    });
    setGlyphs(updated);
  };

  const handleClearAll = () => {
    const cleared: Record<string, GlyphData> = {};
    const allChars = [...UPPERCASE_CHARS, ...LOWERCASE_CHARS, ...NUMBER_CHARS];
    allChars.forEach((c) => {
      cleared[c] = {
        char: c,
        strokes: [],
        undoStack: [],
        redoStack: [],
        isCompleted: false,
      };
    });
    setGlyphs(cleared);
  };

  // Next / Previous navigation within current category
  const activeIndex = currentCategoryChars.indexOf(activeChar);
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < currentCategoryChars.length - 1;

  const handlePrevChar = () => {
    if (hasPrev) setActiveChar(currentCategoryChars[activeIndex - 1]);
  };

  const handleNextChar = () => {
    if (hasNext) setActiveChar(currentCategoryChars[activeIndex + 1]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevChar();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextChar();
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const cur = glyphs[activeChar];
        if (cur && cur.strokes.length > 0) {
          handleUpdateStrokes(activeChar, cur.strokes.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChar, glyphs, hasPrev, hasNext, handleUpdateStrokes]);

  const currentProject: FontProject = useMemo(() => ({
    id: 'font-1',
    name: fontName,
    createdAt: 'Today',
    updatedAt: 'Just now',
    strokeWidth,
    strokeColor,
    glyphs,
  }), [fontName, strokeWidth, strokeColor, glyphs]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#19191C] flex flex-col font-sans selection:bg-[#2563EB]/15 selection:text-[#2563EB]">
      {/* Free, Uncluttered Top Navbar */}
      <Navigation
        fontName={fontName}
        onFontNameChange={setFontName}
        onGenerateFont={() => setIsGenerateOpen(true)}
        onQuickDownload={(format) => downloadFontFile(currentProject, format)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        saveStatus={saveStatus}
      />

      {/* Main Studio 3-Column Layout */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 md:px-8 py-5 md:py-6 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Square Box Character Matrix (All characters at a glance) */}
          <div className="lg:col-span-3 xl:col-span-3 flex justify-center lg:justify-start">
            <CharacterGridMatrix
              activeChar={activeChar}
              onSelectChar={setActiveChar}
              glyphs={glyphs}
              category={activeCategory}
              onCategoryChange={setActiveCategory}
              characters={currentCategoryChars}
              onLoadSampleAlphabet={handleLoadSampleAlphabet}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Column 2: Central Spacious Paper Canvas */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center">
            <HandwritingCanvas
              char={activeChar}
              glyphData={glyphs[activeChar]}
              onUpdateStrokes={handleUpdateStrokes}
              strokeColor={strokeColor}
              onNextChar={handleNextChar}
              onPrevChar={handlePrevChar}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          </div>

          {/* Column 3: Real-Time Live Font Preview */}
          <div className="lg:col-span-4 xl:col-span-4 h-full flex flex-col">
            <LivePreviewPanel
              glyphs={glyphs}
              fontName={fontName}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <GenerateFontModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        project={currentProject}
        completedCount={completedCount}
        totalCount={totalCount}
        onFontNameChange={setFontName}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
        fontName={fontName}
      />
    </div>
  );
}
