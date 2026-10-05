import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { GlyphData } from '../types/font';
import { compileTrueTypeFont } from '../utils/realFontCompiler';

interface LivePreviewPanelProps {
  glyphs: Record<string, GlyphData>;
  fontName: string;
}

const PRESET_PHRASES = [
  { label: 'Your handwriting', text: 'Your handwriting' },
  { label: 'Pangram', text: 'The quick brown fox jumps over the lazy dog.' },
  { label: 'A–Z', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { label: '0–9', text: '0123456789' },
];

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  glyphs,
  fontName,
}) => {
  const [text, setText] = useState<string>('Your handwriting');
  const [fontSize, setFontSize] = useState<number>(44);
  const [copied, setCopied] = useState<boolean>(false);
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<string>('Caveat');
  const blobUrlRef = useRef<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /**
   * Compiles the actual TrueType font and loads it into document.fonts
   * so the browser renders the preview using the real native font engine.
   */
  useEffect(() => {
    try {
      const hasStrokes = Object.values(glyphs).some(
        (g) => g.strokes && g.strokes.some((s) => !s.isEraser && s.points?.length > 0)
      );

      if (!hasStrokes) {
        setFontFamily('Caveat');
        return;
      }

      const ttfBytes = compileTrueTypeFont({
        id: 'preview',
        name: fontName || 'My Handwriting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        strokeWidth: 6,
        strokeColor: '#000000',
        glyphs,
      });

      const blob = new Blob([ttfBytes as unknown as BlobPart], { type: 'font/ttf' });
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      const fontUrl = URL.createObjectURL(blob);
      blobUrlRef.current = fontUrl;

      const newFamily = `LiveFont_${Date.now()}`;
      const fontFace = new FontFace(newFamily, `url("${fontUrl}")`);

      fontFace
        .load()
        .then((loadedFace) => {
          document.fonts.add(loadedFace);
          setFontFamily(newFamily);
        })
        .catch((err) => {
          console.warn('FontFace compilation load error:', err);
        });
    } catch (err) {
      console.warn('Error compiling preview font:', err);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [glyphs, fontName]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD6C8] card-elevation overflow-hidden">
      {/* Clean, Focused Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E2D7] bg-[#FAF8F5]">
        <span className="font-serif font-bold text-base text-[#19191C]">
          Live Preview
        </span>

        {/* Controls: Ruled line toggle, Sizes (S/M/L) & Reset */}
        <div className="flex items-center gap-2">
          {/* Optional Baseline / Ruler toggle (Off by default for pristine look) */}
          <button
            onClick={() => setShowRuler((prev) => !prev)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
              showRuler
                ? 'bg-[#F2ECE1] border-[#D3C7B5] text-[#19191C] font-semibold'
                : 'bg-white border-[#DDD6C8] text-[#7A756D] hover:text-[#19191C]'
            }`}
            title={showRuler ? 'Hide baseline ruling' : 'Show baseline ruling'}
          >
            {showRuler ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>Line {showRuler ? 'On' : 'Off'}</span>
          </button>

          {/* Size Pills */}
          <div className="flex items-center gap-1 bg-[#F2EEE7] p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFontSize(32)}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                fontSize === 32
                  ? 'bg-white font-semibold text-[#19191C] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#19191C]'
              }`}
            >
              S
            </button>
            <button
              onClick={() => setFontSize(44)}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                fontSize === 44
                  ? 'bg-white font-semibold text-[#19191C] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#19191C]'
              }`}
            >
              M
            </button>
            <button
              onClick={() => setFontSize(60)}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                fontSize === 60
                  ? 'bg-white font-semibold text-[#19191C] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#19191C]'
              }`}
            >
              L
            </button>
          </div>

          <button
            onClick={() => setText('Your handwriting')}
            className="p-1.5 text-[#7A756D] hover:text-[#19191C] hover:bg-[#EFECE5] rounded-md transition-colors cursor-pointer"
            title="Reset text"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pristine Paper Stage: Real Native Font Rendering on the Same Line */}
      <div className="flex-1 p-8 overflow-y-auto bg-[#FCFAF7] flex items-center justify-center min-h-[260px] relative select-text">
        {/* Optional faint notebook ruling */}
        {showRuler && (
          <div className="absolute inset-x-8 pointer-events-none border-b border-[#DDD4C5] border-dashed top-1/2 -translate-y-1/2 opacity-70" />
        )}

        {/* Native Typography Text Display */}
        <div
          className="w-full text-center whitespace-pre-wrap break-words tracking-normal transition-all"
          style={{
            fontFamily: `"${fontFamily}", 'Patrick Hand', 'Comic Sans MS', cursive, sans-serif`,
            fontSize: `${fontSize}px`,
            lineHeight: 1.45,
            color: '#19191C',
            wordBreak: 'break-word',
          }}
        >
          {text || ' '}
        </div>
      </div>

      {/* Clean Bottom Input & Presets */}
      <div className="p-3.5 bg-white border-t border-[#E8E2D7] space-y-2">
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type anything here to test your font..."
            className="w-full px-3 py-2 pr-9 text-sm rounded-xl border border-[#DDD6C8] bg-[#FAF8F5] text-[#19191C] placeholder-[#9D988E] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2.5 p-1 text-[#7A756D] hover:text-[#19191C] cursor-pointer"
            title="Copy text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Clean, Simple Presets without any scrollbar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none">
          <span className="text-[11px] text-[#9E988E] shrink-0 mr-0.5">Presets:</span>
          {PRESET_PHRASES.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setText(preset.text)}
              className={`px-2 py-0.5 rounded-md text-xs transition-colors shrink-0 cursor-pointer ${
                text === preset.text
                  ? 'bg-[#19191C] text-white font-medium'
                  : 'text-[#6B665E] hover:text-[#19191C] hover:bg-[#F3EFE8]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
