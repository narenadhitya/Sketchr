import React, { useEffect, useRef } from 'react';
import type { Frame, Layer } from '../store';
import { drawFrame, drawLayer } from '../lib/render';

/** Thumbnails render at a fixed long edge — enough for a legible preview
 *  without re-rasterising a 1920px frame for every timeline cell. */
const THUMB_LONG_EDGE = 180;

interface Props {
  frame?: Frame;
  layer?: Layer;
  /** Project canvas size — strokes are stored in this coordinate space. */
  canvasWidth: number;
  canvasHeight: number;
  className?: string;
}

/**
 * Replays a frame (or a single layer) into a small canvas so the timeline and
 * layer stack show real artwork instead of empty boxes.
 */
const FramePreview: React.FC<Props> = ({
  frame,
  layer,
  canvasWidth,
  canvasHeight,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement>(null);

  const scale = THUMB_LONG_EDGE / Math.max(canvasWidth, canvasHeight);
  const width = Math.max(1, Math.round(canvasWidth * scale));
  const height = Math.max(1, Math.round(canvasHeight * scale));

  // Redraw whenever the frame/layer object identity changes — every store
  // mutator rebuilds the objects it touches, so this stays cheap and correct.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(canvas.width / canvasWidth, canvas.height / canvasHeight);
    if (layer) drawLayer(ctx, layer);
    else if (frame) drawFrame(ctx, frame);
    ctx.restore();
  }, [frame, layer, canvasWidth, canvasHeight, width, height]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={`h-full w-full object-contain ${className}`}
    />
  );
};

export default FramePreview;
