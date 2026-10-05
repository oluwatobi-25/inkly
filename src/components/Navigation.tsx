import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Download, ChevronDown, Sparkles, Edit2 } from 'lucide-react';

interface NavigationProps {
  fontName?: string;
  onFontNameChange?: (name: string) => void;
  onGenerateFont: () => void;
  onQuickDownload?: (format: 'ttf' | 'otf') => void;
  onOpenInstallGuide?: () => void;
  saveStatus?: 'saved' | 'saving';
}

export const Navigation: React.FC<NavigationProps> = ({
  fontName,
  onFontNameChange,
  onGenerateFont,
  onQuickDownload,
  onOpenInstallGuide,
  saveStatus = 'saved',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFormat = (format: 'ttf' | 'otf') => {
    setIsDropdownOpen(false);
    if (onQuickDownload) {
      onQuickDownload(format);
    } else {
      onGenerateFont();
    }
  };

  return (
    <header className="bg-[#FAF8F5]/95 border-b border-[#E8E2D7] px-4 sm:px-6 md:px-10 py-2.5 sm:py-3 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-[#19191C] flex items-center justify-center text-white shadow-xs">
            <PenTool className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <span className="font-serif italic text-xl sm:text-2xl font-bold tracking-tight text-[#19191C]">
            Inkly
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono text-[#7D776E] bg-[#EFECE5] px-1.5 sm:px-2 py-0.5 rounded-md border border-[#E2DDD3] hidden md:inline-block">
            Studio
          </span>
        </div>

        {/* Center: Font Name Editor Pill (Visible ONLY on desktop lg+; completely removed on tablet and phone) */}
        {fontName !== undefined && onFontNameChange && (
          <div className="hidden lg:flex items-center gap-1.5 min-w-0 max-w-[280px]">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 bg-white border border-[#2563EB] rounded-xl px-3 py-1 shadow-xs w-full">
                <input
                  type="text"
                  value={fontName}
                  onChange={(e) => onFontNameChange(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="text-xs sm:text-sm font-serif font-bold text-[#19191C] outline-none bg-transparent w-full min-w-0"
                  placeholder="My Handwriting"
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="text-[11px] text-[#2563EB] font-semibold hover:underline shrink-0 cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-[#DDD6C8] hover:border-[#19191C]/40 transition-all cursor-pointer shadow-2xs group min-w-0"
                title="Click to rename your font"
              >
                <span className="text-xs text-[#8C877E] shrink-0">Font:</span>
                <span className="font-serif font-bold text-xs sm:text-sm text-[#19191C] group-hover:text-[#2563EB] transition-colors truncate">
                  {fontName || 'My Handwriting'}
                </span>
                <Edit2 className="w-3 h-3 text-[#A09A8F] opacity-70 group-hover:opacity-100 shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* Right: Clean, spacious action elements (Never crowded) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Autosaved status pill with the green dot inside - only visible on desktop screen */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border border-[#E2DDD3] text-[11px] text-[#6B665E] shadow-2xs select-none"
            title="Your font strokes are automatically saved in your browser"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                saveStatus === 'saving'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-medium text-[11px]">
              {saveStatus === 'saving' ? 'Saving...' : 'Autosaved'}
            </span>
          </div>

          {/* Question mark in a circle button */}
          <button
            onClick={onOpenInstallGuide}
            className="w-8.5 h-8.5 rounded-full bg-white hover:bg-[#F2ECE1] border border-[#DDD6C8] hover:border-[#19191C] text-[#6B665E] hover:text-[#19191C] flex items-center justify-center transition-all cursor-pointer shadow-2xs font-bold text-xs shrink-0"
            title="How to install and use your font"
            aria-label="How to install and use font"
          >
            ?
          </button>

          {/* Download Font Action with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-[#19191C]">
              {/* Primary Action Button: Opens Generator Modal */}
              <button
                onClick={onGenerateFont}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#19191C] hover:bg-[#2563EB] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">Download Font</span>
                <span className="sm:hidden">Download</span>
              </button>

              {/* Dropdown Chevron Toggle Button */}
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="px-2 sm:px-2.5 py-1.5 sm:py-2 text-white bg-[#19191C] hover:bg-[#2563EB] border-l border-white/20 transition-all cursor-pointer flex items-center justify-center"
                title="Select format to download (.TTF or .OTF)"
                aria-expanded={isDropdownOpen}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Clean Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#DDD6C8] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-1.5 text-[11px] font-mono text-[#8C877E] uppercase tracking-wider">
                  Select Format Extension
                </div>

                {/* TTF Option */}
                <button
                  onClick={() => handleSelectFormat('ttf')}
                  className="w-full px-3.5 py-2.5 flex items-start gap-3 hover:bg-[#FAF8F5] transition-colors text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#19191C] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:bg-[#2563EB] transition-colors">
                    TTF
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#19191C] flex items-center gap-1.5">
                      <span>.TTF (TrueType)</span>
                      <span className="text-[10px] text-[#10B981] font-mono bg-[#10B981]/10 px-1 rounded">
                        Standard
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78736A]">
                      Universal for Windows, macOS, Word, and Web.
                    </p>
                  </div>
                </button>

                {/* OTF Option */}
                <button
                  onClick={() => handleSelectFormat('otf')}
                  className="w-full px-3.5 py-2.5 flex items-start gap-3 hover:bg-[#FAF8F5] transition-colors text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    OTF
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#19191C] flex items-center gap-1.5">
                      <span>.OTF (OpenType)</span>
                      <span className="text-[10px] text-[#2563EB] font-mono bg-[#2563EB]/10 px-1 rounded">
                        Pro
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78736A]">
                      Advanced typography for Photoshop, Illustrator &amp; Figma.
                    </p>
                  </div>
                </button>

                <div className="my-1.5 border-t border-[#EAE4D8]" />

                {/* Open full modal */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onGenerateFont();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-xs font-medium text-[#4F4A42] hover:text-[#19191C] hover:bg-[#FAF8F5] transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Export Settings &amp; Full Preview...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
