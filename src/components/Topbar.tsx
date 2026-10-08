import React, { useState } from 'react';
import {
  Check,
  ChevronLeft,
  ClipboardPaste,
  Cloud,
  Copy,
  Download,
  Eraser,
  FlipHorizontal2,
  FlipVertical2,
  Grid3x3,
  PanelRight,
  HardDrive,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  MoreVertical,
  Move,
  Plus,
  Redo2,
  Ruler,
  Save,
  Scan,
  Sun,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useStore } from '../store';
import type { BackgroundKind } from '../store';
import {
  Button,
  IconButton,
  InlineEdit,
  MenuDivider,
  MenuItem,
  MenuLabel,
  Popover,
  Tooltip,
} from './ui';

const BACKGROUNDS: { value: BackgroundKind; label: string; preview: string }[] = [
  { value: 'white', label: 'Plain', preview: 'bg-white' },
  { value: 'grid', label: 'Grid', preview: 'bg-white bg-[linear-gradient(to_right,#0001_1px,transparent_1px),linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[length:7px_7px]' },
  { value: 'dots', label: 'Dots', preview: 'bg-white bg-[radial-gradient(#0002_1px,transparent_1px)] bg-[length:7px_7px]' },
  { value: 'lined', label: 'Lined', preview: 'bg-white bg-[linear-gradient(to_bottom,#0001_1px,transparent_1px)] bg-[length:7px_7px]' },
  { value: 'transparent', label: 'None', preview: 'checkerboard' },
];

const Topbar: React.FC = () => {
  const projectName = useStore((s) => s.projectName);
  const setProjectName = useStore((s) => s.setProjectName);
  const setView = useStore((s) => s.setView);
  const saveCurrentProject = useStore((s) => s.saveCurrentProject);
  const saveStatus = useStore((s) => s.saveStatus);
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const storageKind = useStore((s) => s.storageKind);
  const workspaceName = useStore((s) => s.workspaceName);

  const isRulerActive = useStore((s) => s.isRulerActive);
  const toggleRuler = useStore((s) => s.toggleRuler);
  const symmetry = useStore((s) => s.symmetry);
  const setSymmetry = useStore((s) => s.setSymmetry);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const past = useStore((s) => s.past);
  const future = useStore((s) => s.future);
  const copyStrokes = useStore((s) => s.copyStrokes);
  const pasteStrokes = useStore((s) => s.pasteStrokes);
  const clipboardStrokes = useStore((s) => s.clipboardStrokes);
  const clearLayer = useStore((s) => s.clearLayer);
  const clearFrame = useStore((s) => s.clearFrame);

  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const resetView = useStore((s) => s.resetView);
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const lastDrawTool = useStore((s) => s.lastDrawTool);
  const background = useStore((s) => s.background);
  const setBackground = useStore((s) => s.setBackground);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const setPanel = useStore((s) => s.setPanel);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const toast = useStore((s) => s.toast);

  const [showBg, setShowBg] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      toast('Fullscreen was blocked by the browser', 'error');
    }
  };

  const goHome = async () => {
    await saveCurrentProject();
    setView('home');
  };

  const savedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="pointer-events-none flex items-start justify-between gap-3 px-4 py-3">
      {/* ---------------- left ---------------- */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-line bg-panel/90 p-1.5 pr-3 shadow-float backdrop-blur-xl">
        <Tooltip label="Back to projects" side="bottom">
          <IconButton onClick={goHome} aria-label="Back to projects">
            <ChevronLeft size={20} />
          </IconButton>
        </Tooltip>

        <div className="min-w-0">
          <InlineEdit
            value={projectName}
            onCommit={setProjectName}
            className="max-w-[16rem] text-sm font-extrabold tracking-tight text-ink"
            inputClassName="text-sm font-extrabold text-ink"
          />
          <div className="flex items-center gap-1 text-[10px] font-bold text-ink-3">
            {saveStatus === 'Saving...' ? (
              <>
                <Loader2 size={10} className="animate-spin text-brand" />
                Saving…
              </>
            ) : storageKind === 'filesystem' ? (
              <>
                <HardDrive size={10} className="text-good" />
                <span className="max-w-[12rem] truncate" title={`Saved to ${workspaceName}`}>
                  Saved to {workspaceName}
                </span>
                {savedLabel ? ` · ${savedLabel}` : ''}
              </>
            ) : (
              <>
                <Cloud size={10} className="text-good" />
                Saved in browser{savedLabel ? ` · ${savedLabel}` : ''}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- centre ---------------- */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-line bg-panel/90 p-1.5 shadow-float backdrop-blur-xl">
        <Tooltip label="Undo" hint="Ctrl+Z" side="bottom">
          <IconButton onClick={undo} disabled={!past.length}>
            <Undo2 size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip label="Redo" hint="Ctrl+Y" side="bottom">
          <IconButton onClick={redo} disabled={!future.length}>
            <Redo2 size={18} />
          </IconButton>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-line" />

        <Tooltip label="Straight line" hint="R" side="bottom">
          <IconButton active={isRulerActive} onClick={toggleRuler}>
            <Ruler size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip
          label={
            symmetry === 'off'
              ? 'Symmetry off'
              : symmetry === 'vertical'
                ? 'Vertical symmetry'
                : 'Horizontal symmetry'
          }
          hint="M"
          side="bottom"
        >
          <IconButton
            active={symmetry !== 'off'}
            onClick={() =>
              setSymmetry(
                symmetry === 'off' ? 'vertical' : symmetry === 'vertical' ? 'horizontal' : 'off',
              )
            }
          >
            {symmetry === 'horizontal' ? <FlipVertical2 size={18} /> : <FlipHorizontal2 size={18} />}
          </IconButton>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-line" />

        <Tooltip label="Copy layer" hint="Ctrl+C" side="bottom">
          <IconButton onClick={copyStrokes}>
            <Copy size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip label="Paste" hint="Ctrl+V" side="bottom">
          <IconButton onClick={pasteStrokes} disabled={!clipboardStrokes.length}>
            <ClipboardPaste size={18} />
          </IconButton>
        </Tooltip>
      </div>

      {/* ---------------- right ---------------- */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-line bg-panel/90 p-1.5 shadow-float backdrop-blur-xl">
        {/* zoom */}
        <div className="flex items-center gap-0.5 rounded-xl bg-panel-2 p-0.5">
          <IconButton size="sm" onClick={() => setZoom(zoom / 1.25)} aria-label="Zoom out">
            <Minus size={14} />
          </IconButton>
          <Tooltip label="Reset view" hint="Ctrl+0" side="bottom">
            <button
              type="button"
              onClick={resetView}
              className="tabular h-8 w-12 rounded-lg text-[11px] font-extrabold text-ink transition-colors hover:bg-panel"
            >
              {Math.round(zoom * 100)}%
            </button>
          </Tooltip>
          <IconButton size="sm" onClick={() => setZoom(zoom * 1.25)} aria-label="Zoom in">
            <Plus size={14} />
          </IconButton>
        </div>

        <Tooltip label="Pan" hint="Alt" side="bottom">
          <IconButton
            active={tool === 'pan'}
            onClick={() => setTool(tool === 'pan' ? lastDrawTool : 'pan')}
          >
            <Move size={18} />
          </IconButton>
        </Tooltip>

        {/* background */}
        <Popover
          open={showBg}
          onClose={() => setShowBg(false)}
          className="right-0 top-full mt-2 w-48"
          anchor={
            <Tooltip label="Canvas background" side="bottom">
              <IconButton onClick={() => setShowBg((v) => !v)}>
                <Grid3x3 size={18} />
              </IconButton>
            </Tooltip>
          }
        >
          <MenuLabel>Background</MenuLabel>
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.value}
              type="button"
              onClick={() => {
                setBackground(bg.value);
                setShowBg(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[13px] font-semibold text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
            >
              <span className={`h-7 w-9 shrink-0 rounded-md ring-1 ring-line ${bg.preview}`} />
              <span className="flex-1">{bg.label}</span>
              {background === bg.value && <Check size={14} className="text-brand" />}
            </button>
          ))}
        </Popover>

        <Tooltip label="Colour, layers & canvas panel" hint="C" side="bottom">
          <IconButton active={sidebarOpen} onClick={() => toggleSidebar('color')}>
            <PanelRight size={18} />
          </IconButton>
        </Tooltip>

        <Tooltip label={theme === 'dark' ? 'Light mode' : 'Dark mode'} side="bottom">
          <IconButton onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-line" />

        <Button size="sm" onClick={() => setPanel('showExport', true)} className="h-9 px-3">
          <Download size={15} />
          Export
        </Button>

        <Tooltip label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} hint="F" side="bottom">
          <IconButton onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </Tooltip>

        <Popover
          open={showMore}
          onClose={() => setShowMore(false)}
          className="right-0 top-full mt-2 w-56"
          anchor={
            <IconButton onClick={() => setShowMore((v) => !v)} aria-label="More options">
              <MoreVertical size={18} />
            </IconButton>
          }
        >
          <MenuItem
            icon={<Save size={14} />}
            hint="Ctrl+S"
            onClick={async () => {
              setShowMore(false);
              await saveCurrentProject();
              toast('Project saved', 'success');
            }}
          >
            Save now
          </MenuItem>
          <MenuItem
            icon={<Scan size={14} />}
            hint="Ctrl+0"
            onClick={() => {
              resetView();
              setShowMore(false);
            }}
          >
            Reset view
          </MenuItem>
          <MenuItem
            icon={<Keyboard size={14} />}
            hint="?"
            onClick={() => {
              setPanel('showShortcuts', true);
              setShowMore(false);
            }}
          >
            Keyboard shortcuts
          </MenuItem>
          <MenuDivider />
          <MenuLabel>Danger zone</MenuLabel>
          <MenuItem
            danger
            icon={<Eraser size={14} />}
            onClick={() => {
              clearLayer();
              setShowMore(false);
              toast('Layer cleared');
            }}
          >
            Clear this layer
          </MenuItem>
          <MenuItem
            danger
            icon={<Trash2 size={14} />}
            onClick={() => {
              clearFrame();
              setShowMore(false);
              toast('Frame cleared');
            }}
          >
            Clear this frame
          </MenuItem>
        </Popover>
      </div>
    </div>
  );
};

export default Topbar;
