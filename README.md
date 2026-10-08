# Sketchr Web

Sketchr is a fast, web-based 2D frame-by-frame animation studio, inspired by FlipaClip. It runs
entirely in the browser — no account, no server, no upload. Projects live in IndexedDB on your own
machine.

## Features

### Projects
- Home gallery with live cover thumbnails rendered from frame 1 of each project.
- Search, sort (recent / name / created) and a "Continue" card for the project you touched last.
- Rename, duplicate and delete projects, with a confirmation step before anything is destroyed.
- New-project sheet with canvas presets — 16:9, 1:1, 9:16, 4:3 — and a frame-rate picker.
- Light and dark themes, remembered between sessions and defaulting to your system preference.

### Drawing
- **Pen** — clean, constant-width strokes.
- **Pencil** — lighter, slightly translucent line.
- **Brush** — pressure-tapered ribbon that responds to stylus pressure.
- **Highlighter** — wide, multiply-blended marker.
- **Eraser** — true `destination-out` erasing that leaves the onion skin and paper untouched.
- **Shapes** — rectangle, ellipse, triangle, star, line and arrow, filled or outlined.
- **Fill** — scanline flood fill bounded by colour similarity.
- **Text** — five typefaces, live in-canvas editing, multi-line.
- **Colour picker** — sample any colour already on the canvas.
- Every stroke is smoothed with midpoint curves, and carries its own size and opacity.
- 25-swatch palette, a native colour picker for anything else, and a recent-colours row.
- Straight-line ruler, 15° angle snapping with Shift, and vertical/horizontal symmetry drawing.

### Animation
- Timeline with real thumbnails of every frame, drag-to-reorder, and a right-click menu for
  duplicate / copy / delete / frame hold.
- Frame hold (×1–×24) so a drawing can linger without redrawing it.
- Onion skin with up to four frames before and after, adjustable strength, and colour tinting
  (pink for the past, teal for the future).
- Playback honours per-frame hold, with loop, step, and jump-to-first/last controls.
- Frame rates from 5 to 60 fps, with a live duration readout.

### Layers
- Up to 12 layers per frame, each with its own thumbnail.
- Show/hide, lock, rename, reorder, duplicate, merge down and per-layer opacity.

### Canvas
- Zoom to cursor with the wheel, pan with Alt-drag or the middle mouse button, and reset the view.
- Paper backgrounds: plain, grid, dots, ruled, or transparent.
- Brush-size cursor ring so you always know how big your mark will be.

### Export
- Current frame as PNG.
- The whole animation as a numbered PNG sequence.
- The whole animation as a WebM video, recorded at the project's frame rate.
- 0.5× / 1× / 2× output scaling, and an optional transparent background for stills.

### Elsewhere
- Debounced autosave with a visible save indicator, plus a save on exit.
- Snapshot-based undo/redo (80 steps) covering strokes, frames and layers.
- Full keyboard map — press `?` in the editor to see it.

## Tech stack

- **React 19** + **Vite 8**
- **TypeScript**
- **Tailwind CSS v4** — semantic design tokens in `src/index.css`, themed by `[data-theme]`
- **Zustand** for state
- **LocalForage** (IndexedDB) for offline persistence
- **Lucide React** for icons

## Project layout

```
src/
  store.ts              Zustand store: project, frame, layer, tool and UI state
  lib/render.ts          Canvas rendering — strokes, shapes, flood fill, backgrounds, export helpers
  hooks/useShortcuts.ts  Editor-wide keyboard map
  components/
    Home.tsx             Project gallery
    Editor.tsx           Editor shell, autosave, thumbnail generation
    DrawingCanvas.tsx    Canvas stack: paper, onion skin, artwork, overlays
    Toolbar.tsx          Tool rail and tool settings flyout
    Timeline.tsx         Frame track, playback, onion-skin controls
    LayersPanel.tsx      Layer stack
    Topbar.tsx           Project name, history, view controls, export
    FramePreview.tsx     Miniature frame/layer renderer
    ui.tsx               Shared primitives (Modal, Popover, Slider, Tooltip, …)
```

## Getting started

```bash
cd sketchr-web
npm install
npm run dev
```

Open http://localhost:5173.

```bash
npm run build    # typecheck + production build
npm run lint     # oxlint
```
