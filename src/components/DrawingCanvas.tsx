import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { Point, Stroke, StrokeType } from '../store';
import { drawBackground, drawFrame, drawStroke, rgbToHex } from '../lib/render';
import { TRANSPARENT_FILL } from '../lib/color';

const ONION_PREV_TINT = '#ff4d79';
const ONION_NEXT_TINT = '#35c9d6';

/**
 * Space reserved for the floating chrome (topbar, tool rail, layers panel and
 * timeline). The canvas is centred inside what is left, so artwork is never
 * hidden underneath a panel.
 */
const CHROME_INSET = { top: 92, bottom: 156, left: 92, right: 92 };

/** The right dock is much wider than the default gutter it sits in. */
const SIDEBAR_INSET = 340;

/** Renders a frame offscreen, optionally flattened to a single tint colour. */
const renderOnionLayer = (
  frame: Parameters<typeof drawFrame>[1],
  width: number,
  height: number,
  tint?: string,
) => {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return off;

  drawFrame(ctx, frame);
  if (tint) {
    // `source-in` keeps the alpha shape of the artwork and swaps its colour,
    // so erased holes stay holes instead of becoming solid tint.
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, width, height);
  }
  return off;
};

const mirrorStroke = (stroke: Stroke, axis: 'vertical' | 'horizontal', w: number, h: number): Stroke => ({
  ...stroke,
  points: stroke.points.map((p) =>
    axis === 'vertical' ? { ...p, x: w - p.x } : { ...p, y: h - p.y },
  ),
});

/** Snap an angle to the nearest 15° increment, for shift-constrained lines. */
const snapAngle = (from: Point, to: Point): Point => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const step = Math.PI / 12;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  return { x: from.x + Math.cos(angle) * dist, y: from.y + Math.sin(angle) * dist };
};

const DrawingCanvas: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onionRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const frames = useStore((s) => s.frames);
  const currentFrameIndex = useStore((s) => s.currentFrameIndex);
  const activeLayerIndex = useStore((s) => s.activeLayerIndex);
  const tool = useStore((s) => s.tool);
  const brushColor = useStore((s) => s.brushColor);
  const brushSize = useStore((s) => s.brushSize);
  const brushOpacity = useStore((s) => s.brushOpacity);
  const fontFamily = useStore((s) => s.fontFamily);
  const shapeKind = useStore((s) => s.shapeKind);
  const shapeFilled = useStore((s) => s.shapeFilled);
  const addStroke = useStore((s) => s.addStroke);
  const onionSkin = useStore((s) => s.onionSkin);
  const onionPrevCount = useStore((s) => s.onionPrevCount);
  const onionNextCount = useStore((s) => s.onionNextCount);
  const onionOpacity = useStore((s) => s.onionOpacity);
  const onionTinted = useStore((s) => s.onionTinted);
  const isPlaying = useStore((s) => s.isPlaying);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);
  const background = useStore((s) => s.background);
  const zoom = useStore((s) => s.zoom);
  const panX = useStore((s) => s.panX);
  const panY = useStore((s) => s.panY);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const symmetry = useStore((s) => s.symmetry);
  const isRulerActive = useStore((s) => s.isRulerActive);
  const setBrushColor = useStore((s) => s.setBrushColor);
  const setTool = useStore((s) => s.setTool);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const fillTransparent = useStore((s) => s.fillTransparent);

  const [fitScale, setFitScale] = useState(1);
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null);
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [altHeld, setAltHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const drawing = useRef(false);
  const panning = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const shiftHeld = useRef(false);
  /** Mirrors `liveStroke` so pointerup always commits the newest samples. */
  const liveRef = useRef<Stroke | null>(null);

  const setLive = useCallback((next: Stroke | null) => {
    liveRef.current = next;
    setLiveStroke(next);
  }, []);

  const activeLayer = frames[currentFrameIndex]?.layers[activeLayerIndex];
  const layerLocked = activeLayer?.locked ?? false;
  const totalScale = fitScale * zoom;
  const panMode = tool === 'pan' || altHeld;

  /* ---------------- fit the stage to the available space ---------------- */

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setFitScale(
        Math.max(0.05, Math.min(width / canvasWidth, height / canvasHeight)),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasWidth, canvasHeight]);

  /* ---------------- modifier keys ---------------- */

  useEffect(() => {
    // Space is reserved for play/pause, so Alt is the temporary pan modifier.
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = true;
      if (e.altKey) setAltHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = false;
      if (!e.altKey) setAltHeld(false);
    };
    const blur = () => {
      shiftHeld.current = false;
      setAltHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  /* ---------------- background ---------------- */

  useEffect(() => {
    const ctx = bgRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawBackground(ctx, background, canvasWidth, canvasHeight);
  }, [background, canvasWidth, canvasHeight]);

  /* ---------------- onion skin ---------------- */

  useEffect(() => {
    const canvas = onionRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (!onionSkin || isPlaying) return;

    // Furthest frames first so the nearest neighbour reads strongest.
    for (let d = onionPrevCount; d >= 1; d--) {
      const frame = frames[currentFrameIndex - d];
      if (!frame) continue;
      ctx.globalAlpha = onionOpacity * (1 - (d - 1) / (onionPrevCount + 1));
      ctx.drawImage(
        renderOnionLayer(frame, canvasWidth, canvasHeight, onionTinted ? ONION_PREV_TINT : undefined),
        0,
        0,
      );
    }

    for (let d = onionNextCount; d >= 1; d--) {
      const frame = frames[currentFrameIndex + d];
      if (!frame) continue;
      ctx.globalAlpha = onionOpacity * (1 - (d - 1) / (onionNextCount + 1));
      ctx.drawImage(
        renderOnionLayer(frame, canvasWidth, canvasHeight, onionTinted ? ONION_NEXT_TINT : undefined),
        0,
        0,
      );
    }

    ctx.globalAlpha = 1;
  }, [
    frames,
    currentFrameIndex,
    onionSkin,
    onionPrevCount,
    onionNextCount,
    onionOpacity,
    onionTinted,
    isPlaying,
    canvasWidth,
    canvasHeight,
  ]);

  /* ---------------- artwork ---------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawFrame(ctx, frames[currentFrameIndex]);
    if (liveStroke) drawStroke(ctx, liveStroke, activeLayer?.opacity ?? 1);
  }, [frames, currentFrameIndex, liveStroke, canvasWidth, canvasHeight, activeLayer?.opacity]);

  /* ---------------- coordinate helpers ---------------- */

  const toCanvas = useCallback((e: React.PointerEvent | PointerEvent | WheelEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasWidth,
      y: ((e.clientY - rect.top) / rect.height) * canvasHeight,
    };
  }, [canvasWidth, canvasHeight]);

  /* ---------------- zoom on wheel, anchored at the cursor ---------------- */

  useEffect(() => {
    const el = outerRef.current;
    const box = containerRef.current;
    if (!el || !box) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.shiftKey) {
        setPan(panX - e.deltaY, panY);
        return;
      }

      const rect = box.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const nextZoom = Math.min(8, Math.max(0.2, zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      const nextTotal = fitScale * nextZoom;

      // Keep the canvas point under the pointer pinned in place.
      const qx = (e.clientX - cx - panX) / totalScale;
      const qy = (e.clientY - cy - panY) / totalScale;
      setPan(e.clientX - cx - qx * nextTotal, e.clientY - cy - qy * nextTotal);
      setZoom(nextZoom);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, panX, panY, fitScale, totalScale, setPan, setZoom]);

  /* ---------------- text commit ---------------- */

  // Committing straight from the current draft (rather than inside a state
  // updater) keeps addStroke out of render, where StrictMode would double it.
  const commitText = useCallback(() => {
    if (!textDraft) return;
    if (textDraft.value.trim()) {
      addStroke({
        points: [{ x: textDraft.x, y: textDraft.y }],
        color: brushColor,
        size: brushSize,
        opacity: brushOpacity,
        type: 'text',
        text: textDraft.value,
        fontFamily,
      });
    }
    setTextDraft(null);
  }, [textDraft, addStroke, brushColor, brushSize, brushOpacity, fontFamily]);

  useEffect(() => {
    if (textDraft) textInputRef.current?.focus();
  }, [textDraft]);

  // Note: switching tool or frame while a text box is open moves focus away
  // from the textarea, and its onBlur commits the text — no extra sync needed.

  /* ---------------- pointer handling ---------------- */

  const beginPan = (e: React.PointerEvent) => {
    panning.current = { startX: e.clientX, startY: e.clientY, panX, panY };
    setIsPanning(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Middle mouse and Alt always pan, whatever tool is selected.
    if (panMode || e.button === 1 || e.altKey) {
      beginPan(e);
      return;
    }
    if (e.button !== 0) return;

    const point = toCanvas(e);

    if (tool === 'eyedropper') {
      const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const [r, g, b, a] = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
        if (a > 0) {
          setBrushColor(rgbToHex({ r, g, b }));
          useStore.getState().setFillTransparent(false);
          useStore.getState().toast('Colour picked');
        }
      }
      setTool(useStore.getState().lastDrawTool);
      return;
    }

    if (tool === 'text') {
      if (textDraft) commitText();
      setTextDraft({ x: point.x, y: point.y, value: '' });
      return;
    }

    if (textDraft) commitText();
    if (layerLocked) {
      useStore.getState().toast('This layer is locked', 'error');
      return;
    }

    if (tool === 'bucket') {
      addStroke({
        points: [point],
        color: fillTransparent ? TRANSPARENT_FILL : brushColor,
        size: brushSize,
        opacity: brushOpacity,
        type: 'bucket',
      });
      return;
    }

    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setLive({
      points: [{ ...point, p: e.pressure || 0.5 }],
      color: brushColor,
      size: brushSize,
      opacity: brushOpacity,
      type: tool as StrokeType,
      ...(tool === 'shape' ? { shape: shapeKind, filled: shapeFilled } : {}),
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toCanvas(e);
    setCursor(point);

    if (panning.current) {
      const p = panning.current;
      setPan(p.panX + (e.clientX - p.startX), p.panY + (e.clientY - p.startY));
      return;
    }

    if (!drawing.current) return;

    const prev = liveRef.current;
    if (!prev) return;
    const start = prev.points[0];
    const pressure = e.pressure || 0.5;

    // Shapes and the ruler are always defined by just their two endpoints.
    if (prev.type === 'shape' || isRulerActive) {
      const end = shiftHeld.current ? snapAngle(start, point) : point;
      setLive({ ...prev, points: [start, { ...end, p: pressure }] });
    } else {
      setLive({ ...prev, points: [...prev.points, { ...point, p: pressure }] });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panning.current) {
      panning.current = null;
      setIsPanning(false);
      return;
    }
    if (!drawing.current) return;

    drawing.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    const stroke = liveRef.current;
    if (stroke) {
      addStroke(stroke);
      if (symmetry !== 'off') {
        addStroke(mirrorStroke(stroke, symmetry, canvasWidth, canvasHeight));
      }
    }
    setLive(null);
  };

  /* ---------------- cursor ---------------- */

  const showBrushRing =
    !panMode &&
    cursor !== null &&
    ['pen', 'pencil', 'brush', 'highlighter', 'eraser'].includes(tool);

  const cssCursor = panMode
    ? isPanning
      ? 'grabbing'
      : 'grab'
    : tool === 'text'
      ? 'text'
      : tool === 'bucket' || tool === 'eyedropper'
        ? 'copy'
        : showBrushRing
          ? 'none'
          : 'crosshair';

  return (
    <div ref={outerRef} className="relative h-full w-full overflow-hidden bg-mat">
      <div
        ref={containerRef}
        className="absolute"
        style={{
          top: CHROME_INSET.top,
          bottom: CHROME_INSET.bottom,
          left: CHROME_INSET.left,
          right: sidebarOpen ? SIDEBAR_INSET : CHROME_INSET.right,
        }}
      >
      <div
        ref={stageRef}
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          // No transition here: pointer coordinates are read from the live
          // bounding box, so an animating transform would offset strokes.
          transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${totalScale})`,
        }}
      >
        {/* paper */}
        <div
          className={`absolute inset-0 rounded-[2px] ${
            background === 'transparent' ? 'checkerboard' : 'bg-white'
          }`}
          style={{ boxShadow: '0 10px 60px rgba(10, 14, 40, 0.22)' }}
        />

        <canvas
          ref={bgRef}
          width={canvasWidth}
          height={canvasHeight}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <canvas
          ref={onionRef}
          width={canvasWidth}
          height={canvasHeight}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={() => setCursor(null)}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: cssCursor }}
        />

        {/* symmetry guide */}
        {symmetry !== 'off' && (
          <div
            className="pointer-events-none absolute bg-brand/35"
            style={
              symmetry === 'vertical'
                ? { left: '50%', top: 0, bottom: 0, width: Math.max(2, 2 / totalScale) }
                : { top: '50%', left: 0, right: 0, height: Math.max(2, 2 / totalScale) }
            }
          />
        )}

        {/* live text box */}
        {textDraft && (
          <textarea
            ref={textInputRef}
            value={textDraft.value}
            onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
            onBlur={commitText}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                e.preventDefault();
                commitText();
              }
            }}
            spellCheck={false}
            placeholder="Type…"
            className="absolute resize-none overflow-hidden rounded-md border-2 border-dashed border-brand bg-transparent p-0 outline-none"
            style={{
              left: textDraft.x,
              top: textDraft.y,
              color: brushColor,
              fontFamily,
              fontSize: brushSize,
              lineHeight: 1.25,
              minWidth: brushSize * 6,
              height: brushSize * 1.5 * (textDraft.value.split('\n').length || 1),
              caretColor: brushColor,
            }}
          />
        )}

        {/* brush size preview ring */}
        {showBrushRing && cursor && (
          <div
            className="pointer-events-none absolute rounded-full border border-black/70 mix-blend-difference"
            style={{
              left: cursor.x,
              top: cursor.y,
              width: brushSize * (tool === 'highlighter' ? 2.5 : tool === 'eraser' ? 2 : 1),
              height: brushSize * (tool === 'highlighter' ? 2.5 : tool === 'eraser' ? 2 : 1),
              transform: 'translate(-50%, -50%)',
              borderColor: '#ffffff',
              borderWidth: Math.max(1, 1.5 / totalScale),
            }}
          />
        )}
      </div>
      </div>

      {/* locked-layer notice */}
      {layerLocked && !isPlaying && (
        <div className="pointer-events-none absolute left-1/2 top-28 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-2 text-xs font-bold text-app shadow-float">
          Layer “{activeLayer?.name}” is locked
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;
