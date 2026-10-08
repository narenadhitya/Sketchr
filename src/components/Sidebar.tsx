import React from 'react';
import { Layers, Palette, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../store';
import type { SidebarTab } from '../store';
import ColorPanel from './ColorPanel';
import CanvasPanel from './CanvasPanel';
import LayersPanel from './LayersPanel';
import { IconButton } from './ui';

const TABS: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
  { id: 'color', icon: <Palette size={15} />, label: 'Colour' },
  { id: 'layers', icon: <Layers size={15} />, label: 'Layers' },
  { id: 'canvas', icon: <SlidersHorizontal size={15} />, label: 'Canvas' },
];

/**
 * Right-hand dock holding the deeper controls that do not belong on the
 * always-visible chrome: the full colour picker, the layer stack, and canvas
 * and drawing-aid settings.
 */
const Sidebar: React.FC = () => {
  const tab = useStore((s) => s.sidebarTab);
  const setTab = useStore((s) => s.setSidebarTab);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  return (
    <aside
      className="pointer-events-auto flex w-[19rem] flex-col overflow-hidden rounded-3xl border border-line bg-panel/95 shadow-float backdrop-blur-xl"
      style={{ animation: 'slide-left 0.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <header className="flex shrink-0 items-center gap-1 border-b border-line p-2">
        <div className="flex flex-1 gap-0.5 rounded-xl bg-panel-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                tab === t.id ? 'bg-panel text-ink shadow-soft' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <IconButton size="sm" onClick={() => setSidebarOpen(false)} aria-label="Close panel">
          <X size={15} />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'color' && <ColorPanel />}
        {tab === 'layers' && <LayersPanel />}
        {tab === 'canvas' && <CanvasPanel />}
      </div>
    </aside>
  );
};

export default Sidebar;
