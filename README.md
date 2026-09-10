# Sketchr Web Prototype

Sketchr is a fast, web-based 2D frame-by-frame animation application inspired by Flipaclip. Built as a rapid prototype, it aims to provide a robust, responsive, and intuitive drawing experience right in your browser.

## Features

- **Multi-Project Management**: Home screen UI with recent projects, live thumbnail generation, and local saving via IndexedDB (`localforage`).
- **Advanced Drawing Engine**: Vector-based HTML5 canvas drawing support with scalable and replayable strokes.
- **Brush Tools**: 
  - **Pen**: Solid lines.
  - **Pencil**: Pressure-simulated 70% opacity.
  - **Highlighter**: Thick, multiply blend-mode strokes.
  - **Eraser**: True `destination-out` erasing (uses a dual-canvas engine so you don't accidentally erase the onion skin).
- **Flood Fill (Bucket Tool)**: A true bounded scanline flood-fill algorithm that instantly fills enclosed regions on the canvas without filling the entire screen.
- **Interactive Text Tool**: Add text with 5 different font families (`Sans Serif`, `Serif`, `Monospace`, `Cursive`, `Impact`), adjustable sizing, live typing, and drag-and-drop repositioning before committing.
- **Animation Timeline**: 
  - Add, switch, and manage frames easily.
  - **Onion Skinning**: See a ghosted version of the previous frame to align your animations (auto-hides during playback).
  - **Playback Controls**: Play, pause, loop toggles, and variable FPS limits (5, 10, 12, 20, 24, 30, 60).
- **Custom Palette**: 25 pre-defined quick-select colors and a dynamic brush-size slider.

## Tech Stack

- **Frontend Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Storage**: LocalForage (IndexedDB offline saving)
- **Icons**: Lucide React

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/narenadhitya/Sketchr.git
   cd Sketchr/sketchr-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view it in the browser.
