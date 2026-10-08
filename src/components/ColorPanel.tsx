import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Check, Copy, Pipette, Squircle, Trash2, X } from 'lucide-react';
import { useStore } from '../store';
import {
  contrastInk,
  harmonies,
  hexToHsv,
  hsvToHex,
  isValidHex,
  normalizeHex,
  shadeRamp,
} from '../lib/color';
import { PALETTE, RECENT_SLOTS } from '../lib/palette';
import { IconButton, Slider, Tooltip } from './ui';

/* ------------------------------------------------------------------ */
/* Saturation / value field                                            */
/* ------------------------------------------------------------------ */

const SvField: React.FC<{
  hue: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
}> = ({ hue, s, v, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      onChange(nx, 1 - ny);
    },
    [onChange],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && pick(e.clientX, e.clientY);
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [pick]);

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        pick(e.clientX, e.clientY);
      }}
      className="relative h-32 w-full cursor-crosshair touch-none rounded-xl ring-1 ring-inset ring-black/15"
      style={{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue} 100% 50%))`,
      }}
    >
      <span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, backgroundColor: hsvToHex({ h: hue, s, v }) }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Swatch                                                              */
/* ------------------------------------------------------------------ */

const Swatch: React.FC<{
  color: string;
  active?: boolean;
  title?: string;
  onClick: () => void;
  onRemove?: () => void;
  className?: string;
}> = ({ color, active, title, onClick, onRemove, className = '' }) => (
  <span className={`group/sw relative block ${className}`}>
    <button
      type="button"
      title={title ?? color}
      onClick={onClick}
      style={{ backgroundColor: color }}
      className={`h-full w-full rounded-lg ring-1 ring-inset ring-black/15 transition-transform hover:scale-105 ${
        active ? 'ring-2 ring-brand ring-offset-2 ring-offset-panel' : ''
      }`}
    />
    {onRemove && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${color}`}
        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-ink text-app shadow-soft group-hover/sw:flex"
      >
        <X size={9} />
      </button>
    )}
  </span>
);

/* ------------------------------------------------------------------ */

const ColorPanel: React.FC = () => {
  const brushColor = useStore((s) => s.brushColor);
  const setBrushColor = useStore((s) => s.setBrushColor);
  const brushOpacity = useStore((s) => s.brushOpacity);
  const setBrushOpacity = useStore((s) => s.setBrushOpacity);
  const recentColors = useStore((s) => s.recentColors);
  const savedColors = useStore((s) => s.savedColors);
  const addSavedColor = useStore((s) => s.addSavedColor);
  const removeSavedColor = useStore((s) => s.removeSavedColor);
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const lastDrawTool = useStore((s) => s.lastDrawTool);
  const fillTransparent = useStore((s) => s.fillTransparent);
  const setFillTransparent = useStore((s) => s.setFillTransparent);
  const toast = useStore((s) => s.toast);

  const hsv = hexToHsv(brushColor);
  const [hexDraft, setHexDraft] = useState(brushColor);
  const [lastColor, setLastColor] = useState(brushColor);

  // Keep the hex field in step when the colour changes elsewhere.
  if (lastColor !== brushColor) {
    setLastColor(brushColor);
    setHexDraft(brushColor);
  }

  const pick = (hex: string) => {
    setBrushColor(hex);
    setFillTransparent(false);
  };

  const commitHex = () => {
    if (isValidHex(hexDraft)) pick(normalizeHex(hexDraft));
    else setHexDraft(brushColor);
  };

  const ramp = shadeRamp(brushColor);
  const isBucket = tool === 'bucket';

  return (
    <div className="space-y-5 p-4">
      {/* ---------- current colour ---------- */}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/15 ${
            fillTransparent && isBucket ? 'checkerboard' : ''
          }`}
          style={{
            backgroundColor: fillTransparent && isBucket ? undefined : brushColor,
            opacity: fillTransparent && isBucket ? 1 : brushOpacity,
          }}
        >
          {fillTransparent && isBucket && <Squircle size={16} className="text-ink-3" />}
        </span>

        <div className="min-w-0 flex-1">
          <input
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={commitHex}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitHex();
              e.stopPropagation();
            }}
            spellCheck={false}
            className="w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 font-mono text-[12px] font-bold uppercase text-ink outline-none focus:border-brand"
          />
          <p className="tabular mt-1 text-[10px] font-bold text-ink-3">
            H {Math.round(hsv.h)}° · S {Math.round(hsv.s * 100)}% · V {Math.round(hsv.v * 100)}%
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <Tooltip label="Pick from canvas" hint="I" side="left">
            <IconButton
              size="sm"
              active={tool === 'eyedropper'}
              onClick={() => setTool(tool === 'eyedropper' ? lastDrawTool : 'eyedropper')}
            >
              <Pipette size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip label="Copy hex" side="left">
            <IconButton
              size="sm"
              onClick={() => {
                void navigator.clipboard?.writeText(brushColor);
                toast(`${brushColor} copied`);
              }}
            >
              <Copy size={14} />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* ---------- picker ---------- */}
      <div className="space-y-2">
        <SvField
          hue={hsv.h}
          s={hsv.s}
          v={hsv.v}
          onChange={(s, v) => pick(hsvToHex({ h: hsv.h, s, v }))}
        />
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(hsv.h)}
          onChange={(e) => pick(hsvToHex({ ...hsv, h: Number(e.target.value) }))}
          className="h-5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{
            background:
              'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }}
          aria-label="Hue"
        />
      </div>

      <Slider
        label="Opacity"
        value={Math.round(brushOpacity * 100)}
        min={5}
        max={100}
        suffix="%"
        onChange={(v) => setBrushOpacity(v / 100)}
      />

      {/* ---------- transparent fill ---------- */}
      {isBucket && (
        <button
          type="button"
          onClick={() => setFillTransparent(!fillTransparent)}
          className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
            fillTransparent
              ? 'border-brand bg-brand-soft'
              : 'border-line hover:border-line-2 hover:bg-panel-2'
          }`}
        >
          <span className="checkerboard h-8 w-8 shrink-0 rounded-lg ring-1 ring-inset ring-black/15" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-extrabold text-ink">Transparent fill</span>
            <span className="block text-[10px] font-semibold text-ink-3">
              Clears the region instead of painting it
            </span>
          </span>
          {fillTransparent && <Check size={15} className="shrink-0 text-brand" />}
        </button>
      )}

      {/* ---------- shades & tints ---------- */}
      <section>
        <h4 className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
          Shades &amp; tints
        </h4>
        <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-inset ring-black/15">
          {ramp.map((c, i) => (
            <button
              key={`${c}-${i}`}
              type="button"
              title={c}
              onClick={() => pick(c)}
              style={{ backgroundColor: c }}
              className="h-full flex-1 transition-transform hover:scale-y-110"
            />
          ))}
        </div>
      </section>

      {/* ---------- harmonies ---------- */}
      <section>
        <h4 className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
          Harmonies
        </h4>
        <div className="space-y-1">
          {harmonies(brushColor).map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[10px] font-bold text-ink-3">{group.label}</span>
              <div className="flex flex-1 gap-1">
                {group.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => pick(c)}
                    style={{ backgroundColor: c, color: contrastInk(c) }}
                    className="h-6 flex-1 rounded-md text-[9px] font-bold uppercase ring-1 ring-inset ring-black/15 transition-transform hover:scale-105"
                  >
                    {c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- recents ---------- */}
      <section>
        <h4 className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
          Recent
        </h4>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: RECENT_SLOTS }).map((_, i) => {
            const c = recentColors[i];
            return c ? (
              <Swatch
                key={`recent-${c}`}
                color={c}
                active={!fillTransparent && brushColor.toLowerCase() === c.toLowerCase()}
                onClick={() => pick(c)}
                className="h-7"
              />
            ) : (
              <span
                key={`recent-empty-${i}`}
                className="h-7 rounded-lg border border-dashed border-line-2"
              />
            );
          })}
        </div>
      </section>

      {/* ---------- saved swatches ---------- */}
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
            My swatches
          </h4>
          <button
            type="button"
            onClick={() => {
              addSavedColor(brushColor);
              toast('Swatch saved');
            }}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold text-brand transition-colors hover:bg-brand-soft"
          >
            <BookmarkPlus size={12} />
            Save
          </button>
        </div>
        {savedColors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-2 px-2 py-2.5 text-center text-[10px] font-semibold text-ink-3">
            Save colours you reuse — they stay across sessions
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {savedColors.map((c) => (
              <Swatch
                key={`saved-${c}`}
                color={c}
                active={!fillTransparent && brushColor.toLowerCase() === c.toLowerCase()}
                onClick={() => pick(c)}
                onRemove={() => removeSavedColor(c)}
                className="h-7"
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- palette ---------- */}
      <section>
        <h4 className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
          Palette
        </h4>
        <div className="grid grid-cols-5 gap-1.5">
          {PALETTE.map((c) => (
            <Swatch
              key={c.hex}
              color={c.hex}
              title={`${c.name} · ${c.hex}`}
              active={!fillTransparent && brushColor.toLowerCase() === c.hex}
              onClick={() => pick(c.hex)}
              className="h-8"
            />
          ))}
        </div>
      </section>

      {savedColors.length > 0 && (
        <button
          type="button"
          onClick={() => {
            savedColors.forEach(removeSavedColor);
            toast('Swatches cleared');
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold text-ink-3 transition-colors hover:bg-bad/10 hover:text-bad"
        >
          <Trash2 size={11} />
          Clear saved swatches
        </button>
      )}
    </div>
  );
};

export default ColorPanel;
