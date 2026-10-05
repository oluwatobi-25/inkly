import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  CheckCircle2,
  Check,
  Edit3,
  ChevronDown,
  Laptop,
  Apple
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FontProject } from '../types/font';
import { downloadFontFile } from '../utils/fontExporter';

interface GenerateFontModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FontProject;
  completedCount: number;
  totalCount: number;
  onFontNameChange?: (name: string) => void;
  onOpenInstallGuide?: () => void;
}

export const GenerateFontModal: React.FC<GenerateFontModalProps> = ({
  isOpen,
  onClose,
  project,
  onFontNameChange,
  onOpenInstallGuide,
}) => {
  const [generationStage, setGenerationStage] = useState<'compiling' | 'ready'>('compiling');
  const [progressMsg, setProgressMsg] = useState('Vectorizing glyph contours...');
  const [lastDownloadedFormat, setLastDownloadedFormat] = useState<'ttf' | 'otf' | null>(null);
  const [isInstallGuideExpanded, setIsInstallGuideExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setGenerationStage('compiling');
      setLastDownloadedFormat(null);
      setIsInstallGuideExpanded(false);
      return;
    }

    const timers = [
      setTimeout(() => setProgressMsg('Calculating bezier curves & side-bearings...'), 400),
      setTimeout(() => setProgressMsg('Compiling real font binary tables...'), 850),
      setTimeout(() => {
        setGenerationStage('ready');
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#2563EB', '#19191C', '#F59E0B', '#10B981'],
          });
        } catch {
          // fallback
        }
      }, 1400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  if (!isOpen) return null;

  const safeFontName = project.name.trim() || 'My Handwriting';

  const handleDownload = (format: 'ttf' | 'otf') => {
    downloadFontFile(project, format);
    setLastDownloadedFormat(format);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#DDD6C8] card-elevation overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Clean Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE4D8] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <span className="font-serif font-bold text-base text-[#19191C]">
              Generate &amp; Download Font
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#858076] hover:text-[#19191C] hover:bg-[#EFECE5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {generationStage === 'compiling' ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F4F0E8] border border-[#E0D9CB] flex items-center justify-center">
                <div className="w-7 h-7 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-[#19191C]">
                  Building Your Font Package
                </h3>
                <p className="text-xs font-mono text-[#6A655C] h-5 transition-all">
                  {progressMsg}
                </p>
              </div>

              <div className="w-full bg-[#EAE5DB] h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                <div className="bg-[#2563EB] h-full w-3/4 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              {/* Ready Header */}
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#19191C]">
                  Your font is ready to install
                </h3>
                <p className="text-xs text-[#716C63]">
                  Compatible with Windows, macOS, iPadOS, and all design apps.
                </p>
              </div>

              {/* Clean Font Name Input */}
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D6] text-left space-y-1.5">
                <label className="text-xs font-semibold text-[#19191C] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Font Name</span>
                  </span>
                  <span className="text-[11px] text-[#7A756D] font-normal">
                    This will appear in your font menu
                  </span>
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => onFontNameChange && onFontNameChange(e.target.value)}
                  placeholder="e.g. My Handwriting"
                  className="w-full px-3 py-1.5 text-sm font-serif font-bold rounded-lg border border-[#DDD6C8] bg-white text-[#19191C] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {/* Direct Clean Download Actions (.TTF & .OTF) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleDownload('ttf')}
                  className="py-2.5 px-3 rounded-xl font-semibold bg-[#19191C] hover:bg-[#2563EB] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs md:text-sm"
                  title="Download standard TrueType Font (.ttf)"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .TTF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload('otf')}
                  className="py-2.5 px-3 rounded-xl font-semibold bg-[#F2EDE5] hover:bg-[#EAE4D8] border border-[#DDD6C8] text-[#19191C] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs md:text-sm"
                  title="Download OpenType Font (.otf)"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .OTF</span>
                </button>
              </div>

              {/* Compact Download Success Notice */}
              {lastDownloadedFormat && (
                <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>
                    Downloaded <strong>{safeFontName}.{lastDownloadedFormat}</strong>! Double-click to install.
                  </span>
                </div>
              )}

              {/* Discreet, Unexposed Installation Help (Closed by default so it's not rough) */}
              <div className="border border-[#E8E2D6] rounded-xl overflow-hidden bg-[#FAF8F5] transition-all">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenInstallGuide) {
                      onOpenInstallGuide();
                    } else {
                      setIsInstallGuideExpanded(!isInstallGuideExpanded);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-[#6B665E] hover:text-[#19191C] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-4 h-4 rounded-full bg-[#E2DDD3] text-[#19191C] font-mono text-[10px] flex items-center justify-center font-bold">
                      ?
                    </span>
                    <span>How to install &amp; use font</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isInstallGuideExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Collapsible Content */}
                {isInstallGuideExpanded && (
                  <div className="px-3.5 pb-3 text-left text-xs text-[#615C54] space-y-2 border-t border-[#EAE4D8] pt-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <Laptop className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#19191C]">Windows:</strong> Double-click the file &rarr; click <strong>"Install"</strong> at top.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Apple className="w-3.5 h-3.5 text-[#19191C] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#19191C]">macOS:</strong> Double-click the file &rarr; click <strong>"Install Font"</strong>.
                      </div>
                    </div>
                    <p className="text-[11px] text-[#7A756D] bg-white p-2 rounded-lg border border-[#E5DFD4]">
                      Select <strong className="text-[#19191C]">"{safeFontName}"</strong> in Word, Photoshop, Figma, or Canva.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#EAE4D8] flex items-center justify-between text-xs text-[#7A756D]">
          <span>Inkly Typography Studio</span>
          <button
            onClick={onClose}
            className="hover:text-[#19191C] cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
