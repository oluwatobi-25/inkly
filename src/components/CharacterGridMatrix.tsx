import React from 'react';
import { Check, Wand2, Trash2 } from 'lucide-react';
import { GlyphData, CharacterCategory } from '../types/font';
import { strokeToSvgPath, CANVAS_SIZE } from '../utils/strokeUtils';

interface CharacterGridMatrixProps {
  activeChar: string;
  onSelectChar: (char: string) => void;
  glyphs: Record<string, GlyphData>;
  category: CharacterCategory;
  onCategoryChange: (cat: CharacterCategory) => void;
  characters: string[];
  onLoadSampleAlphabet: () => void;
  onClearAll: () => void;
}

export const CharacterGridMatrix: React.FC<CharacterGridMatrixProps> = ({
  activeChar,
  onSelectChar,
  glyphs,
  category,
  onCategoryChange,
  characters,
  onLoadSampleAlphabet,
  onClearAll,
}) => {
  const completedCount = characters.filter(
    (c) => glyphs[c]?.isCompleted && glyphs[c]?.strokes?.length > 0
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-[#DDD6C8] card-elevation p-3 sm:p-4 flex flex-col w-full lg:max-w-sm">
      {/* Category Tabs & Quick Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EAE4D8]">
        {/* Left: Category Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-[#F2EDE5] rounded-lg border border-[#E2DDD3]">
          <button
            onClick={() => onCategoryChange('uppercase')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              category === 'uppercase'
                ? 'bg-white text-[#19191C] shadow-2xs'
                : 'text-[#6C675E] hover:text-[#19191C]'
            }`}
          >
            A–Z (Caps)
          </button>
          <button
            onClick={() => onCategoryChange('lowercase')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              category === 'lowercase'
                ? 'bg-white text-[#19191C] shadow-2xs'
                : 'text-[#6C675E] hover:text-[#19191C]'
            }`}
          >
            a–z (Small)
          </button>
          <button
            onClick={() => onCategoryChange('numbers')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              category === 'numbers'
                ? 'bg-white text-[#19191C] shadow-2xs'
                : 'text-[#6C675E] hover:text-[#19191C]'
            }`}
          >
            0–9 &amp; Symbols
          </button>
        </div>

        {/* Right: Quick Utilities & Progress count */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#716C62]">
          <button
            onClick={onLoadSampleAlphabet}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#F2ECE1] hover:text-[#19191C] transition-colors cursor-pointer text-[11px]"
            title="Auto-fill sample letters for fast previewing"
          >
            <Wand2 className="w-3 h-3 text-[#2563EB]" />
            <span className="hidden sm:inline">Sample Alphabet</span>
            <span className="sm:hidden">Sample</span>
          </button>

          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer text-[11px]"
            title="Clear all drawn letters"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear all</span>
            <span className="sm:hidden">Clear</span>
          </button>

          <span className="text-[11px] font-mono tabular-nums text-[#7A756D] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E5DFD4]">
            {completedCount}/{characters.length}
          </span>
        </div>
      </div>

      {/* The Responsive Glyph Matrix Grid:
          On mobile: 6 columns
          On tablet/desktop: 13 columns (2 orderly rows of 13 for 26 letters: A-M and N-Z!)
      */}
      <div className="py-2.5">
        <div className="grid grid-cols-6 sm:grid-cols-13 md:grid-cols-13 lg:grid-cols-6 gap-1.5">
          {characters.map((char) => {
            const glyph = glyphs[char];
            const isCompleted = Boolean(glyph && glyph.isCompleted && glyph.strokes.length > 0);
            const isActive = char === activeChar;

            return (
              <button
                key={char}
                onClick={() => onSelectChar(char)}
                title={`Select '${char}'${isCompleted ? ' (Completed)' : ''}`}
                className={`aspect-square min-h-[38px] rounded-lg relative flex items-center justify-center transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#19191C] text-white shadow-xs ring-2 ring-[#2563EB]/40 font-bold scale-[1.03] z-10'
                    : isCompleted
                    ? 'bg-[#FCFAF7] text-[#19191C] border border-[#DDD6C8] hover:border-[#19191C] hover:bg-white font-medium'
                    : 'bg-[#F9F7F2]/70 text-[#736E65] border border-dashed border-[#DDD7CC] hover:bg-white hover:text-[#19191C]'
                }`}
              >
                {/* Character preview: drawn vector or crisp single label */}
                {isCompleted && glyph.strokes.length > 0 ? (
                  <div className="w-5 h-5 flex items-center justify-center pointer-events-none">
                    <svg
                      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
                      className="w-full h-full"
                    >
                      {glyph.strokes
                        .filter((s) => !s.isEraser)
                        .map((s, idx) => (
                          <path
                            key={idx}
                            d={strokeToSvgPath(s.points)}
                            stroke={isActive ? '#FFFFFF' : '#19191C'}
                            strokeWidth={s.width * 2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        ))}
                    </svg>
                  </div>
                ) : (
                  <span
                    className={`font-serif text-sm sm:text-base ${
                      isActive ? 'text-white font-bold' : 'text-[#7A756D]'
                    }`}
                  >
                    {char}
                  </span>
                )}

                {/* Visible, Prominent Checkmark Badge */}
                {isCompleted && (
                  <div
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs ${
                      isActive ? 'bg-[#2563EB] text-white' : 'bg-[#10B981] text-white'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
