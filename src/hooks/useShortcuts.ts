import { useEffect } from 'react';
import { useStore } from '../store';
import type { ToolId } from '../store';

const TOOL_KEYS: Record<string, ToolId> = {
  b: 'pen',
  p: 'pencil',
  n: 'brush',
  h: 'highlighter',
  e: 'eraser',
  s: 'shape',
  g: 'bucket',
  t: 'text',
  i: 'eyedropper',
};

/** True while the user is typing into a field, where shortcuts must stay off. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

/**
 * Editor-wide keyboard map. Registered once by the Editor so the bindings are
 * live everywhere except inside text fields.
 */
export const useShortcuts = () => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;

      const s = useStore.getState();
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      if (mod) {
        switch (key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) s.redo();
            else s.undo();
            return;
          case 'y':
            e.preventDefault();
            s.redo();
            return;
          case 'c':
            e.preventDefault();
            s.copyStrokes();
            return;
          case 'v':
            e.preventDefault();
            s.pasteStrokes();
            return;
          case 's':
            e.preventDefault();
            s.saveCurrentProject().then(() => s.toast('Project saved', 'success'));
            return;
          case '0':
            e.preventDefault();
            s.resetView();
            return;
          default:
            return;
        }
      }

      // Any modal open? Let Escape close it and swallow the rest.
      const modalOpen = s.showExport || s.showShortcuts || s.showNewProject;
      if (modalOpen) return;

      if (TOOL_KEYS[key] && !e.shiftKey) {
        e.preventDefault();
        s.setTool(TOOL_KEYS[key]);
        return;
      }

      switch (e.key) {
        case ' ':
          // Space doubles as pan-while-held; only treat a clean tap as play.
          e.preventDefault();
          s.togglePlaying();
          break;
        case ',':
          e.preventDefault();
          s.stepFrame(-1);
          break;
        case '.':
          e.preventDefault();
          s.stepFrame(1);
          break;
        case 'Home':
          e.preventDefault();
          s.setCurrentFrame(0);
          break;
        case 'End':
          e.preventDefault();
          s.setCurrentFrame(s.frames.length - 1);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          s.clearLayer();
          s.toast('Layer cleared');
          break;
        case '?':
          e.preventDefault();
          s.setPanel('showShortcuts', true);
          break;
        case '[':
          e.preventDefault();
          s.setBrushSize(s.brushSize - Math.max(1, Math.round(s.brushSize * 0.15)));
          break;
        case ']':
          e.preventDefault();
          s.setBrushSize(s.brushSize + Math.max(1, Math.round(s.brushSize * 0.15)));
          break;
        default:
          break;
      }

      switch (key) {
        case 'a':
          e.preventDefault();
          s.addFrame();
          break;
        case 'd':
          e.preventDefault();
          s.duplicateFrame();
          break;
        case 'o':
          e.preventDefault();
          s.setOnionSkin(!s.onionSkin);
          break;
        case 'l':
          e.preventDefault();
          s.setLooping(!s.isLooping);
          break;
        case 'y':
          e.preventDefault();
          s.toggleSidebar('layers');
          break;
        case 'c':
          e.preventDefault();
          s.toggleSidebar('color');
          break;
        case 'r':
          e.preventDefault();
          s.toggleRuler();
          break;
        case 'm':
          e.preventDefault();
          s.setSymmetry(
            s.symmetry === 'off' ? 'vertical' : s.symmetry === 'vertical' ? 'horizontal' : 'off',
          );
          break;
        case 'f':
          e.preventDefault();
          if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
          else document.exitFullscreen().catch(() => {});
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
};
