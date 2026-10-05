import React from 'react';
import { X, HelpCircle, Laptop, Apple, Sparkles, CheckCircle } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontName: string;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  fontName,
}) => {
  if (!isOpen) return null;

  const safeName = fontName.trim() || 'My Handwriting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#DDD6C8] card-elevation overflow-hidden shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE4D8] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-base text-[#19191C]">
              How to Install &amp; Use Your Font
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#858076] hover:text-[#19191C] hover:bg-[#EFECE5] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Windows Guide */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#19191C]">
              <Laptop className="w-4 h-4 text-[#2563EB]" />
              <span>Windows</span>
            </div>
            <p className="text-[#615C54] leading-relaxed">
              1. Download your <span className="font-mono font-medium text-[#19191C]">.ttf</span> or <span className="font-mono font-medium text-[#19191C]">.otf</span> file.
              <br />
              2. Double-click the file in your Downloads folder.
              <br />
              3. Click <strong>"Install"</strong> at the top of the preview window.
            </p>
          </div>

          {/* macOS Guide */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#19191C]">
              <Apple className="w-4 h-4 text-[#19191C]" />
              <span>macOS &amp; iPadOS</span>
            </div>
            <p className="text-[#615C54] leading-relaxed">
              1. Double-click the downloaded font file.
              <br />
              2. Font Book will open automatically.
              <br />
              3. Click <strong>"Install Font"</strong>.
            </p>
          </div>

          {/* How to use in apps */}
          <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-1.5 text-[#166534]">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#166534]">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span>Using it in your software</span>
            </div>
            <p className="leading-relaxed">
              Restart or open Microsoft Word, Photoshop, Figma, Illustrator, or Canva. Select{' '}
              <strong className="underline underline-offset-2">"{safeName}"</strong> from the font family dropdown!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#EAE4D8] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#19191C] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
