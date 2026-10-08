import React, { useEffect, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import Timeline from './Timeline';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import ExportModal from './ExportModal';
import ShortcutsModal from './ShortcutsModal';
import { useStore } from '../store';
import { useShortcuts } from '../hooks/useShortcuts';
import { frameToDataUrl } from '../lib/render';

const AUTOSAVE_DELAY = 1200;

const Editor: React.FC = () => {
  const frames = useStore((s) => s.frames);
  const projectName = useStore((s) => s.projectName);
  const fps = useStore((s) => s.fps);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);
  const background = useStore((s) => s.background);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const isPlaying = useStore((s) => s.isPlaying);
  const saveCurrentProject = useStore((s) => s.saveCurrentProject);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const setCurrentThumbnail = useStore((s) => s.setCurrentThumbnail);

  const firstRun = useRef(true);

  useShortcuts();

  /* Debounced autosave — only after something actually changed. */
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setSaveStatus('Saving...');
    const timer = setTimeout(async () => {
      // Frame 1 stands in as the project's cover art.
      const thumb = frameToDataUrl(frames[0], canvasWidth, canvasHeight, 480, background);
      setCurrentThumbnail(thumb);
      await saveCurrentProject();
      setSaveStatus('Saved');
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [
    frames,
    projectName,
    fps,
    canvasWidth,
    canvasHeight,
    background,
    saveCurrentProject,
    setSaveStatus,
    setCurrentThumbnail,
  ]);

  /* Save once more on the way out of the tab. */
  useEffect(() => {
    const onLeave = () => void saveCurrentProject();
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      onLeave();
    };
  }, [saveCurrentProject]);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-app text-ink">
      {/* canvas fills the shell; every panel floats above it */}
      <div className="absolute inset-0 z-0">
        <DrawingCanvas />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <Topbar />
      </div>

      <div className="pointer-events-none absolute left-5 top-1/2 z-20 -translate-y-1/2">
        <Toolbar />
      </div>

      {sidebarOpen && (
        <div className="pointer-events-none absolute bottom-[9.5rem] right-5 top-[5.5rem] z-20 flex items-stretch">
          <Sidebar />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4">
        <Timeline />
      </div>

      {/* playback badge */}
      {isPlaying && (
        <div
          className="pointer-events-none absolute left-1/2 top-20 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink/85 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-app shadow-float"
          style={{ animation: 'fade-in 0.2s ease-out' }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
          Playing
        </div>
      )}

      <ExportModal />
      <ShortcutsModal />
    </div>
  );
};

export default Editor;
