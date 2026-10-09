import React from 'react';
import {
  Check,
  Clock,
  FlipHorizontal2,
  FlipVertical2,
  Film,
  ImagePlus,
  Layers,
  PenLine,
  Ruler,
  Scan,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useStore } from '../store';
import type { BackgroundKind } from '../store';
import { Segmented, Slider, Switch } from './ui';

const BACKGROUNDS: { value: BackgroundKind; label: string; preview: string }[] = [
  { value: 'white', label: 'Plain', preview: 'bg-white' },
  {
    value: 'grid',
    label: 'Grid',
    preview:
      'bg-white bg-[linear-gradient(to_right,#0002_1px,transparent_1px),linear-gradient(to_bottom,#0002_1px,transparent_1px)] bg-[length:8px_8px]',
  },
  {
    value: 'dots',
    label: 'Dots',
    preview: 'bg-white bg-[radial-gradient(#0003_1px,transparent_1px)] bg-[length:8px_8px]',
  },
  {
    value: 'lined',
    label: 'Ruled',
    preview: 'bg-white bg-[linear-gradient(to_bottom,#0002_1px,transparent_1px)] bg-[length:8px_8px]',
  },
  { value: 'transparent', label: 'None', preview: 'checkerboard' },
];

const ZOOMS = [0.5, 1, 2, 4];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h4 className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">{title}</h4>
    {children}
  </section>
);

const CanvasPanel: React.FC = () => {
  const background = useStore((s) => s.background);
  const setBackground = useStore((s) => s.setBackground);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const resetView = useStore((s) => s.resetView);
  const symmetry = useStore((s) => s.symmetry);
  const setSymmetry = useStore((s) => s.setSymmetry);
  const strokeSmoothing = useStore((s) => s.strokeSmoothing);
  const setStrokeSmoothing = useStore((s) => s.setStrokeSmoothing);
  const isRulerActive = useStore((s) => s.isRulerActive);
  const toggleRuler = useStore((s) => s.toggleRuler);
  const onionSkin = useStore((s) => s.onionSkin);
  const setOnionSkin = useStore((s) => s.setOnionSkin);
  const onionPrevCount = useStore((s) => s.onionPrevCount);
  const onionNextCount = useStore((s) => s.onionNextCount);
  const onionOpacity = useStore((s) => s.onionOpacity);
  const onionTinted = useStore((s) => s.onionTinted);
  const setOnionOption = useStore((s) => s.setOnionOption);
  const setOnionTinted = useStore((s) => s.setOnionTinted);
  const flipActiveLayer = useStore((s) => s.flipActiveLayer);

  const frames = useStore((s) => s.frames);
  const currentFrameIndex = useStore((s) => s.currentFrameIndex);
  const activeLayerIndex = useStore((s) => s.activeLayerIndex);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);
  const fps = useStore((s) => s.fps);
  const toast = useStore((s) => s.toast);
  const referenceImage = useStore((s) => s.referenceImage);
  const setReferenceImage = useStore((s) => s.setReferenceImage);
  const referenceOpacity = useStore((s) => s.referenceOpacity);
  const setReferenceOpacity = useStore((s) => s.setReferenceOpacity);

  const frame = frames[currentFrameIndex];
  const layer = frame?.layers[activeLayerIndex];
  const strokesInFrame = frame?.layers.reduce((n, l) => n + l.strokes.length, 0) ?? 0;
  const totalStrokes = frames.reduce(
    (n, f) => n + f.layers.reduce((m, l) => m + l.strokes.length, 0),
    0,
  );
  const duration = frames.reduce((sum, f) => sum + (f.holdDuration || 1), 0) / fps;

  return (
    <div className="space-y-5 p-4">
      <Section title="Paper">
        <div className="grid grid-cols-5 gap-1.5">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.value}
              type="button"
              title={bg.label}
              onClick={() => setBackground(bg.value)}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className={`relative h-10 w-full rounded-lg ring-1 ring-inset ring-black/15 ${bg.preview} ${
                  background === bg.value ? 'ring-2 ring-brand ring-offset-2 ring-offset-panel' : ''
                }`}
              >
                {background === bg.value && (
                  <Check size={12} className="absolute right-0.5 top-0.5 text-brand" />
                )}
              </span>
              <span className="text-[9px] font-bold text-ink-3">{bg.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="View">
        <div className="flex items-center gap-2">
          <Segmented
            size="sm"
            value={ZOOMS.includes(zoom) ? zoom : 0}
            onChange={(v) => v && setZoom(v)}
            options={ZOOMS.map((z) => ({ value: z, label: `${z * 100}%` }))}
          />
          <button
            type="button"
            onClick={resetView}
            className="flex h-7 items-center gap-1 rounded-lg bg-panel-2 px-2 text-[11px] font-bold text-ink-2 transition-colors hover:text-ink"
          >
            <Scan size={12} />
            Fit
          </button>
        </div>
      </Section>

      <Section title="Drawing aids">
        <div className="space-y-2.5">
          <Switch
            checked={isRulerActive}
            onChange={toggleRuler}
            label="Straight-line ruler"
            description="Every stroke becomes a straight line"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-ink">Symmetry</span>
              <span className="block text-[11px] font-medium text-ink-3">
                Mirror each stroke as you draw
              </span>
            </span>
            <Segmented
              size="sm"
              value={symmetry}
              onChange={setSymmetry}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'vertical', label: <FlipHorizontal2 size={13} />, title: 'Mirror left / right' },
                { value: 'horizontal', label: <FlipVertical2 size={13} />, title: 'Mirror top / bottom' },
              ]}
            />
          </div>
          <Slider
            label="Stabilizer"
            value={strokeSmoothing}
            min={0}
            max={100}
            suffix="%"
            onChange={setStrokeSmoothing}
          />
        </div>
      </Section>

      <Section title="Onion skin">
        <div className="space-y-3">
          <Switch
            checked={onionSkin}
            onChange={setOnionSkin}
            label="Show neighbouring frames"
            description="Pink behind, teal ahead"
          />
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
            <Switch checked={onionTinted} onChange={setOnionTinted} label="Colour tint" />
          </div>
        </div>
      </Section>

      <Section title={`Transform · ${layer?.name ?? 'layer'}`}>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={!layer?.strokes.length}
            onClick={() => {
              flipActiveLayer('horizontal');
              toast('Layer flipped');
            }}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-panel-2 text-[11px] font-bold text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
          >
            <FlipHorizontal2 size={13} />
            Flip across
          </button>
          <button
            type="button"
            disabled={!layer?.strokes.length}
            onClick={() => {
              flipActiveLayer('vertical');
              toast('Layer flipped');
            }}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-panel-2 text-[11px] font-bold text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
          >
            <FlipVertical2 size={13} />
            Flip down
          </button>
        </div>
      </Section>

      <Section title="Reference Image">
        <div className="space-y-3">
          {referenceImage ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-panel-2">
                <img src={referenceImage} alt="Reference" className="h-full w-full object-contain opacity-50" />
                <button
                  type="button"
                  onClick={() => setReferenceImage(null)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-danger"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <Slider
                label="Opacity"
                value={Math.round(referenceOpacity * 100)}
                min={5}
                max={100}
                suffix="%"
                onChange={(v) => setReferenceOpacity(v / 100)}
              />
            </div>
          ) : (
            <label className="flex h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-2 text-ink-3 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand">
              <ImagePlus size={18} />
              <span className="text-[11px] font-bold">Upload image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (typeof ev.target?.result === 'string') {
                      setReferenceImage(ev.target.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          )}
        </div>
      </Section>

      <Section title="Project">
        <dl className="space-y-1.5 rounded-xl bg-panel-2 p-3">
          {[
            { icon: <Scan size={12} />, label: 'Canvas', value: `${canvasWidth} × ${canvasHeight}` },
            { icon: <Film size={12} />, label: 'Frames', value: String(frames.length) },
            { icon: <Clock size={12} />, label: 'Duration', value: `${duration.toFixed(2)}s` },
            { icon: <Layers size={12} />, label: 'Layers here', value: String(frame?.layers.length ?? 0) },
            { icon: <PenLine size={12} />, label: 'Strokes here', value: String(strokesInFrame) },
            { icon: <Sparkles size={12} />, label: 'Strokes total', value: String(totalStrokes) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3">
                {row.icon}
                {row.label}
              </dt>
              <dd className="tabular text-[11px] font-extrabold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <p className="flex items-start gap-1.5 text-[10px] font-medium leading-relaxed text-ink-3">
        <Ruler size={11} className="mt-0.5 shrink-0" />
        Hold Shift while drawing to snap a line to 15° steps.
      </p>
    </div>
  );
};

export default CanvasPanel;
