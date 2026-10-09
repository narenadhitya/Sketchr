import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  BackgroundKind,
  Frame,
  Layer,
  ProjectMeta,
  ShapeKind,
  Stroke,
  StrokeType,
  ToolId,
} from './lib/project';
import { createEmptyFrame, createLayer } from './lib/project';
import { tweenFrames } from './lib/tween';
import type { StorageKind, WorkspaceStatus } from './lib/storage';
import {
  chooseWorkspace as pickWorkspaceFolder,
  countBrowserStorageProjects,
  disconnectWorkspace as releaseWorkspace,
  getBackend,
  migrateBrowserStorageToWorkspace,
  reconnectWorkspace as regrantWorkspace,
  restoreWorkspace,
  supportsFileSystemAccess,
} from './lib/storage';

/* Re-exported so components can keep importing the domain model from the
   store, which is the only module most of them need to know about. */
export type {
  BackgroundKind,
  CanvasPreset,
  Frame,
  Layer,
  Point,
  ProjectMeta,
  ShapeKind,
  Stroke,
  StrokeType,
  ToolId,
} from './lib/project';
export { CANVAS_PRESETS, FPS_OPTIONS, createEmptyFrame, createLayer } from './lib/project';
export type { StorageKind, WorkspaceStatus } from './lib/storage';

export type ThemeMode = 'light' | 'dark';
export type SortKey = 'recent' | 'name' | 'created';

export interface Toast {
  id: string;
  message: string;
  kind: 'info' | 'success' | 'error';
}

interface HistoryEntry {
  frames: Frame[];
  currentFrameIndex: number;
  activeLayerIndex: number;
}

const HISTORY_LIMIT = 80;
const MAX_RECENT_COLORS = 10;


/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export interface AppState {
  currentView: 'home' | 'editor';
  projects: ProjectMeta[];
  currentProjectId: string | null;
  projectsLoaded: boolean;

  /** Where projects are being written right now. */
  storageKind: StorageKind;
  workspaceStatus: WorkspaceStatus;
  workspaceName: string | null;
  /** Projects still only in browser storage, for the "import" prompt. */
  browserProjectCount: number;

  frames: Frame[];
  currentFrameIndex: number;
  activeLayerIndex: number;

  isPlaying: boolean;
  isLooping: boolean;
  fps: number;

  tool: ToolId;
  lastDrawTool: StrokeType;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  fontFamily: string;
  shapeKind: ShapeKind;
  shapeFilled: boolean;
  recentColors: string[];
  savedColors: string[];
  /** Bucket-only: fill with transparency, clearing the region instead. */
  fillTransparent: boolean;

  onionSkin: boolean;
  onionPrevCount: number;
  onionNextCount: number;
  onionOpacity: number;
  onionTinted: boolean;

  canvasWidth: number;
  canvasHeight: number;
  background: BackgroundKind;
  zoom: number;
  panX: number;
  panY: number;

  projectName: string;
  currentThumbnail?: string;
  saveStatus: 'Saved' | 'Saving...';
  lastSavedAt: number | null;

  past: HistoryEntry[];
  future: HistoryEntry[];
  clipboardStrokes: Stroke[];
  clipboardFrame: Frame | null;

  isRulerActive: boolean;
  symmetry: 'off' | 'vertical' | 'horizontal';

  theme: ThemeMode;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  referenceImage: string | null;
  referenceOpacity: number;
  strokeSmoothing: number;
  showExport: boolean;
  showShortcuts: boolean;
  showNewProject: boolean;
  showOnionSettings: boolean;
  homeSearch: string;
  homeSort: SortKey;
  toasts: Toast[];

  /* --- actions --- */
  setView: (view: 'home' | 'editor') => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toast: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: string) => void;
  setPanel: (panel: PanelKey, open: boolean) => void;
  setReferenceImage: (base64: string | null) => void;
  setReferenceOpacity: (opacity: number) => void;
  setStrokeSmoothing: (smoothing: number) => void;

  initStorage: () => Promise<void>;
  connectWorkspace: () => Promise<void>;
  reconnectWorkspace: () => Promise<void>;
  disconnectWorkspace: () => Promise<void>;

  loadProjectsList: () => Promise<void>;
  createProject: (opts?: {
    name?: string;
    width?: number;
    height?: number;
    fps?: number;
  }) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  setSaveStatus: (status: 'Saved' | 'Saving...') => void;
  setHomeSearch: (q: string) => void;
  setHomeSort: (sort: SortKey) => void;

  addStroke: (stroke: Stroke) => void;
  undo: () => void;
  redo: () => void;
  copyStrokes: () => void;
  pasteStrokes: () => void;
  clearLayer: () => void;
  clearFrame: () => void;
  flipActiveLayer: (axis: 'horizontal' | 'vertical') => void;
  toggleRuler: () => void;
  setSymmetry: (mode: AppState['symmetry']) => void;

  addFrame: () => void;
  duplicateFrame: () => void;
  deleteFrame: (index: number) => void;
  moveFrame: (from: number, to: number) => void;
  setCurrentFrame: (index: number) => void;
  stepFrame: (delta: number) => void;
  setFrameHold: (index: number, hold: number) => void;
  copyFrame: (index: number) => void;
  pasteFrame: () => void;
  tweenFrame: (indexA: number, indexB: number) => void;

  addLayer: () => void;
  deleteLayer: (index: number) => void;
  duplicateLayer: (index: number) => void;
  mergeLayerDown: (index: number) => void;
  moveLayer: (from: number, to: number) => void;
  renameLayer: (index: number, name: string) => void;
  toggleLayerVisibility: (index: number) => void;
  toggleLayerLock: (index: number) => void;
  setLayerOpacity: (index: number, opacity: number) => void;
  setActiveLayer: (index: number) => void;

  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setLooping: (loop: boolean) => void;
  setTool: (tool: ToolId) => void;
  setBrushColor: (color: string, remember?: boolean) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setShapeKind: (kind: ShapeKind) => void;
  setShapeFilled: (filled: boolean) => void;
  setFillTransparent: (transparent: boolean) => void;
  addSavedColor: (color: string) => void;
  removeSavedColor: (color: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  toggleSidebar: (tab: SidebarTab) => void;
  setOnionSkin: (enabled: boolean) => void;
  setOnionOption: (key: OnionNumberKey, value: number) => void;
  setOnionTinted: (tinted: boolean) => void;
  setBackground: (bg: BackgroundKind) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  setFps: (fps: number) => void;
  setProjectName: (name: string) => void;
  setCurrentThumbnail: (thumb: string) => void;
  setFontFamily: (font: string) => void;
}

export type SidebarTab = 'color' | 'layers' | 'canvas';

export type PanelKey = 'showExport' | 'showShortcuts' | 'showNewProject' | 'showOnionSettings';

type OnionNumberKey = 'onionPrevCount' | 'onionNextCount' | 'onionOpacity';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const snapshot = (state: AppState): HistoryEntry => ({
  frames: state.frames,
  currentFrameIndex: state.currentFrameIndex,
  activeLayerIndex: state.activeLayerIndex,
});

/**
 * Wraps a frames-mutation so it lands on the undo stack. Every mutator below
 * rebuilds the arrays it touches, so keeping references here is safe (and far
 * cheaper than deep-cloning the whole project on every stroke).
 */
const withHistory = (
  state: AppState,
  produce: (frames: Frame[]) => Partial<AppState>,
): Partial<AppState> => ({
  past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
  future: [],
  ...produce(state.frames),
});

/** Immutably replace one layer of one frame. */
const patchLayer = (
  frames: Frame[],
  frameIndex: number,
  layerIndex: number,
  patch: (layer: Layer) => Layer,
): Frame[] =>
  frames.map((frame, fi) =>
    fi !== frameIndex
      ? frame
      : {
          ...frame,
          layers: frame.layers.map((layer, li) => (li !== layerIndex ? layer : patch(layer))),
        },
  );

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const readTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem('sketchr-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage blocked — fall through to the system preference */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const SWATCHES_KEY = 'sketchr-swatches';

const readSavedColors = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SWATCHES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
};

const persistSavedColors = (colors: string[]) => {
  try {
    window.localStorage.setItem(SWATCHES_KEY, JSON.stringify(colors));
  } catch {
    /* storage blocked — swatches just will not survive a reload */
  }
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem('sketchr-theme', theme);
  } catch {
    /* storage blocked — the theme still applies for this session */
  }
};

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useStore = create<AppState>((set, get) => ({
  currentView: 'home',
  projects: [],
  currentProjectId: null,
  projectsLoaded: false,

  storageKind: 'indexeddb',
  workspaceStatus: supportsFileSystemAccess() ? 'disconnected' : 'unsupported',
  workspaceName: null,
  browserProjectCount: 0,

  frames: [createEmptyFrame()],
  currentFrameIndex: 0,
  activeLayerIndex: 0,

  isPlaying: false,
  isLooping: true,
  fps: 12,

  tool: 'pen',
  lastDrawTool: 'pen',
  brushColor: '#12141c',
  brushSize: 6,
  brushOpacity: 1,
  fontFamily: 'system-ui, sans-serif',
  shapeKind: 'rect',
  shapeFilled: false,
  recentColors: ['#12141c', '#ff4d79', '#2f80ed'],
  savedColors: readSavedColors(),
  fillTransparent: false,

  onionSkin: true,
  onionPrevCount: 1,
  onionNextCount: 0,
  onionOpacity: 0.3,
  onionTinted: true,

  canvasWidth: 1920,
  canvasHeight: 1080,
  background: 'white',
  zoom: 1,
  panX: 0,
  panY: 0,

  projectName: 'Untitled Project',
  currentThumbnail: undefined,
  saveStatus: 'Saved',
  lastSavedAt: null,

  past: [],
  future: [],
  clipboardStrokes: [],
  clipboardFrame: null,

  isRulerActive: false,
  symmetry: 'off',

  theme: readTheme(),
  sidebarOpen: false,
  sidebarTab: 'color',
  referenceImage: null,
  referenceOpacity: 0.3,
  strokeSmoothing: 50,
  showExport: false,
  showShortcuts: false,
  showNewProject: false,
  showOnionSettings: false,
  homeSearch: '',
  homeSort: 'recent',
  toasts: [],

  /* ---------------- shell ---------------- */

  setView: (view) => set({ currentView: view }),

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },

  toast: (message, kind = 'info') => {
    const id = uuidv4();
    set((state) => ({ toasts: [...state.toasts, { id, message, kind }] }));
    setTimeout(() => get().dismissToast(id), 2600);
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setPanel: (panel, open) => set({ [panel]: open } as Pick<AppState, PanelKey>),
  setReferenceImage: (referenceImage) => set({ referenceImage }),
  setReferenceOpacity: (referenceOpacity) => set({ referenceOpacity }),
  setStrokeSmoothing: (strokeSmoothing) => set({ strokeSmoothing }),

  setHomeSearch: (homeSearch) => set({ homeSearch }),
  setHomeSort: (homeSort) => set({ homeSort }),

  /* ---------------- projects ---------------- */

  initStorage: async () => {
    const workspace = await restoreWorkspace();
    set({
      workspaceStatus: workspace.status,
      workspaceName: workspace.name,
      storageKind: getBackend().kind,
    });

    if (workspace.status === 'connected') {
      const migrated = await migrateBrowserStorageToWorkspace();
      if (migrated > 0) {
        get().toast(
          `Saved ${migrated} existing project${migrated === 1 ? '' : 's'} to ${workspace.name}`,
          'success',
        );
      }
    }

    await get().loadProjectsList();
    set({ browserProjectCount: await countBrowserStorageProjects() });
  },

  connectWorkspace: async () => {
    const workspace = await pickWorkspaceFolder();
    set({
      workspaceStatus: workspace.status,
      workspaceName: workspace.name,
      storageKind: getBackend().kind,
    });

    if (workspace.status !== 'connected') {
      if (workspace.status === 'needs-permission') {
        get().toast('Sketchr needs write access to that folder', 'error');
      }
      return;
    }

    const migrated = await migrateBrowserStorageToWorkspace();
    await get().loadProjectsList();
    set({ browserProjectCount: await countBrowserStorageProjects() });
    get().toast(
      migrated > 0
        ? `Saved ${migrated} project${migrated === 1 ? '' : 's'} to ${workspace.name}`
        : `Projects are now saved in ${workspace.name}`,
      'success',
    );
  },

  reconnectWorkspace: async () => {
    const workspace = await regrantWorkspace();
    set({
      workspaceStatus: workspace.status,
      workspaceName: workspace.name,
      storageKind: getBackend().kind,
    });

    if (workspace.status !== 'connected') {
      get().toast('Folder access was not granted', 'error');
      return;
    }

    await migrateBrowserStorageToWorkspace();
    await get().loadProjectsList();
    set({ browserProjectCount: await countBrowserStorageProjects() });
    get().toast(`Reconnected to ${workspace.name}`, 'success');
  },

  disconnectWorkspace: async () => {
    const workspace = await releaseWorkspace();
    set({
      workspaceStatus: workspace.status,
      workspaceName: workspace.name,
      storageKind: getBackend().kind,
    });
    await get().loadProjectsList();
    get().toast('Back to browser storage — your files were left untouched');
  },

  loadProjectsList: async () => {
    try {
      const projects = await getBackend().list();
      set({ projects, projectsLoaded: true, storageKind: getBackend().kind });
    } catch {
      set({ projects: [], projectsLoaded: true });
      get().toast('Could not read the workspace folder', 'error');
    }
  },

  createProject: async (opts) => {
    const now = Date.now();
    const meta: ProjectMeta = {
      id: uuidv4(),
      name: opts?.name?.trim() || 'Untitled Project',
      createdAt: now,
      updatedAt: now,
      fps: opts?.fps ?? 12,
      width: opts?.width ?? 1920,
      height: opts?.height ?? 1080,
      frameCount: 1,
    };

    const frames = [createEmptyFrame()];

    try {
      await getBackend().write(meta, frames);
    } catch {
      get().toast('Could not create the project file', 'error');
      return;
    }

    set((state) => ({
      projects: [meta, ...state.projects],
      currentProjectId: meta.id,
      projectName: meta.name,
      frames,
      currentFrameIndex: 0,
      activeLayerIndex: 0,
      fps: meta.fps,
      canvasWidth: meta.width,
      canvasHeight: meta.height,
      currentView: 'editor',
      currentThumbnail: undefined,
      past: [],
      future: [],
      zoom: 1,
      panX: 0,
      panY: 0,
      showNewProject: false,
      lastSavedAt: now,
    }));
  },

  loadProject: async (id) => {
    const record = await getBackend().read(id);
    if (!record) {
      get().toast('That project could not be opened', 'error');
      return;
    }

    set({
      currentProjectId: record.meta.id,
      projectName: record.meta.name,
      fps: record.meta.fps,
      canvasWidth: record.meta.width,
      canvasHeight: record.meta.height,
      frames: record.frames,
      currentFrameIndex: 0,
      activeLayerIndex: 0,
      currentView: 'editor',
      currentThumbnail: record.meta.thumbnail,
      past: [],
      future: [],
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  },

  saveCurrentProject: async () => {
    const state = get();
    if (!state.currentProjectId) return;

    const existing = state.projects.find((p) => p.id === state.currentProjectId);
    const meta: ProjectMeta = {
      id: state.currentProjectId,
      name: state.projectName,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      fps: state.fps,
      width: state.canvasWidth,
      height: state.canvasHeight,
      frameCount: state.frames.length,
      thumbnail: state.currentThumbnail ?? existing?.thumbnail,
    };

    try {
      await getBackend().write(meta, state.frames);
    } catch {
      get().toast('Save failed — check access to the workspace folder', 'error');
      return;
    }

    set((current) => ({
      projects: current.projects.some((p) => p.id === meta.id)
        ? current.projects.map((p) => (p.id === meta.id ? meta : p))
        : [meta, ...current.projects],
      lastSavedAt: Date.now(),
    }));
  },

  deleteProject: async (id) => {
    try {
      await getBackend().remove(id);
    } catch {
      get().toast('Could not delete that project', 'error');
      return;
    }
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
    get().toast('Project deleted', 'success');
  },

  duplicateProject: async (id) => {
    const record = await getBackend().read(id);
    if (!record) return;

    const copy: ProjectMeta = {
      ...record.meta,
      id: uuidv4(),
      name: `${record.meta.name} copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const frames = record.frames.map((f) => ({
      ...f,
      id: uuidv4(),
      layers: f.layers.map((l) => ({ ...l, id: uuidv4(), strokes: [...l.strokes] })),
    }));

    try {
      await getBackend().write(copy, frames);
    } catch {
      get().toast('Could not duplicate that project', 'error');
      return;
    }

    set((state) => ({ projects: [copy, ...state.projects] }));
    get().toast('Project duplicated', 'success');
  },

  renameProject: async (id, name) => {
    const trimmed = name.trim() || 'Untitled Project';
    const record = await getBackend().read(id);
    if (!record) return;

    const meta: ProjectMeta = { ...record.meta, name: trimmed, updatedAt: Date.now() };

    try {
      // On the file backend this also renames the file on disk.
      await getBackend().write(meta, record.frames);
    } catch {
      get().toast('Could not rename that project', 'error');
      return;
    }

    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? meta : p)),
      projectName: state.currentProjectId === id ? trimmed : state.projectName,
    }));
  },

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  /* ---------------- strokes & history ---------------- */

  addStroke: (stroke) =>
    set((state) => {
      const layer = state.frames[state.currentFrameIndex]?.layers[state.activeLayerIndex];
      if (!layer || layer.locked) return state;

      return withHistory(state, (frames) => ({
        frames: patchLayer(frames, state.currentFrameIndex, state.activeLayerIndex, (l) => ({
          ...l,
          strokes: [...l.strokes, stroke],
        })),
      }));
    }),

  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        ...previous,
        past: state.past.slice(0, -1),
        future: [...state.future, snapshot(state)].slice(-HISTORY_LIMIT),
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[state.future.length - 1];
      if (!next) return state;
      return {
        ...next,
        future: state.future.slice(0, -1),
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
      };
    }),

  copyStrokes: () =>
    set((state) => {
      const layer = state.frames[state.currentFrameIndex]?.layers[state.activeLayerIndex];
      if (!layer?.strokes.length) return state;
      get().toast(`Copied ${layer.strokes.length} stroke${layer.strokes.length === 1 ? '' : 's'}`);
      return { clipboardStrokes: layer.strokes.map((s) => ({ ...s, points: [...s.points] })) };
    }),

  pasteStrokes: () =>
    set((state) => {
      if (!state.clipboardStrokes.length) return state;
      const copies = state.clipboardStrokes.map((s) => ({
        ...s,
        points: s.points.map((p) => ({ ...p })),
      }));
      return withHistory(state, (frames) => ({
        frames: patchLayer(frames, state.currentFrameIndex, state.activeLayerIndex, (l) => ({
          ...l,
          strokes: [...l.strokes, ...copies],
        })),
      }));
    }),

  clearLayer: () =>
    set((state) =>
      withHistory(state, (frames) => ({
        frames: patchLayer(frames, state.currentFrameIndex, state.activeLayerIndex, (l) => ({
          ...l,
          strokes: [],
        })),
      })),
    ),

  clearFrame: () =>
    set((state) =>
      withHistory(state, (frames) => ({
        frames: frames.map((f, i) =>
          i !== state.currentFrameIndex
            ? f
            : { ...f, layers: f.layers.map((l) => ({ ...l, strokes: [] })) },
        ),
      })),
    ),

  flipActiveLayer: (axis) =>
    set((state) =>
      withHistory(state, (frames) => ({
        frames: patchLayer(frames, state.currentFrameIndex, state.activeLayerIndex, (l) => ({
          ...l,
          strokes: l.strokes.map((stroke) => ({
            ...stroke,
            points: stroke.points.map((pt) =>
              axis === 'horizontal'
                ? { ...pt, x: state.canvasWidth - pt.x }
                : { ...pt, y: state.canvasHeight - pt.y },
            ),
          })),
        })),
      })),
    ),

  toggleRuler: () => set((state) => ({ isRulerActive: !state.isRulerActive })),
  setSymmetry: (symmetry) => set({ symmetry }),

  /* ---------------- frames ---------------- */

  addFrame: () =>
    set((state) =>
      withHistory(state, (frames) => {
        const blank = createEmptyFrame();
        // Keep the layer stack of the frame we branched from, minus its art.
        const source = frames[state.currentFrameIndex];
        if (source) {
          blank.layers = source.layers.map((l) => ({ ...createLayer(l.name), opacity: l.opacity }));
        }
        const next = [...frames];
        next.splice(state.currentFrameIndex + 1, 0, blank);
        return { frames: next, currentFrameIndex: state.currentFrameIndex + 1 };
      }),
    ),

  duplicateFrame: () =>
    set((state) =>
      withHistory(state, (frames) => {
        const source = frames[state.currentFrameIndex];
        const copy: Frame = {
          ...source,
          id: uuidv4(),
          layers: source.layers.map((l) => ({ ...l, id: uuidv4(), strokes: [...l.strokes] })),
        };
        const next = [...frames];
        next.splice(state.currentFrameIndex + 1, 0, copy);
        return { frames: next, currentFrameIndex: state.currentFrameIndex + 1 };
      }),
    ),

  deleteFrame: (index) =>
    set((state) => {
      if (state.frames.length <= 1) {
        get().toast('A project needs at least one frame', 'error');
        return state;
      }
      return withHistory(state, (frames) => {
        const next = frames.filter((_, i) => i !== index);
        return {
          frames: next,
          currentFrameIndex: clamp(
            state.currentFrameIndex > index ? state.currentFrameIndex - 1 : state.currentFrameIndex,
            0,
            next.length - 1,
          ),
        };
      });
    }),

  moveFrame: (from, to) =>
    set((state) => {
      if (from === to || to < 0 || to >= state.frames.length) return state;
      return withHistory(state, (frames) => {
        const next = [...frames];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { frames: next, currentFrameIndex: to };
      });
    }),

  tweenFrame: (indexA, indexB) =>
    set((state) => {
      if (indexA < 0 || indexB >= state.frames.length || indexA >= indexB) return state;
      
      const frameA = state.frames[indexA];
      const frameB = state.frames[indexB];
      
      const newFrame = tweenFrames(frameA, frameB);
      
      return withHistory(state, (frames) => {
        const next = [...frames];
        next.splice(indexA + 1, 0, newFrame);
        return { frames: next, currentFrameIndex: indexA + 1 };
      });
    }),

  setCurrentFrame: (index) =>
    set((state) => {
      const next = clamp(index, 0, state.frames.length - 1);
      return {
        currentFrameIndex: next,
        activeLayerIndex: clamp(
          state.activeLayerIndex,
          0,
          (state.frames[next]?.layers.length ?? 1) - 1,
        ),
      };
    }),

  stepFrame: (delta) =>
    set((state) => {
      const count = state.frames.length;
      const next = (state.currentFrameIndex + delta + count) % count;
      return {
        currentFrameIndex: next,
        activeLayerIndex: clamp(
          state.activeLayerIndex,
          0,
          (state.frames[next]?.layers.length ?? 1) - 1,
        ),
      };
    }),

  setFrameHold: (index, hold) =>
    set((state) =>
      withHistory(state, (frames) => ({
        frames: frames.map((f, i) => (i === index ? { ...f, holdDuration: clamp(hold, 1, 24) } : f)),
      })),
    ),

  copyFrame: (index) => {
    const frame = get().frames[index];
    if (!frame) return;
    set({
      clipboardFrame: {
        ...frame,
        layers: frame.layers.map((l) => ({ ...l, strokes: [...l.strokes] })),
      },
    });
    get().toast(`Frame ${index + 1} copied`);
  },

  pasteFrame: () =>
    set((state) => {
      const source = state.clipboardFrame;
      if (!source) return state;
      return withHistory(state, (frames) => {
        const copy: Frame = {
          ...source,
          id: uuidv4(),
          layers: source.layers.map((l) => ({ ...l, id: uuidv4(), strokes: [...l.strokes] })),
        };
        const next = [...frames];
        next.splice(state.currentFrameIndex + 1, 0, copy);
        return { frames: next, currentFrameIndex: state.currentFrameIndex + 1 };
      });
    }),

  /* ---------------- layers ---------------- */

  addLayer: () =>
    set((state) => {
      const frame = state.frames[state.currentFrameIndex];
      if (frame.layers.length >= 12) {
        get().toast('Layer limit reached (12)', 'error');
        return state;
      }
      return withHistory(state, (frames) => ({
        frames: frames.map((f, i) =>
          i !== state.currentFrameIndex
            ? f
            : { ...f, layers: [...f.layers, createLayer(`Layer ${f.layers.length + 1}`)] },
        ),
        activeLayerIndex: frame.layers.length,
      }));
    }),

  deleteLayer: (index) =>
    set((state) => {
      const frame = state.frames[state.currentFrameIndex];
      if (frame.layers.length <= 1) {
        get().toast('A frame needs at least one layer', 'error');
        return state;
      }
      return withHistory(state, (frames) => ({
        frames: frames.map((f, i) =>
          i !== state.currentFrameIndex
            ? f
            : { ...f, layers: f.layers.filter((_, li) => li !== index) },
        ),
        activeLayerIndex: clamp(index > 0 ? index - 1 : 0, 0, frame.layers.length - 2),
      }));
    }),

  duplicateLayer: (index) =>
    set((state) =>
      withHistory(state, (frames) => ({
        frames: frames.map((f, i) => {
          if (i !== state.currentFrameIndex) return f;
          const source = f.layers[index];
          const copy: Layer = {
            ...source,
            id: uuidv4(),
            name: `${source.name} copy`,
            strokes: [...source.strokes],
          };
          const layers = [...f.layers];
          layers.splice(index + 1, 0, copy);
          return { ...f, layers };
        }),
        activeLayerIndex: index + 1,
      })),
    ),

  mergeLayerDown: (index) =>
    set((state) => {
      if (index <= 0) {
        get().toast('Nothing below to merge into', 'error');
        return state;
      }
      return withHistory(state, (frames) => ({
        frames: frames.map((f, i) => {
          if (i !== state.currentFrameIndex) return f;
          const layers = [...f.layers];
          const above = layers[index];
          const below = layers[index - 1];
          layers[index - 1] = { ...below, strokes: [...below.strokes, ...above.strokes] };
          layers.splice(index, 1);
          return { ...f, layers };
        }),
        activeLayerIndex: index - 1,
      }));
    }),

  moveLayer: (from, to) =>
    set((state) => {
      const frame = state.frames[state.currentFrameIndex];
      if (from === to || to < 0 || to >= frame.layers.length) return state;
      return withHistory(state, (frames) => ({
        frames: frames.map((f, i) => {
          if (i !== state.currentFrameIndex) return f;
          const layers = [...f.layers];
          const [moved] = layers.splice(from, 1);
          layers.splice(to, 0, moved);
          return { ...f, layers };
        }),
        activeLayerIndex: to,
      }));
    }),

  renameLayer: (index, name) =>
    set((state) => ({
      frames: patchLayer(state.frames, state.currentFrameIndex, index, (l) => ({
        ...l,
        name: name.trim() || l.name,
      })),
    })),

  toggleLayerVisibility: (index) =>
    set((state) => ({
      frames: patchLayer(state.frames, state.currentFrameIndex, index, (l) => ({
        ...l,
        visible: !l.visible,
      })),
    })),

  toggleLayerLock: (index) =>
    set((state) => ({
      frames: patchLayer(state.frames, state.currentFrameIndex, index, (l) => ({
        ...l,
        locked: !l.locked,
      })),
    })),

  setLayerOpacity: (index, opacity) =>
    set((state) => ({
      frames: patchLayer(state.frames, state.currentFrameIndex, index, (l) => ({
        ...l,
        opacity: clamp(opacity, 0, 1),
      })),
    })),

  setActiveLayer: (index) => set({ activeLayerIndex: index }),

  /* ---------------- tools & view ---------------- */

  setPlaying: (isPlaying) => set({ isPlaying }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setLooping: (isLooping) => set({ isLooping }),

  setTool: (tool) =>
    set((state) => ({
      tool,
      lastDrawTool:
        tool === 'eyedropper' || tool === 'pan' || tool === 'bucket' || tool === 'text'
          ? state.lastDrawTool
          : (tool as StrokeType),
    })),

  setBrushColor: (color, remember = true) =>
    set((state) => ({
      brushColor: color,
      recentColors: remember
        ? [color, ...state.recentColors.filter((c) => c !== color)].slice(0, MAX_RECENT_COLORS)
        : state.recentColors,
    })),

  setBrushSize: (size) => set({ brushSize: clamp(Math.round(size), 1, 120) }),
  setBrushOpacity: (opacity) => set({ brushOpacity: clamp(opacity, 0.05, 1) }),
  setShapeKind: (shapeKind) => set({ shapeKind }),
  setShapeFilled: (shapeFilled) => set({ shapeFilled }),
  setFillTransparent: (fillTransparent) => set({ fillTransparent }),

  addSavedColor: (color) =>
    set((state) => {
      if (state.savedColors.includes(color)) return state;
      const savedColors = [color, ...state.savedColors].slice(0, 30);
      persistSavedColors(savedColors);
      return { savedColors };
    }),

  removeSavedColor: (color) =>
    set((state) => {
      const savedColors = state.savedColors.filter((c) => c !== color);
      persistSavedColors(savedColors);
      return { savedColors };
    }),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),

  toggleSidebar: (tab) =>
    set((state) => ({
      // Clicking the tab you are already on closes the dock.
      sidebarOpen: !(state.sidebarOpen && state.sidebarTab === tab),
      sidebarTab: tab,
    })),

  setOnionSkin: (onionSkin) => set({ onionSkin }),
  setOnionOption: (key, value) => set({ [key]: value } as Pick<AppState, OnionNumberKey>),
  setOnionTinted: (onionTinted) => set({ onionTinted }),

  setBackground: (background) => set({ background }),
  setZoom: (zoom) => set({ zoom: clamp(zoom, 0.2, 8) }),
  setPan: (panX, panY) => set({ panX, panY }),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),

  setFps: (fps) => set({ fps }),
  setProjectName: (projectName) => set({ projectName }),
  setCurrentThumbnail: (currentThumbnail) => set({ currentThumbnail }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
}));

// Paint the stored theme before the first render so there is no flash.
applyTheme(useStore.getState().theme);
