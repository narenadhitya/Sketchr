import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  CopyPlus,
  Clock,
  Gauge,
  Layers,
  Pause,
  Play,
  Plus,
  Repeat,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useStore, FPS_OPTIONS } from '../store';
import FramePreview from './FramePreview';
import { IconButton, MenuDivider, MenuItem, MenuLabel, Popover, Slider, Switch, Tooltip } from './ui';

interface ContextMenuState {
  index: number;
  x: number;
  y: number;
}

const Timeline: React.FC = () => {
  const frames = useStore((s) => s.frames);
  const currentFrameIndex = useStore((s) => s.currentFrameIndex);
  const isPlaying = useStore((s) => s.isPlaying);
  const isLooping = useStore((s) => s.isLooping);
  const fps = useStore((s) => s.fps);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);
  const onionSkin = useStore((s) => s.onionSkin);
  const onionPrevCount = useStore((s) => s.onionPrevCount);
  const onionNextCount = useStore((s) => s.onionNextCount);
  const onionOpacity = useStore((s) => s.onionOpacity);
  const onionTinted = useStore((s) => s.onionTinted);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const sidebarTab = useStore((s) => s.sidebarTab);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  const addFrame = useStore((s) => s.addFrame);
  const duplicateFrame = useStore((s) => s.duplicateFrame);
  const deleteFrame = useStore((s) => s.deleteFrame);
  const moveFrame = useStore((s) => s.moveFrame);
  const setCurrentFrame = useStore((s) => s.setCurrentFrame);
  const stepFrame = useStore((s) => s.stepFrame);
  const setFrameHold = useStore((s) => s.setFrameHold);
  const copyFrame = useStore((s) => s.copyFrame);
  const tweenFrame = useStore((s) => s.tweenFrame);
  const setPlaying = useStore((s) => s.setPlaying);
  const setLooping = useStore((s) => s.setLooping);
  const setFps = useStore((s) => s.setFps);
  const setOnionSkin = useStore((s) => s.setOnionSkin);
  const setOnionOption = useStore((s) => s.setOnionOption);
  const setOnionTinted = useStore((s) => s.setOnionTinted);

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [showFps, setShowFps] = useState(false);
  const [showOnion, setShowOnion] = useState(false);

  const layerCount = frames[currentFrameIndex]?.layers.length ?? 1;
  const totalTicks = frames.reduce((sum, f) => sum + (f.holdDuration || 1), 0);
  const duration = totalTicks / fps;

  /* ---------------- playback ---------------- */

  useEffect(() => {
    if (!isPlaying) return;

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      elapsed += now - last;
      last = now;

      const state = useStore.getState();
      const hold = state.frames[state.currentFrameIndex]?.holdDuration || 1;
      const frameDuration = (1000 / state.fps) * hold;

      if (elapsed >= frameDuration) {
        elapsed -= frameDuration;
        const next = state.currentFrameIndex + 1;
        if (next >= state.frames.length) {
          if (state.isLooping) {
            state.setCurrentFrame(0);
          } else {
            state.setPlaying(false);
            state.setCurrentFrame(state.frames.length - 1);
            return;
          }
        } else {
          state.setCurrentFrame(next);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  /* ---------------- keep the playhead in view ---------------- */

  useEffect(() => {
    trackRef.current
      ?.querySelector(`[data-frame="${currentFrameIndex}"]`)
      ?.scrollIntoView({ behavior: isPlaying ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  }, [currentFrameIndex, isPlaying]);

  /* ---------------- close the context menu on any outside click ---------- */

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const id = setTimeout(() => {
      window.addEventListener('click', close);
      window.addEventListener('contextmenu', close);
    }, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [menu]);

  const aspectStyle = { aspectRatio: `${canvasWidth} / ${canvasHeight}` };

  return (
    <div className="pointer-events-auto flex items-stretch gap-3">
      {/* ---------------- left: playback ---------------- */}
      <div className="flex items-center gap-1 rounded-3xl border border-line bg-panel/90 p-2 shadow-float backdrop-blur-xl">
        <Tooltip label="Loop" hint="L">
          <IconButton active={isLooping} onClick={() => setLooping(!isLooping)}>
            <Repeat size={17} />
          </IconButton>
        </Tooltip>
        <Tooltip label="First frame" hint="Home">
          <IconButton onClick={() => setCurrentFrame(0)}>
            <SkipBack size={17} />
          </IconButton>
        </Tooltip>
        <Tooltip label="Previous frame" hint=",">
          <IconButton onClick={() => stepFrame(-1)}>
            <ChevronLeft size={19} />
          </IconButton>
        </Tooltip>

        <Tooltip label={isPlaying ? 'Pause' : 'Play'} hint="Space">
          <button
            type="button"
            onClick={() => setPlaying(!isPlaying)}
            className="mx-0.5 flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient text-white shadow-brand transition-transform active:scale-90"
          >
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
          </button>
        </Tooltip>

        <Tooltip label="Next frame" hint=".">
          <IconButton onClick={() => stepFrame(1)}>
            <ChevronRight size={19} />
          </IconButton>
        </Tooltip>
        <Tooltip label="Last frame" hint="End">
          <IconButton onClick={() => setCurrentFrame(frames.length - 1)}>
            <SkipForward size={17} />
          </IconButton>
        </Tooltip>

        <div className="mx-1 h-7 w-px bg-line" />

        {/* fps */}
        <Popover
          open={showFps}
          onClose={() => setShowFps(false)}
          className="bottom-full left-0 mb-2 w-52"
          anchor={
            <button
              type="button"
              onClick={() => setShowFps((v) => !v)}
              className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
            >
              <Gauge size={16} />
              <span className="tabular text-xs font-extrabold">{fps}</span>
              <span className="text-[10px] font-bold text-ink-3">FPS</span>
            </button>
          }
        >
          <MenuLabel>Frame rate</MenuLabel>
          <div className="grid grid-cols-3 gap-1 p-1">
            {FPS_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFps(f)}
                className={`h-9 rounded-lg text-xs font-extrabold transition-colors ${
                  fps === f ? 'brand-gradient text-white' : 'bg-panel-2 text-ink-2 hover:text-ink'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <MenuDivider />
          <div className="px-2 pb-1 text-[11px] font-semibold text-ink-3">
            {frames.length} frames · {duration.toFixed(2)}s
          </div>
        </Popover>
      </div>

      {/* ---------------- centre: frame track ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col rounded-3xl border border-line bg-panel/90 shadow-float backdrop-blur-xl">
        <div className="flex items-center gap-4 px-4 pt-2.5">
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
              Frames
            </span>
            <span className="tabular rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-extrabold text-brand">
              {currentFrameIndex + 1} / {frames.length}
            </span>
          </div>
          
          <input 
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={currentFrameIndex}
            onChange={(e) => {
              setPlaying(false);
              setCurrentFrame(parseInt(e.target.value));
            }}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line-2 outline-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
          />

          <div className="tabular shrink-0 flex items-center gap-1 text-[10px] font-bold text-ink-3">
            <Clock size={11} />
            {duration.toFixed(2)}s
          </div>
        </div>

        <div
          ref={trackRef}
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 pb-3 pt-2"
        >
          {frames.map((frame, index) => {
            const isActive = index === currentFrameIndex;
            const isDropTarget = dropIndex === index && dragIndex !== index;

            return (
              <div
                key={frame.id}
                data-frame={index}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropIndex(index);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) moveFrame(dragIndex, index);
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                onClick={() => setCurrentFrame(index)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCurrentFrame(index);
                  setMenu({ index, x: e.clientX, y: e.clientY });
                }}
                style={aspectStyle}
                className={`group relative h-[4.25rem] shrink-0 cursor-pointer overflow-hidden rounded-xl bg-white transition-all ${
                  isActive
                    ? 'shadow-brand ring-2 ring-brand'
                    : 'ring-1 ring-line hover:ring-line-2'
                } ${dragIndex === index ? 'opacity-40' : ''} ${
                  isDropTarget ? 'ring-2 ring-accent' : ''
                }`}
                title={`Frame ${index + 1} — right-click for options`}
              >
                <FramePreview
                  frame={frame}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />

                <span
                  className={`tabular absolute left-0 top-0 rounded-br-lg px-1.5 py-0.5 text-[9px] font-extrabold ${
                    isActive ? 'bg-brand text-white' : 'bg-black/45 text-white'
                  }`}
                >
                  {index + 1}
                </span>

                {frame.holdDuration > 1 && (
                  <span className="tabular absolute bottom-0 right-0 rounded-tl-lg bg-accent px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                    ×{frame.holdDuration}
                  </span>
                )}

                {frame.layers.length > 1 && (
                  <span className="tabular absolute right-0 top-0 flex items-center gap-0.5 rounded-bl-lg bg-black/45 px-1 py-0.5 text-[9px] font-extrabold text-white">
                    <Layers size={8} />
                    {frame.layers.length}
                  </span>
                )}
              </div>
            );
          })}

          {/* add frame */}
          <div className="flex shrink-0 gap-1.5 pl-1">
            <Tooltip label="New frame" hint="A">
              <button
                type="button"
                onClick={() => addFrame(true)}
                style={aspectStyle}
                className="flex h-[4.25rem] items-center justify-center rounded-xl border-2 border-dashed border-line-2 text-ink-3 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
              >
                <Plus size={20} />
              </button>
            </Tooltip>
            <Tooltip label="Duplicate current frame" hint="D">
              <button
                type="button"
                onClick={duplicateFrame}
                style={aspectStyle}
                className="flex h-[4.25rem] items-center justify-center rounded-xl border-2 border-dashed border-line-2 text-ink-3 transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
              >
                <CopyPlus size={18} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ---------------- right: onion + layers ---------------- */}
      <div className="flex items-center gap-1 rounded-3xl border border-line bg-panel/90 p-2 shadow-float backdrop-blur-xl">
        <Popover
          open={showOnion}
          onClose={() => setShowOnion(false)}
          className="bottom-full right-0 mb-2 w-64 p-4"
          anchor={
            <div className="flex items-center">
              <Tooltip label="Toggle onion skin" hint="O">
                <button
                  type="button"
                  onClick={() => setOnionSkin(!onionSkin)}
                  className={`flex h-10 items-center gap-1.5 rounded-l-xl pl-2.5 pr-2 transition-colors ${
                    onionSkin
                      ? 'bg-brand-soft text-brand'
                      : 'text-ink-2 hover:bg-panel-2 hover:text-ink'
                  }`}
                >
                  <Sparkles size={17} />
                  <span className="tabular text-[11px] font-extrabold">
                    {onionSkin ? `${onionPrevCount}/${onionNextCount}` : 'off'}
                  </span>
                </button>
              </Tooltip>
              <Tooltip label="Onion skin settings">
                <button
                  type="button"
                  onClick={() => setShowOnion((v) => !v)}
                  className={`flex h-10 w-6 items-center justify-center rounded-r-xl transition-colors ${
                    onionSkin
                      ? 'bg-brand-soft text-brand'
                      : 'text-ink-3 hover:bg-panel-2 hover:text-ink'
                  }`}
                >
                  <ChevronUp size={14} className={showOnion ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
              </Tooltip>
            </div>
          }
        >
          <div className="mb-3">
            <Switch
              checked={onionSkin}
              onChange={setOnionSkin}
              label="Onion skin"
              description="Ghost the neighbouring frames"
            />
          </div>
          <div className={onionSkin ? 'space-y-3' : 'pointer-events-none space-y-3 opacity-40'}>
            <Slider
              label="Frames before"
              value={onionPrevCount}
              min={0}
              max={4}
              onChange={(v) => setOnionOption('onionPrevCount', v)}
            />
            <Slider
              label="Frames after"
              value={onionNextCount}
              min={0}
              max={4}
              onChange={(v) => setOnionOption('onionNextCount', v)}
            />
            <Slider
              label="Strength"
              value={Math.round(onionOpacity * 100)}
              min={5}
              max={80}
              suffix="%"
              onChange={(v) => setOnionOption('onionOpacity', v / 100)}
            />
            <Switch
              checked={onionTinted}
              onChange={setOnionTinted}
              label="Colour tint"
              description="Pink before, teal after"
            />
          </div>
        </Popover>

        <Tooltip label="Layers" hint="Y">
          <button
            type="button"
            onClick={() => toggleSidebar('layers')}
            className={`relative flex h-10 items-center gap-1.5 rounded-xl px-2.5 transition-colors ${
              sidebarOpen && sidebarTab === 'layers'
                ? 'bg-brand-soft text-brand'
                : 'text-ink-2 hover:bg-panel-2 hover:text-ink'
            }`}
          >
            <Layers size={18} />
            <span className="tabular text-[11px] font-extrabold">{layerCount}</span>
          </button>
        </Tooltip>
      </div>

      {/* ---------------- frame context menu ---------------- */}
      {menu && (
        <div
          className="fixed z-[80] w-52 rounded-2xl border border-line bg-panel p-1.5 shadow-float"
          style={{
            left: Math.min(menu.x, window.innerWidth - 220),
            top: Math.max(12, menu.y - 250),
            animation: 'pop-in 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuLabel>Frame {menu.index + 1}</MenuLabel>
          <MenuItem icon={<CopyPlus size={14} />} onClick={() => { setCurrentFrame(menu.index); duplicateFrame(); setMenu(null); }}>
            Duplicate
          </MenuItem>
          <MenuItem icon={<Copy size={14} />} onClick={() => { copyFrame(menu.index); setMenu(null); }}>
            Copy
          </MenuItem>
          <MenuItem 
            icon={<Wand2 size={14} />} 
            disabled={menu.index === frames.length - 1}
            onClick={() => { tweenFrame(menu.index, menu.index + 1); setMenu(null); }}
          >
            Auto-Tween
          </MenuItem>
          <MenuDivider />
          <MenuLabel>Hold</MenuLabel>
          <div className="flex items-center gap-1 px-2 pb-1.5">
            <button
              type="button"
              onClick={() => setFrameHold(menu.index, (frames[menu.index]?.holdDuration || 1) - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-panel-2 text-ink-2 hover:text-ink"
            >
              −
            </button>
            <span className="tabular flex-1 text-center text-xs font-extrabold text-ink">
              ×{frames[menu.index]?.holdDuration || 1}
            </span>
            <button
              type="button"
              onClick={() => setFrameHold(menu.index, (frames[menu.index]?.holdDuration || 1) + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-panel-2 text-ink-2 hover:text-ink"
            >
              +
            </button>
          </div>
          <MenuDivider />
          <MenuItem
            danger
            icon={<Trash2 size={14} />}
            disabled={frames.length <= 1}
            onClick={() => { deleteFrame(menu.index); setMenu(null); }}
          >
            Delete frame
          </MenuItem>
        </div>
      )}
    </div>
  );
};

export default Timeline;
