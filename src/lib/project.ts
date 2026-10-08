import { v4 as uuidv4 } from 'uuid';

/* ------------------------------------------------------------------ */
/* Domain types                                                        */
/* ------------------------------------------------------------------ */

export interface Point {
  x: number;
  y: number;
  /** 0..1 pointer pressure, used by the brush for taper. */
  p?: number;
}

export type StrokeType =
  | 'pen'
  | 'pencil'
  | 'brush'
  | 'highlighter'
  | 'eraser'
  | 'bucket'
  | 'text'
  | 'shape';

export type ToolId = StrokeType | 'eyedropper' | 'pan';

export type ShapeKind = 'line' | 'rect' | 'ellipse' | 'triangle' | 'star' | 'arrow';

export interface Stroke {
  points: Point[];
  color: string;
  size: number;
  /** 0..1 — user controlled tool opacity, on top of the tool's own alpha. */
  opacity?: number;
  type: StrokeType;
  text?: string;
  fontFamily?: string;
  shape?: ShapeKind;
  filled?: boolean;
}

export interface Layer {
  id: string;
  name: string;
  strokes: Stroke[];
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface Frame {
  id: string;
  layers: Layer[];
  /** How many playback ticks this frame is held for. */
  holdDuration: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  fps: number;
  width: number;
  height: number;
  frameCount: number;
  thumbnail?: string;
}

export type BackgroundKind = 'white' | 'grid' | 'dots' | 'lined' | 'transparent';

export interface CanvasPreset {
  label: string;
  ratio: string;
  width: number;
  height: number;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { label: 'Landscape', ratio: '16:9', width: 1920, height: 1080 },
  { label: 'Square', ratio: '1:1', width: 1080, height: 1080 },
  { label: 'Portrait', ratio: '9:16', width: 1080, height: 1920 },
  { label: 'Classic', ratio: '4:3', width: 1440, height: 1080 },
];

export const FPS_OPTIONS = [5, 8, 10, 12, 15, 20, 24, 30, 60];

/* ------------------------------------------------------------------ */
/* Factories & normalisation                                           */
/* ------------------------------------------------------------------ */

export const createLayer = (name: string): Layer => ({
  id: uuidv4(),
  name,
  strokes: [],
  visible: true,
  locked: false,
  opacity: 1,
});

export const createEmptyFrame = (): Frame => ({
  id: uuidv4(),
  layers: [createLayer('Layer 1')],
  holdDuration: 1,
});

/**
 * Projects saved by older builds — or hand-edited `.sketchr` files — may be
 * missing fields the app now assumes. Backfill them on the way in.
 */
export const normalizeFrames = (frames: Frame[] | undefined): Frame[] => {
  if (!frames?.length) return [createEmptyFrame()];
  return frames.map((f) => ({
    ...f,
    id: f.id ?? uuidv4(),
    holdDuration: f.holdDuration ?? 1,
    layers: (f.layers?.length ? f.layers : [createLayer('Layer 1')]).map((l) => ({
      ...l,
      id: l.id ?? uuidv4(),
      name: l.name ?? 'Layer 1',
      strokes: l.strokes ?? [],
      visible: l.visible ?? true,
      locked: l.locked ?? false,
      opacity: l.opacity ?? 1,
    })),
  }));
};

export const normalizeMeta = (meta: ProjectMeta): ProjectMeta => ({
  ...meta,
  name: meta.name || 'Untitled Project',
  createdAt: meta.createdAt ?? meta.updatedAt ?? Date.now(),
  updatedAt: meta.updatedAt ?? Date.now(),
  fps: meta.fps ?? 12,
  width: meta.width ?? 1920,
  height: meta.height ?? 1080,
  frameCount: meta.frameCount ?? 1,
});

/** Filesystem-safe stem for exported and saved files. */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'sketchr';
