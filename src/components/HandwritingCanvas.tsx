import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  RotateCcw,
  Trash2,
  Eraser,
  Pen,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Stroke, Point, GlyphData } from '../types/font';
import {
  CANVAS_SIZE,
  DEFAULT_GUIDES,
  drawStrokeOnCanvas,
} from '../utils/strokeUtils';

interface HandwritingCanvasProps {
  char: string;
  glyphData?: GlyphData;
  onUpdateStrokes: (char: string, strokes: Stroke[]) => void;
  strokeColor: string;
  onNextChar: () => void;
  onPrevChar: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  char,
  glyphData,
  onUpdateStrokes,
  strokeColor,
  onNextChar,
  onPrevChar,
  hasPrev,
  hasNext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);

  // Mode and individual sizes for pen and eraser
  const [isEraser, setIsEraser] = useState(false);
  const [penSize, setPenSize] = useState<number>(6);
  const [eraserSize, setEraserSize] = useState<number>(20);
  const [showGuides, setShowGuides] = useState<boolean>(true);

  const strokes = useMemo(() => glyphData?.strokes || [], [glyphData?.strokes]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    strokes.forEach((stroke) => {
      drawStrokeOnCanvas(ctx, stroke);
    });
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_SIZE / rect.width;
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
      pressure: e.pressure || 0.5,
      time: Date.now(),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    currentPointsRef.current = [pt];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawStrokeOnCanvas(ctx, {
      points: [pt],
      color: strokeColor,
      width: isEraser ? eraserSize : penSize,
      isEraser,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasCoords(e);
    currentPointsRef.current.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = currentPointsRef.current;
    if (pts.length >= 2) {
      drawStrokeOnCanvas(ctx, {
        points: pts.slice(-3),
        color: strokeColor,
        width: isEraser ? eraserSize : penSize,
        isEraser,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (currentPointsRef.current.length > 0) {
      const newStroke: Stroke = {
        points: [...currentPointsRef.current],
        color: strokeColor,
        width: isEraser ? eraserSize : penSize,
        isEraser,
      };

      const updatedStrokes = [...strokes, newStroke];
      onUpdateStrokes(char, updatedStrokes);
    }

    currentPointsRef.current = [];
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    onUpdateStrokes(char, strokes.slice(0, -1));
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    onUpdateStrokes(char, []);
  };

  const currentToolWidth = isEraser ? eraserSize : penSize;

  return (
    <div className="flex flex-col items-center w-full max-w-[540px] mx-auto">
      {/* Top Header: Character title & Guidelines Toggle */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-[#DDD6C8] flex items-center justify-center shadow-xs">
            <span className="font-serif text-2xl font-bold text-[#19191C]">{char}</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#19191C]">Character {char}</h2>
            <p className="text-xs text-[#716C62]">
              Draw your {char} the way you normally write it.
            </p>
          </div>
        </div>

        {/* Cap-Height & Baseline Guides Toggle */}
        <button
          onClick={() => setShowGuides((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
            showGuides
              ? 'bg-[#F2ECE1] border-[#D3C7B5] text-[#19191C] font-semibold'
              : 'bg-white border-[#DDD6C8] text-[#7A756D] hover:text-[#19191C]'
          }`}
          title={showGuides ? 'Turn off baseline and cap-height guides' : 'Turn on baseline and cap-height guides'}
        >
          {showGuides ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>Guides {showGuides ? 'On' : 'Off'}</span>
        </button>
      </div>

      {/* Spacious, Breathable Paper Drawing Canvas */}
      <div className="relative w-full aspect-square rounded-2xl bg-[#FCFAF7] border border-[#D8D1C2] card-elevation overflow-hidden select-none">
        {/* Paper texture */}
        <div className="absolute inset-0 pointer-events-none opacity-40 paper-pattern" />

        {/* Typography Guides (Turn on / off via button) */}
        {showGuides && (
          <>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
            >
              {/* Ascender line */}
              <line
                x1={0}
                y1={DEFAULT_GUIDES.ascender}
                x2={CANVAS_SIZE}
                y2={DEFAULT_GUIDES.ascender}
                stroke="#DCD4C6"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {/* Cap Height line */}
              <line
                x1={0}
                y1={DEFAULT_GUIDES.capHeight}
                x2={CANVAS_SIZE}
                y2={DEFAULT_GUIDES.capHeight}
                stroke="#D2C8B7"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />

              {/* X-Height line */}
              <line
                x1={0}
                y1={DEFAULT_GUIDES.xHeight}
                x2={CANVAS_SIZE}
                y2={DEFAULT_GUIDES.xHeight}
                stroke="#BCB5A8"
                strokeDasharray="2 3"
                strokeWidth="1"
              />

              {/* Baseline (Primary guide, solid warm ink color) */}
              <line
                x1={0}
                y1={DEFAULT_GUIDES.baseline}
                x2={CANVAS_SIZE}
                y2={DEFAULT_GUIDES.baseline}
                stroke="#8A7A66"
                strokeWidth="1.8"
              />

              {/* Descender line */}
              <line
                x1={0}
                y1={DEFAULT_GUIDES.descender}
                x2={CANVAS_SIZE}
                y2={DEFAULT_GUIDES.descender}
                stroke="#DCD4C6"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            </svg>

            {/* Quiet labels */}
            <div className="absolute inset-y-0 left-2.5 pointer-events-none flex flex-col text-[9px] font-mono text-[#A8A194] select-none">
              <span style={{ position: 'absolute', top: `${(DEFAULT_GUIDES.capHeight / CANVAS_SIZE) * 100}%`, transform: 'translateY(-100%)' }}>
                cap height
              </span>
              <span
                className="text-[#756552] font-semibold"
                style={{ position: 'absolute', top: `${(DEFAULT_GUIDES.baseline / CANVAS_SIZE) * 100}%`, transform: 'translateY(-100%)' }}
              >
                baseline
              </span>
            </div>
          </>
        )}

        {/* Faint reference watermark when empty */}
        {strokes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span
              className="font-serif select-none"
              style={{
                fontSize: '280px',
                color: 'rgba(215, 208, 195, 0.4)',
                lineHeight: 1,
                transform: 'translateY(15px)',
              }}
            >
              {char}
            </span>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative z-10 w-full h-full block touch-none select-none ${
            isEraser ? 'cursor-cell' : 'cursor-crosshair'
          }`}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
        />
      </div>

      {/* Modern Toolbar Below Canvas with Individual Pen & Eraser Sliders */}
      <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-[#DDD6C8] shadow-xs">
        {/* Left: Pen / Eraser Mode Selector */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#F3EFE6] p-0.5 rounded-lg">
            <button
              onClick={() => setIsEraser(false)}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                !isEraser ? 'bg-white text-[#19191C] shadow-2xs font-semibold' : 'text-[#6C675E]'
              }`}
            >
              <Pen className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                isEraser ? 'bg-white text-[#19191C] shadow-2xs font-semibold' : 'text-[#6C675E]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Individual Dynamic Slider for Active Tool */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E2D6]">
            {/* Visual tip thickness preview */}
            <div className="w-4 h-4 flex items-center justify-center">
              <span
                className={`rounded-full ${isEraser ? 'bg-[#78716C] ring-1 ring-[#19191C]' : 'bg-[#19191C]'}`}
                style={{
                  width: `${Math.min(14, Math.max(3, currentToolWidth * 0.45))}px`,
                  height: `${Math.min(14, Math.max(3, currentToolWidth * 0.45))}px`,
                }}
              />
            </div>

            {/* Slider */}
            {isEraser ? (
              <input
                type="range"
                min={6}
                max={48}
                value={eraserSize}
                onChange={(e) => setEraserSize(Number(e.target.value))}
                className="w-20 md:w-24 accent-[#19191C] cursor-pointer"
                title={`Eraser size: ${eraserSize}px`}
              />
            ) : (
              <input
                type="range"
                min={2}
                max={24}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="w-20 md:w-24 accent-[#2563EB] cursor-pointer"
                title={`Pen size: ${penSize}px`}
              />
            )}

            <span className="text-[11px] font-mono tabular-nums text-[#6C675E] w-7 text-right">
              {currentToolWidth}px
            </span>
          </div>
        </div>

        {/* Right: Undo, Clear, and Prev/Next */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1.5 rounded-lg text-[#6C675E] hover:text-[#19191C] hover:bg-[#F3EFE6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Undo stroke (Cmd+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="p-1.5 rounded-lg text-[#6C675E] hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Clear letter"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#E2DCD1]" />

          <div className="flex items-center gap-1">
            <button
              onClick={onPrevChar}
              disabled={!hasPrev}
              className="p-1.5 rounded-lg border border-[#E0D9CB] bg-white text-[#19191C] hover:bg-[#F3EFE6] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous letter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onNextChar}
              disabled={!hasNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#19191C] hover:bg-[#2563EB] text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              title="Next letter"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
