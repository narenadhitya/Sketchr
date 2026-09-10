import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import localforage from 'localforage';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  size: number;
  type: 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'bucket' | 'text';
  text?: string;
  fontFamily?: string;
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

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
  fps: number;
  thumbnail?: string;
}

export interface AppState {
  currentView: 'home' | 'editor';
  projects: ProjectMeta[];
  currentProjectId: string | null;

  frames: Frame[];
  currentFrameIndex: number;
  activeLayerIndex: number;
  isPlaying: boolean;
  isLooping: boolean;
  fps: number;
  tool: 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'bucket' | 'text';
  brushColor: string;
  brushSize: number;
  onionSkin: boolean;
  projectName: string;
  currentThumbnail?: string;
  fontFamily: string;

  saveStatus: 'Saved' | 'Saving...';
  undoneStrokes: Stroke[];
  clipboardStrokes: Stroke[];
  isRulerActive: boolean;

  // Actions
  setView: (view: 'home' | 'editor') => void;
  loadProjectsList: () => Promise<void>;
  createProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  setSaveStatus: (status: 'Saved' | 'Saving...') => void;

  addStroke: (stroke: Stroke) => void;
  undoStroke: () => void;
  redoStroke: () => void;
  copyStrokes: () => void;
  pasteStrokes: () => void;
  toggleRuler: () => void;

  addFrame: () => void;
  duplicateFrame: () => void;
  deleteFrame: (index: number) => void;
  setCurrentFrame: (index: number) => void;
  setActiveLayer: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setLooping: (loop: boolean) => void;
  setTool: (tool: 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'bucket' | 'text') => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setOnionSkin: (enabled: boolean) => void;
  setFps: (fps: number) => void;
  setProjectName: (name: string) => void;
  setCurrentThumbnail: (thumb: string) => void;
  setFontFamily: (font: string) => void;
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

export const useStore = create<AppState>((set, get) => ({
  currentView: 'home',
  projects: [],
  currentProjectId: null,

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
  currentThumbnail: undefined,
  fontFamily: 'Arial',
  saveStatus: 'Saved',
  undoneStrokes: [],
  clipboardStrokes: [],
  isRulerActive: false,

  setView: (view) => set({ currentView: view }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  
  loadProjectsList: async () => {
    const list: ProjectMeta[] = await localforage.getItem('sketchr-projects') || [];
    set({ projects: list });
  },

  createProject: async () => {
    const newId = uuidv4();
    const newProj: ProjectMeta = {
      id: newId,
      name: 'Untitled Project',
      updatedAt: Date.now(),
      fps: 12,
    };
    
    const state = get();
    const newList = [newProj, ...state.projects];
    await localforage.setItem('sketchr-projects', newList);
    
    set({ 
      projects: newList,
      currentProjectId: newId,
      projectName: 'Untitled Project',
      frames: [createEmptyFrame()],
      currentFrameIndex: 0,
      fps: 12,
      currentView: 'editor',
      currentThumbnail: undefined
    });
    
    await localforage.setItem(`project-data-${newId}`, { frames: get().frames });
  },

  loadProject: async (id: string) => {
    const state = get();
    const meta = state.projects.find(p => p.id === id);
    if (!meta) return;

    const data: any = await localforage.getItem(`project-data-${id}`);
    if (data && data.frames) {
      set({
        currentProjectId: id,
        projectName: meta.name,
        fps: meta.fps,
        frames: data.frames,
        currentFrameIndex: 0,
        currentView: 'editor',
        currentThumbnail: meta.thumbnail
      });
    }
  },

  saveCurrentProject: async () => {
    const state = get();
    if (!state.currentProjectId) return;

    await localforage.setItem(`project-data-${state.currentProjectId}`, {
      frames: state.frames
    });

    const updatedProjects = state.projects.map(p => {
      if (p.id === state.currentProjectId) {
        return { 
          ...p, 
          name: state.projectName, 
          fps: state.fps, 
          updatedAt: Date.now(),
          thumbnail: state.currentThumbnail || p.thumbnail
        };
      }
      return p;
    });

    await localforage.setItem('sketchr-projects', updatedProjects);
    set({ projects: updatedProjects });
  },

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

      return { frames: newFrames, undoneStrokes: [] };
    }),

  undoStroke: () => set((state) => {
    const currentFrame = state.frames[state.currentFrameIndex];
    const currentLayer = currentFrame.layers[state.activeLayerIndex];
    if (currentLayer.strokes.length === 0) return state;

    const newFrames = [...state.frames];
    const newCurrentFrame = { ...newFrames[state.currentFrameIndex] };
    const newLayers = [...newCurrentFrame.layers];
    const newCurrentLayer = { ...newLayers[state.activeLayerIndex] };

    const strokeToUndo = newCurrentLayer.strokes[newCurrentLayer.strokes.length - 1];
    newCurrentLayer.strokes = newCurrentLayer.strokes.slice(0, -1);
    
    newLayers[state.activeLayerIndex] = newCurrentLayer;
    newCurrentFrame.layers = newLayers;
    newFrames[state.currentFrameIndex] = newCurrentFrame;

    return { frames: newFrames, undoneStrokes: [...state.undoneStrokes, strokeToUndo] };
  }),

  redoStroke: () => set((state) => {
    if (state.undoneStrokes.length === 0) return state;

    const strokeToRedo = state.undoneStrokes[state.undoneStrokes.length - 1];
    const newUndone = state.undoneStrokes.slice(0, -1);

    const newFrames = [...state.frames];
    const newCurrentFrame = { ...newFrames[state.currentFrameIndex] };
    const newLayers = [...newCurrentFrame.layers];
    const newCurrentLayer = { ...newLayers[state.activeLayerIndex] };

    newCurrentLayer.strokes = [...newCurrentLayer.strokes, strokeToRedo];
    newLayers[state.activeLayerIndex] = newCurrentLayer;
    newCurrentFrame.layers = newLayers;
    newFrames[state.currentFrameIndex] = newCurrentFrame;

    return { frames: newFrames, undoneStrokes: newUndone };
  }),

  copyStrokes: () => set((state) => {
    const currentFrame = state.frames[state.currentFrameIndex];
    const currentLayer = currentFrame.layers[state.activeLayerIndex];
    return { clipboardStrokes: [...currentLayer.strokes] };
  }),

  pasteStrokes: () => set((state) => {
    if (state.clipboardStrokes.length === 0) return state;
    const newFrames = [...state.frames];
    const newCurrentFrame = { ...newFrames[state.currentFrameIndex] };
    const newLayers = [...newCurrentFrame.layers];
    const newCurrentLayer = { ...newLayers[state.activeLayerIndex] };

    // Need to deep copy pasted strokes so their object refs are different
    const deepCopiedStrokes = JSON.parse(JSON.stringify(state.clipboardStrokes));
    newCurrentLayer.strokes = [...newCurrentLayer.strokes, ...deepCopiedStrokes];
    
    newLayers[state.activeLayerIndex] = newCurrentLayer;
    newCurrentFrame.layers = newLayers;
    newFrames[state.currentFrameIndex] = newCurrentFrame;

    return { frames: newFrames };
  }),

  toggleRuler: () => set((state) => ({ isRulerActive: !state.isRulerActive })),

  addFrame: () =>
    set((state) => ({
      frames: [...state.frames, createEmptyFrame()],
      currentFrameIndex: state.frames.length,
    })),

  duplicateFrame: () =>
    set((state) => {
      const newFrames = [...state.frames];
      const currentFrame = newFrames[state.currentFrameIndex];
      const duplicatedFrame = {
        ...currentFrame,
        id: uuidv4(),
        layers: currentFrame.layers.map((layer) => ({
          ...layer,
          id: uuidv4(),
          strokes: [...layer.strokes],
        })),
      };
      newFrames.splice(state.currentFrameIndex + 1, 0, duplicatedFrame);
      return { frames: newFrames, currentFrameIndex: state.currentFrameIndex + 1 };
    }),

  deleteFrame: (index) =>
    set((state) => {
      if (state.frames.length <= 1) return state;
      const newFrames = state.frames.filter((_, i) => i !== index);
      let newIndex = state.currentFrameIndex;
      if (newIndex >= newFrames.length) newIndex = newFrames.length - 1;
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
  setCurrentThumbnail: (thumb) => set({ currentThumbnail: thumb }),
  setFontFamily: (font) => set({ fontFamily: font }),
}));
