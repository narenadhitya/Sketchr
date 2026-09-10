import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  size: number;
  type: 'pen' | 'pencil' | 'highlighter' | 'eraser';
}

export interface Layer {
  id: string;
  name: string;
  strokes: Stroke[];
  visible: boolean;
  opacity: number;
}

export interface Frame {
  id: string;
  layers: Layer[];
  holdDuration: number;
}

export interface AppState {
  frames: Frame[];
  currentFrameIndex: number;
  activeLayerIndex: number;
  isPlaying: boolean;
  isLooping: boolean;
  fps: number;
  tool: 'pen' | 'pencil' | 'highlighter' | 'eraser';
  brushColor: string;
  brushSize: number;
  onionSkin: boolean;
  projectName: string;

  // Actions
  addStroke: (stroke: Stroke) => void;
  addFrame: () => void;
  duplicateFrame: () => void;
  deleteFrame: (index: number) => void;
  setCurrentFrame: (index: number) => void;
  setActiveLayer: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setLooping: (loop: boolean) => void;
  setTool: (tool: 'pen' | 'pencil' | 'highlighter' | 'eraser') => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setOnionSkin: (enabled: boolean) => void;
  setFps: (fps: number) => void;
  setProjectName: (name: string) => void;
}

const createEmptyFrame = (): Frame => ({
  id: uuidv4(),
  layers: [
    {
      id: uuidv4(),
      name: 'Layer 1',
      strokes: [],
      visible: true,
      opacity: 1,
    },
  ],
  holdDuration: 1,
});

export const useStore = create<AppState>((set) => ({
  frames: [createEmptyFrame()],
  currentFrameIndex: 0,
  activeLayerIndex: 0,
  isPlaying: false,
  isLooping: true,
  fps: 12,
  tool: 'pen',
  brushColor: '#000000',
  brushSize: 5,
  onionSkin: true,
  projectName: 'Untitled Project',

  addStroke: (stroke) =>
    set((state) => {
      const newFrames = [...state.frames];
      const currentFrame = { ...newFrames[state.currentFrameIndex] };
      const newLayers = [...currentFrame.layers];
      const currentLayer = { ...newLayers[state.activeLayerIndex] };

      currentLayer.strokes = [...currentLayer.strokes, stroke];
      newLayers[state.activeLayerIndex] = currentLayer;
      currentFrame.layers = newLayers;
      newFrames[state.currentFrameIndex] = currentFrame;

      return { frames: newFrames };
    }),

  addFrame: () =>
    set((state) => {
      const newFrames = [...state.frames];
      newFrames.splice(state.currentFrameIndex + 1, 0, createEmptyFrame());
      return { frames: newFrames, currentFrameIndex: state.currentFrameIndex + 1 };
    }),

  duplicateFrame: () =>
    set((state) => {
      const newFrames = [...state.frames];
      const currentFrame = newFrames[state.currentFrameIndex];
      // Deep copy frame
      const dupFrame = JSON.parse(JSON.stringify(currentFrame));
      dupFrame.id = uuidv4();
      dupFrame.layers.forEach((l: any) => l.id = uuidv4());
      
      newFrames.splice(state.currentFrameIndex + 1, 0, dupFrame);
      return { frames: newFrames, currentFrameIndex: state.currentFrameIndex + 1 };
    }),

  deleteFrame: (index) =>
    set((state) => {
      if (state.frames.length <= 1) return state; // don't delete last frame
      const newFrames = state.frames.filter((_, i) => i !== index);
      let newIndex = state.currentFrameIndex;
      if (newIndex >= newFrames.length) {
        newIndex = newFrames.length - 1;
      } else if (index < newIndex) {
        newIndex--;
      }
      return { frames: newFrames, currentFrameIndex: newIndex };
    }),

  setCurrentFrame: (index) => set({ currentFrameIndex: index }),
  setActiveLayer: (index) => set({ activeLayerIndex: index }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setLooping: (loop) => set({ isLooping: loop }),
  setTool: (tool) => set({ tool }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setOnionSkin: (enabled) => set({ onionSkin: enabled }),
  setFps: (fps) => set({ fps }),
  setProjectName: (name) => set({ projectName: name }),
}));
