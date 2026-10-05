/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pen, LayoutGrid, Eye, Edit3 } from 'lucide-react';
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
  const [strokeWidth] = useState(initialSaved?.strokeWidth || 6);
  const [strokeColor] = useState(initialSaved?.strokeColor || '#19191C');
  const [activeCategory, setActiveCategory] = useState<CharacterCategory>('uppercase');
  const [activeChar, setActiveChar] = useState<string>('A');
  const [glyphs, setGlyphs] = useState<Record<string, GlyphData>>(
    initialSaved?.glyphs && Object.keys(initialSaved.glyphs).length > 0
      ? initialSaved.glyphs
      : createInitialGlyphs
  );
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [mobileTab, setMobileTab] = useState<'canvas' | 'matrix' | 'preview'>('canvas');

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Autosave to localStorage on every change
  useEffect(() => {
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
    setSaveStatus('saving');
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
    setSaveStatus('saving');
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
    setSaveStatus('saving');
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

  const handlePrevChar = useCallback(() => {
    if (hasPrev) setActiveChar(currentCategoryChars[activeIndex - 1]);
  }, [hasPrev, currentCategoryChars, activeIndex]);

  const handleNextChar = useCallback(() => {
    if (hasNext) setActiveChar(currentCategoryChars[activeIndex + 1]);
  }, [hasNext, currentCategoryChars, activeIndex]);

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
  }, [activeChar, glyphs, handleUpdateStrokes, handlePrevChar, handleNextChar]);

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
      {/* Top Navbar: Clean on phone & tablet; includes font name only on desktop */}
      <Navigation
        fontName={fontName}
        onFontNameChange={setFontName}
        onGenerateFont={() => setIsGenerateOpen(true)}
        onQuickDownload={(format) => downloadFontFile(currentProject, format)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        saveStatus={saveStatus}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-3 sm:px-6 md:px-8 py-3.5 sm:py-5 flex flex-col gap-3.5 sm:gap-4.5">
        {/* Tablet & Mobile Sub-Header: Clean Font Name & Progress (Hidden on Desktop since desktop has it in the navbar) */}
        <div className="lg:hidden flex flex-wrap items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm text-[#8C877E] font-medium shrink-0">Font:</span>
            <div className="flex items-center gap-1.5 border-b border-[#DDD6C8] hover:border-[#19191C]/40 focus-within:border-[#2563EB] transition-colors pb-0.5">
              <input
                type="text"
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                className="font-serif font-bold text-base sm:text-lg text-[#19191C] bg-transparent outline-none truncate"
                placeholder="My Handwriting"
              />
              <Edit3 className="w-3.5 h-3.5 text-[#A09A8F] opacity-70 shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[#7D776E] bg-[#EFECE5] px-2.5 py-1 rounded-full border border-[#E2DDD3] text-[11px] sm:text-xs">
              {completedCount} of {totalCount} glyphs ({Math.round((completedCount / totalCount) * 100)}%)
            </span>
          </div>
        </div>

        {/* Mobile View Switcher (Visible only on phones < 768px) */}
        <div className="md:hidden flex items-center p-1 bg-[#EFECE5] rounded-xl border border-[#DDD6C8] shadow-2xs">
          <button
            onClick={() => setMobileTab('canvas')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'canvas'
                ? 'bg-white text-[#19191C] shadow-xs'
                : 'text-[#6C675E]'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>
          <button
            onClick={() => setMobileTab('matrix')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'matrix'
                ? 'bg-white text-[#19191C] shadow-xs'
                : 'text-[#6C675E]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Glyphs ({completedCount})</span>
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-white text-[#19191C] shadow-xs'
                : 'text-[#6C675E]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Studio Responsive Grid:
            - Desktop (>= 1024px): 3 individual stack columns side-by-side (Col 1: Matrix, Col 2: Canvas, Col 3: Preview)
            - Tablet (768px - 1023px): Glyphs above them (12 cols) with Drawing Sheet (6 cols) & Live Preview (6 cols) side-by-side below!
            - Mobile (< 768px): Shows selected tab with quick horizontal scrubber
        */}
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Column 1: Character Matrix
              - On Tablet (md): Spans all 12 columns across the top (md:col-span-12 md:order-1)
              - On Desktop (lg): Left column in 3-stack layout (lg:col-span-3 xl:col-span-3 lg:order-1)
          */}
          <div
            className={`w-full md:col-span-12 lg:col-span-3 xl:col-span-3 md:order-1 lg:order-1 flex justify-center lg:justify-start ${
              mobileTab !== 'matrix' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <CharacterGridMatrix
              activeChar={activeChar}
              onSelectChar={(c) => {
                setActiveChar(c);
                if (window.innerWidth < 768) {
                  setMobileTab('canvas');
                }
              }}
              glyphs={glyphs}
              category={activeCategory}
              onCategoryChange={setActiveCategory}
              characters={currentCategoryChars}
              onLoadSampleAlphabet={handleLoadSampleAlphabet}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Column 2: Drawing Sheet (Canvas)
              - On Tablet (md): Left half of bottom row (md:col-span-6 md:order-2)
              - On Desktop (lg): Center column in 3-stack layout (lg:col-span-5 xl:col-span-5 lg:order-2)
          */}
          <div
            className={`w-full md:col-span-6 lg:col-span-5 xl:col-span-5 md:order-2 lg:order-2 flex flex-col items-center justify-center ${
              mobileTab !== 'canvas' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Mobile Quick Character Scrubber (Only on phones) */}
            <div className="md:hidden w-full flex items-center gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-1 select-none">
              {currentCategoryChars.map((c) => {
                const isDone = Boolean(glyphs[c]?.isCompleted && glyphs[c]?.strokes?.length > 0);
                const isSel = c === activeChar;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveChar(c)}
                    className={`shrink-0 w-8 h-8 rounded-lg font-serif font-bold text-xs flex items-center justify-center relative border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#19191C] text-white border-[#19191C] shadow-xs'
                        : isDone
                        ? 'bg-white text-[#19191C] border-[#DDD6C8]'
                        : 'bg-[#FAF8F5] text-[#8C877E] border-[#E8E2D7]'
                    }`}
                  >
                    {c}
                    {isDone && !isSel && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    )}
                  </button>
                );
              })}
            </div>

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

          {/* Column 3: Live Preview Panel
              - On Tablet (md): Right half of bottom row (md:col-span-6 md:order-3)
              - On Desktop (lg): Right column in 3-stack layout (lg:col-span-4 xl:col-span-4 lg:order-3)
          */}
          <div
            className={`w-full md:col-span-6 lg:col-span-4 xl:col-span-4 md:order-3 lg:order-3 h-full flex flex-col ${
              mobileTab !== 'preview' ? 'hidden md:flex' : 'flex'
            }`}
          >
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
