import React, { useEffect, useRef, useState } from 'react';
import {
  Brush,
  Circle,
  Droplet,
  Eraser,
  Highlighter,
  Minus,
  MoveUpRight,
  PaintBucket,
  Pen,
  Pencil,
  Pipette,
  Shapes,
  SlidersHorizontal,
  Square,
  Star,
  Triangle,
  Type,
} from 'lucide-react';
import { useStore } from '../store';
import type { ShapeKind, ToolId } from '../store';
import { PALETTE, RECENT_SLOTS } from '../lib/palette';
import { contrastInk } from '../lib/color';
import { Segmented, Slider, Tooltip } from './ui';

const FONTS = [
  { label: 'Sans', value: 'system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
  { label: 'Comic', value: '"Comic Sans MS", cursive' },
  { label: 'Impact', value: 'Impact, fantasy' },
];

const SHAPES: { value: ShapeKind; icon: React.ReactNode; title: string }[] = [
  { value: 'rect', icon: <Square size={15} />, title: 'Rectangle' },
  { value: 'ellipse', icon: <Circle size={15} />, title: 'Ellipse' },
  { value: 'triangle', icon: <Triangle size={15} />, title: 'Triangle' },
  { value: 'star', icon: <Star size={15} />, title: 'Star' },
  { value: 'line', icon: <Minus size={15} />, title: 'Line' },
  { value: 'arrow', icon: <MoveUpRight size={15} />, title: 'Arrow' },
];

const TOOLS: { id: ToolId; icon: React.ReactNode; label: string; hint: string }[] = [
  { id: 'pen', icon: <Pen size={20} />, label: 'Pen', hint: 'B' },
  { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil', hint: 'P' },
  { id: 'brush', icon: <Brush size={20} />, label: 'Brush', hint: 'N' },
  { id: 'highlighter', icon: <Highlighter size={20} />, label: 'Highlighter', hint: 'H' },
  { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser', hint: 'E' },
];

const EXTRA_TOOLS: { id: ToolId; icon: React.ReactNode; label: string; hint: string }[] = [
  { id: 'shape', icon: <Shapes size={20} />, label: 'Shapes', hint: 'S' },
  { id: 'bucket', icon: <PaintBucket size={20} />, label: 'Fill', hint: 'G' },
  { id: 'text', icon: <Type size={20} />, label: 'Text', hint: 'T' },
  { id: 'eyedropper', icon: <Pipette size={20} />, label: 'Pick colour', hint: 'I' },
];

const TOOL_LABELS: Record<string, string> = {
  pen: 'Pen',
  pencil: 'Pencil',
  brush: 'Brush',
  highlighter: 'Highlighter',
  eraser: 'Eraser',
  shape: 'Shapes',
  bucket: 'Fill',
  text: 'Text',
  eyedropper: 'Colour picker',
  pan: 'Pan',
};

const Toolbar: React.FC = () => {
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const brushColor = useStore((s) => s.brushColor);
  const setBrushColor = useStore((s) => s.setBrushColor);
  const brushSize = useStore((s) => s.brushSize);
  const setBrushSize = useStore((s) => s.setBrushSize);
  const brushOpacity = useStore((s) => s.brushOpacity);
  const setBrushOpacity = useStore((s) => s.setBrushOpacity);
  const fontFamily = useStore((s) => s.fontFamily);
  const setFontFamily = useStore((s) => s.setFontFamily);
  const shapeKind = useStore((s) => s.shapeKind);
  const setShapeKind = useStore((s) => s.setShapeKind);
  const shapeFilled = useStore((s) => s.shapeFilled);
  const setShapeFilled = useStore((s) => s.setShapeFilled);
  const recentColors = useStore((s) => s.recentColors);
  const fillTransparent = useStore((s) => s.fillTransparent);
  const setFillTransparent = useStore((s) => s.setFillTransparent);
  const setSidebarTab = useStore((s) => s.setSidebarTab);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const id = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const pickTool = (id: ToolId) => {
    // Tapping the active tool toggles its settings, like Flipaclip's rail.
    if (tool === id) setOpen((v) => !v);
    else {
      setTool(id);
      setOpen(id !== 'eyedropper');
    }
  };

  const isBucket = tool === 'bucket';

  /** Choosing any real colour cancels a pending transparent fill. */
  const pick = (hex: string) => {
    setBrushColor(hex);
    setFillTransparent(false);
  };

  const isActiveColor = (hex: string) =>
    !(isBucket && fillTransparent) && brushColor.toLowerCase() === hex.toLowerCase();

  const hasStrokeSettings = tool !== 'eyedropper' && tool !== 'pan';
  const showSize = tool !== 'bucket' && tool !== 'eyedropper';

  const renderToolButton = (t: (typeof TOOLS)[number]) => (
    <Tooltip key={t.id} label={t.label} hint={t.hint} side="right">
      <button
        type="button"
        onClick={() => pickTool(t.id)}
        aria-pressed={tool === t.id}
        className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 active:scale-90 ${
          tool === t.id
            ? 'brand-gradient text-white shadow-brand'
            : 'text-ink-2 hover:bg-panel-2 hover:text-ink'
        }`}
      >
        {t.icon}
        {tool === t.id && (
          <span className="absolute -right-px top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white/70" />
        )}
      </button>
    </Tooltip>
  );

  return (
    <div ref={rootRef} className="pointer-events-auto relative flex items-start gap-3">
      {/* tool rail */}
      <div className="flex flex-col items-center gap-1 rounded-[1.75rem] border border-line bg-panel/90 p-2 shadow-float backdrop-blur-xl">
        {TOOLS.map(renderToolButton)}

        <div className="my-1 h-px w-7 bg-line" />

        {EXTRA_TOOLS.map(renderToolButton)}

        <div className="my-1 h-px w-7 bg-line" />

        {/* current colour */}
        <Tooltip label="Colour & size" side="right">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl transition-transform active:scale-90"
          >
            <span
              className="h-7 w-7 rounded-full border-2 border-panel shadow-soft ring-1 ring-line"
              style={{ backgroundColor: brushColor }}
            />
            <span
              className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-panel"
              style={{
                backgroundColor: brushColor,
                opacity: brushOpacity,
              }}
            />
          </button>
        </Tooltip>
      </div>

      {/* settings flyout */}
      {open && hasStrokeSettings && (
        <div
          className="w-[17.5rem] rounded-3xl border border-line bg-panel/95 p-4 shadow-float backdrop-blur-xl"
          style={{ animation: 'slide-left 0.18s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-ink-3">
              {TOOL_LABELS[tool] ?? 'Tool'}
            </h3>

            {/* live preview */}
            <div className="flex h-11 w-16 items-center justify-center overflow-hidden rounded-xl border border-line bg-panel-2">
              {tool === 'text' ? (
                <span
                  className="text-lg font-bold leading-none"
                  style={{ color: brushColor, fontFamily, opacity: brushOpacity }}
                >
                  Aa
                </span>
              ) : tool === 'shape' ? (
                <span style={{ color: brushColor, opacity: brushOpacity }}>
                  {SHAPES.find((s) => s.value === shapeKind)?.icon}
                </span>
              ) : (
                <span
                  className="rounded-full"
                  style={{
                    backgroundColor: brushColor,
                    width: Math.min(brushSize, 36),
                    height: Math.min(brushSize, 36),
                    opacity:
                      brushOpacity *
                      (tool === 'highlighter' ? 0.35 : tool === 'pencil' ? 0.72 : 1),
                  }}
                />
              )}
            </div>
          </div>

          {tool === 'shape' && (
            <div className="mb-4">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-3">
                Shape
              </span>
              <div className="grid grid-cols-6 gap-1">
                {SHAPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    title={s.title}
                    onClick={() => setShapeKind(s.value)}
                    className={`flex h-9 items-center justify-center rounded-lg transition-colors ${
                      shapeKind === s.value
                        ? 'bg-brand text-white'
                        : 'bg-panel-2 text-ink-2 hover:text-ink'
                    }`}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <Segmented
                  size="sm"
                  value={shapeFilled ? 'fill' : 'stroke'}
                  onChange={(v) => setShapeFilled(v === 'fill')}
                  options={[
                    { value: 'stroke', label: 'Outline' },
                    { value: 'fill', label: 'Filled' },
                  ]}
                />
              </div>
            </div>
          )}

          {tool === 'text' && (
            <div className="mb-4">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-3">
                Font
              </span>
              <div className="grid grid-cols-5 gap-1">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFontFamily(f.value)}
                    style={{ fontFamily: f.value }}
                    className={`h-9 rounded-lg text-[11px] font-bold transition-colors ${
                      fontFamily === f.value
                        ? 'bg-brand text-white'
                        : 'bg-panel-2 text-ink-2 hover:text-ink'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSize && (
            <div className="mb-3">
              <Slider
                label={tool === 'text' ? 'Font size' : 'Size'}
                value={brushSize}
                min={1}
                max={120}
                suffix="px"
                onChange={setBrushSize}
              />
              <div className="mt-1.5 flex gap-1">
                {[2, 6, 12, 24, 48].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBrushSize(s)}
                    className={`flex h-7 flex-1 items-center justify-center rounded-lg text-[10px] font-bold transition-colors ${
                      brushSize === s
                        ? 'bg-brand-soft text-brand'
                        : 'bg-panel-2 text-ink-3 hover:text-ink-2'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <Slider
              label="Opacity"
              value={Math.round(brushOpacity * 100)}
              min={5}
              max={100}
              suffix="%"
              onChange={(v) => setBrushOpacity(v / 100)}
            />
          </div>

          {/* colour */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                Colour
              </span>
              <div className="flex items-center gap-1.5">
                <span className="tabular text-[10px] font-bold uppercase text-ink-3">
                  {isBucket && fillTransparent ? 'none' : brushColor}
                </span>
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <input
                    type="color"
                    className="sk-color absolute inset-0 h-full w-full rounded-full"
                    value={brushColor}
                    onChange={(e) => pick(e.target.value)}
                    title="Custom colour"
                  />
                  <Droplet
                    size={11}
                    className="pointer-events-none relative"
                    style={{ color: contrastInk(brushColor) }}
                  />
                </span>
              </div>
            </div>

            {/* the ten most recent colours */}
            <div className="mb-2 grid grid-cols-5 gap-1.5">
              {Array.from({ length: RECENT_SLOTS }).map((_, i) => {
                const c = recentColors[i];
                return c ? (
                  <button
                    key={`recent-${c}`}
                    type="button"
                    onClick={() => pick(c)}
                    style={{ backgroundColor: c }}
                    title={`Recent · ${c}`}
                    className={`h-6 rounded-md ring-1 ring-inset ring-black/15 transition-transform hover:scale-110 ${
                      isActiveColor(c) ? 'ring-2 ring-brand' : ''
                    }`}
                  />
                ) : (
                  <span
                    key={`recent-empty-${i}`}
                    className="h-6 rounded-md border border-dashed border-line-2"
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {/* the bucket can fill with nothing at all, clearing the region */}
              {isBucket && (
                <button
                  type="button"
                  onClick={() => setFillTransparent(true)}
                  title="Transparent fill — clears the region"
                  className={`checkerboard col-span-1 h-8 rounded-lg ring-1 ring-inset ring-black/15 transition-all hover:scale-105 ${
                    fillTransparent ? 'scale-105 ring-2 ring-brand ring-offset-2 ring-offset-panel' : ''
                  }`}
                />
              )}
              {PALETTE.slice(0, isBucket ? PALETTE.length - 1 : PALETTE.length).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => pick(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} · ${c.hex}`}
                  className={`h-8 rounded-lg ring-1 ring-inset ring-black/15 transition-all hover:scale-105 ${
                    isActiveColor(c.hex)
                      ? 'scale-105 ring-2 ring-brand ring-offset-2 ring-offset-panel'
                      : ''
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSidebarTab('color');
              }}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-panel-2 py-2 text-[11px] font-extrabold text-ink-2 transition-colors hover:text-ink"
            >
              <SlidersHorizontal size={12} />
              Advanced colour
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
