import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CANVAS_PRESETS, FPS_OPTIONS, useStore } from '../store';
import { Button, Modal } from './ui';

const NewProjectModal: React.FC = () => {
  const open = useStore((s) => s.showNewProject);
  const setPanel = useStore((s) => s.setPanel);
  const createProject = useStore((s) => s.createProject);

  const [name, setName] = useState('');
  const [presetIndex, setPresetIndex] = useState(0);
  const [fps, setFps] = useState(12);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the form each time the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName('');
      setPresetIndex(0);
      setFps(12);
    }
  }

  const preset = CANVAS_PRESETS[presetIndex];

  const submit = () =>
    createProject({ name, width: preset.width, height: preset.height, fps });

  return (
    <Modal
      open={open}
      onClose={() => setPanel('showNewProject', false)}
      title="New animation"
      subtitle="Pick a canvas and a frame rate to start with"
      icon={<Sparkles size={18} />}
      footer={
        <>
          <Button variant="ghost" onClick={() => setPanel('showNewProject', false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create project</Button>
        </>
      }
    >
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-ink-3">
          Project name
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Untitled Project"
          className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm font-bold text-ink outline-none transition-colors placeholder:font-medium placeholder:text-ink-3 focus:border-brand"
        />
      </label>

      <div className="mt-5">
        <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-widest text-ink-3">
          Canvas
        </span>
        <div className="grid grid-cols-4 gap-2">
          {CANVAS_PRESETS.map((p, i) => (
            <button
              key={p.ratio}
              type="button"
              onClick={() => setPresetIndex(i)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                presetIndex === i
                  ? 'border-brand bg-brand-soft'
                  : 'border-line hover:border-line-2 hover:bg-panel-2'
              }`}
            >
              <span className="flex h-12 w-full items-center justify-center">
                <span
                  className={`rounded-[3px] ring-1 ${
                    presetIndex === i ? 'bg-brand ring-brand' : 'bg-panel-3 ring-line-2'
                  }`}
                  style={{
                    width: p.width >= p.height ? 40 : (40 * p.width) / p.height,
                    height: p.width >= p.height ? (40 * p.height) / p.width : 40,
                  }}
                />
              </span>
              <span className="text-center leading-tight">
                <span className="block text-[11px] font-extrabold text-ink">{p.label}</span>
                <span className="tabular block text-[10px] font-bold text-ink-3">{p.ratio}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="tabular mt-2 text-[11px] font-bold text-ink-3">
          {preset.width} × {preset.height} px
        </p>
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-widest text-ink-3">
          Frame rate
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {FPS_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFps(f)}
              className={`h-10 rounded-xl text-xs font-extrabold transition-colors ${
                fps === f ? 'brand-gradient text-white shadow-brand' : 'bg-panel-2 text-ink-2 hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] font-medium text-ink-3">
          12 fps is the classic hand-drawn look. Higher values are smoother but need more drawings.
        </p>
      </div>
    </Modal>
  );
};

export default NewProjectModal;
