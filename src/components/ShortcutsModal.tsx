import React from 'react';
import { Keyboard } from 'lucide-react';
import { useStore } from '../store';
import { Modal } from './ui';

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Tools',
    items: [
      ['B', 'Pen'],
      ['P', 'Pencil'],
      ['N', 'Brush'],
      ['H', 'Highlighter'],
      ['E', 'Eraser'],
      ['S', 'Shapes'],
      ['G', 'Fill'],
      ['T', 'Text'],
      ['I', 'Pick colour from canvas'],
      ['C', 'Colour panel'],
      ['[ / ]', 'Smaller / bigger brush'],
    ],
  },
  {
    title: 'Canvas',
    items: [
      ['Alt + drag', 'Pan'],
      ['Middle drag', 'Pan'],
      ['Wheel', 'Zoom to cursor'],
      ['Shift + wheel', 'Pan horizontally'],
      ['Ctrl + 0', 'Reset view'],
      ['R', 'Straight-line ruler'],
      ['M', 'Cycle symmetry'],
      ['Shift + drag', 'Snap to 15°'],
    ],
  },
  {
    title: 'Animation',
    items: [
      ['Space', 'Play / pause'],
      [', / .', 'Previous / next frame'],
      ['Home / End', 'First / last frame'],
      ['A', 'Add frame'],
      ['D', 'Duplicate frame'],
      ['O', 'Toggle onion skin'],
      ['L', 'Toggle loop'],
      ['Y', 'Layers panel'],
    ],
  },
  {
    title: 'Editing',
    items: [
      ['Ctrl + Z', 'Undo'],
      ['Ctrl + Y', 'Redo'],
      ['Ctrl + C', 'Copy layer'],
      ['Ctrl + V', 'Paste'],
      ['Ctrl + S', 'Save now'],
      ['Delete', 'Clear layer'],
      ['?', 'This help'],
    ],
  },
];

const Key: React.FC<{ children: string }> = ({ children }) => (
  <span className="flex flex-wrap justify-end gap-1">
    {children.split(' + ').map((part, i, all) => (
      <React.Fragment key={part}>
        <kbd className="rounded-md border border-line-2 bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-2 shadow-[0_1px_0_var(--color-line-2)]">
          {part}
        </kbd>
        {i < all.length - 1 && <span className="text-[10px] text-ink-3">+</span>}
      </React.Fragment>
    ))}
  </span>
);

const ShortcutsModal: React.FC = () => {
  const open = useStore((s) => s.showShortcuts);
  const setPanel = useStore((s) => s.setPanel);

  return (
    <Modal
      open={open}
      onClose={() => setPanel('showShortcuts', false)}
      title="Keyboard shortcuts"
      subtitle="Everything you can do without leaving the canvas"
      icon={<Keyboard size={18} />}
      width="max-w-3xl"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-brand">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map(([keys, action]) => (
                <li
                  key={keys}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink-2 odd:bg-panel-2"
                >
                  <span className="min-w-0 flex-1 truncate">{action}</span>
                  <Key>{keys}</Key>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
};

export default ShortcutsModal;
