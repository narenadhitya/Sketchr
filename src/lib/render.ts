import type { BackgroundKind, Frame, Layer, Point, Stroke } from '../store';
import { TRANSPARENT_FILL, hexToRgb } from './color';

export { hexToRgb, luminance, rgbToHex } from './color';
export { slugify } from './project';

/* ------------------------------------------------------------------ */
/* Flood fill                                                          */
/* ------------------------------------------------------------------ */

const FILL_TOLERANCE = 32;

/**
 * Scanline flood fill bounded by colour similarity. Operates directly on the
 * context's pixels so it respects whatever has already been drawn beneath it.
 */
export const floodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  alpha: number,
) => {
  const { width, height } = ctx.canvas;

  // getImageData/putImageData ignore the context transform, so map the seed
  // point into device pixels — otherwise fills miss on any scaled render
  // (thumbnails and exports both draw through a scaled context).
  const m = ctx.getTransform();
  const x0 = Math.floor(m.a * startX + m.c * startY + m.e);
  const y0 = Math.floor(m.b * startX + m.d * startY + m.f);
  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const start = (y0 * width + x0) * 4;
  const sr = data[start];
  const sg = data[start + 1];
  const sb = data[start + 2];
  const sa = data[start + 3];

  // A transparent fill clears the region instead of painting it.
  const erasing = fillColor === TRANSPARENT_FILL;
  const { r: fr, g: fg, b: fb } = erasing ? { r: 0, g: 0, b: 0 } : hexToRgb(fillColor);
  const fa = erasing ? 0 : Math.round(alpha * 255);

  // Bail out when the seed pixel already carries the fill colour, otherwise
  // the span walk below would never terminate on its own output.
  if (
    Math.abs(sr - fr) < 4 &&
    Math.abs(sg - fg) < 4 &&
    Math.abs(sb - fb) < 4 &&
    Math.abs(sa - fa) < 4
  ) {
    return;
  }

  const matches = (i: number) =>
    Math.abs(data[i] - sr) <= FILL_TOLERANCE &&
    Math.abs(data[i + 1] - sg) <= FILL_TOLERANCE &&
    Math.abs(data[i + 2] - sb) <= FILL_TOLERANCE &&
    Math.abs(data[i + 3] - sa) <= FILL_TOLERANCE;

  const paint = (i: number) => {
    data[i] = fr;
    data[i + 1] = fg;
    data[i + 2] = fb;
    data[i + 3] = fa;
  };

  const stack: number[] = [x0, y0];

  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;

    let left = x;
    let i = (y * width + left) * 4;
    while (left >= 0 && matches(i)) {
      left--;
      i -= 4;
    }
    left++;
    i += 4;

    let spanAbove = false;
    let spanBelow = false;

    while (left < width && matches(i)) {
      paint(i);

      if (y > 0) {
        const above = matches(i - width * 4);
        if (!spanAbove && above) {
          stack.push(left, y - 1);
          spanAbove = true;
        } else if (spanAbove && !above) {
          spanAbove = false;
        }
      }

      if (y < height - 1) {
        const below = matches(i + width * 4);
        if (!spanBelow && below) {
          stack.push(left, y + 1);
          spanBelow = true;
        } else if (spanBelow && !below) {
          spanBelow = false;
        }
      }

      left++;
      i += 4;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

const traceShape = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  const [a, b] = stroke.points;
  if (!a || !b) return;

  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);

  ctx.beginPath();

  switch (stroke.shape) {
    case 'line':
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      break;

    case 'arrow': {
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const head = Math.max(12, stroke.size * 3);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(
        b.x - head * Math.cos(angle - Math.PI / 6),
        b.y - head * Math.sin(angle - Math.PI / 6),
      );
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(
        b.x - head * Math.cos(angle + Math.PI / 6),
        b.y - head * Math.sin(angle + Math.PI / 6),
      );
      break;
    }

    case 'ellipse':
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;

    case 'triangle':
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;

    case 'star': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const outer = Math.min(w, h) / 2;
      const inner = outer * 0.4;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    case 'rect':
    default: {
      const radius = Math.min(8, w / 2, h / 2);
      ctx.roundRect(x, y, w, h, radius);
      break;
    }
  }
};

/* ------------------------------------------------------------------ */
/* Stroke rendering                                                    */
/* ------------------------------------------------------------------ */

/** Midpoint-smoothed path — turns raw pointer samples into a flowing line. */
const traceSmoothPath = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  ctx.beginPath();
  if (points.length === 1) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[0].x + 0.01, points[0].y);
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
};

/**
 * Pressure-tapered ribbon for the brush: each segment is stroked on its own so
 * the width can follow the pointer's pressure.
 */
const drawTaperedStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  const pts = stroke.points;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const pressure = ((prev.p ?? 0.5) + (cur.p ?? 0.5)) / 2;
    ctx.lineWidth = Math.max(0.5, stroke.size * (0.35 + pressure * 1.1));
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
  }
};

/** Draws a single stroke. `layerOpacity` multiplies the stroke's own alpha. */
export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  layerOpacity = 1,
  overrideColor?: string,
) => {
  const color = overrideColor ?? stroke.color;
  const toolAlpha = stroke.opacity ?? 1;

  ctx.save();

  if (stroke.type === 'bucket') {
    // Tinted onion passes have no meaningful fill, so skip them entirely.
    if (!overrideColor) {
      floodFill(ctx, stroke.points[0].x, stroke.points[0].y, color, toolAlpha * layerOpacity);
    }
    ctx.restore();
    return;
  }

  if (stroke.type === 'text') {
    ctx.globalAlpha = toolAlpha * layerOpacity;
    ctx.font = `${stroke.size}px ${stroke.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    (stroke.text || '').split('\n').forEach((line, i) => {
      ctx.fillText(line, stroke.points[0].x, stroke.points[0].y + i * stroke.size * 1.25);
    });
    ctx.restore();
    return;
  }

  if (stroke.type === 'shape') {
    ctx.globalAlpha = toolAlpha * layerOpacity;
    ctx.lineWidth = stroke.size;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    traceShape(ctx, stroke);
    if (stroke.filled) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (!stroke.points.length) {
    ctx.restore();
    return;
  }

  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (stroke.type) {
    case 'highlighter':
      ctx.globalAlpha = 0.35 * toolAlpha * layerOpacity;
      ctx.globalCompositeOperation = 'multiply';
      ctx.lineWidth = stroke.size * 2.5;
      ctx.lineCap = 'square';
      break;

    case 'pencil':
      ctx.globalAlpha = 0.72 * toolAlpha * layerOpacity;
      ctx.lineWidth = Math.max(0.6, stroke.size * 0.7);
      break;

    case 'eraser':
      ctx.globalAlpha = 1;
      // An onion-skin pass draws onto a scratch canvas where erasing would
      // punch through the tint, so paint the tint colour instead.
      ctx.globalCompositeOperation = overrideColor ? 'source-over' : 'destination-out';
      ctx.lineWidth = stroke.size * 2;
      break;

    case 'brush':
      ctx.globalAlpha = toolAlpha * layerOpacity;
      break;

    case 'pen':
    default:
      ctx.globalAlpha = toolAlpha * layerOpacity;
      ctx.lineWidth = stroke.size;
      break;
  }

  if (stroke.type === 'brush') {
    drawTaperedStroke(ctx, stroke);
  } else {
    traceSmoothPath(ctx, stroke.points);
    ctx.stroke();
  }

  ctx.restore();
};

export const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer, tint?: string) => {
  if (!layer.visible) return;
  layer.strokes.forEach((stroke) => drawStroke(ctx, stroke, layer.opacity, tint));
};

export const drawFrame = (ctx: CanvasRenderingContext2D, frame: Frame | undefined, tint?: string) => {
  if (!frame) return;
  frame.layers.forEach((layer) => drawLayer(ctx, layer, tint));
};

/* ------------------------------------------------------------------ */
/* Backgrounds                                                         */
/* ------------------------------------------------------------------ */

/** Paints the paper behind the artwork. `transparent` intentionally no-ops. */
export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  kind: BackgroundKind,
  width: number,
  height: number,
) => {
  if (kind === 'transparent') return;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(20, 24, 60, 0.10)';
  ctx.lineWidth = 1;

  if (kind === 'grid') {
    const step = 60;
    ctx.beginPath();
    for (let x = step; x < width; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = step; y < height; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();
  } else if (kind === 'lined') {
    const step = 80;
    ctx.beginPath();
    for (let y = step; y < height; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();
  } else if (kind === 'dots') {
    const step = 60;
    ctx.fillStyle = 'rgba(20, 24, 60, 0.18)';
    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
};

/* ------------------------------------------------------------------ */
/* Offscreen composition                                               */
/* ------------------------------------------------------------------ */

/** Renders one frame into a fresh canvas at the requested size. */
export const renderFrameToCanvas = (
  frame: Frame | undefined,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  background: BackgroundKind = 'white',
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  drawBackground(ctx, background, targetWidth, targetHeight);
  ctx.scale(targetWidth / sourceWidth, targetHeight / sourceHeight);
  drawFrame(ctx, frame);
  return canvas;
};

export const frameToDataUrl = (
  frame: Frame | undefined,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  background: BackgroundKind = 'white',
) => {
  const targetHeight = Math.round((targetWidth * sourceHeight) / sourceWidth);
  const canvas = renderFrameToCanvas(
    frame,
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    background,
  );
  return canvas.toDataURL('image/jpeg', 0.82);
};

export const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

