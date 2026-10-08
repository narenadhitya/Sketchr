import React, { useState, useRef } from 'react';
import { Download, Film, Image as ImageIcon, Images, Loader2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useStore } from '../store';
import {
  downloadBlob,
  downloadDataUrl,
  drawBackground,
  drawFrame,
  slugify,
} from '../lib/render';
import { Button, Modal, Segmented, Switch } from './ui';

type ExportKind = 'png' | 'sequence' | 'video';

const SCALES = [
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ExportModal: React.FC = () => {
  const open = useStore((s) => s.showExport);
  const setPanel = useStore((s) => s.setPanel);
  const frames = useStore((s) => s.frames);
  const currentFrameIndex = useStore((s) => s.currentFrameIndex);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);
  const background = useStore((s) => s.background);
  const fps = useStore((s) => s.fps);
  const projectName = useStore((s) => s.projectName);
  const toast = useStore((s) => s.toast);

  const [kind, setKind] = useState<ExportKind>('png');
  const [scale, setScale] = useState(1);
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

  const width = Math.round(canvasWidth * scale);
  const height = Math.round(canvasHeight * scale);
  const stem = slugify(projectName);
  const totalTicks = frames.reduce((sum, f) => sum + (f.holdDuration || 1), 0);
  const duration = totalTicks / fps;

  const makeCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  const paint = (ctx: CanvasRenderingContext2D, index: number) => {
    ctx.clearRect(0, 0, width, height);
    if (!transparent) drawBackground(ctx, background === 'transparent' ? 'white' : background, width, height);
    ctx.save();
    ctx.scale(scale, scale);
    drawFrame(ctx, frames[index]);
    ctx.restore();
  };

  const exportPng = () => {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    paint(ctx, currentFrameIndex);
    downloadDataUrl(canvas.toDataURL('image/png'), `${stem}-frame-${currentFrameIndex + 1}.png`);
    toast('Frame exported', 'success');
  };

  const exportSequence = async () => {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    setBusy(true);
    try {
      for (let i = 0; i < frames.length; i++) {
        paint(ctx, i);
        downloadDataUrl(
          canvas.toDataURL('image/png'),
          `${stem}-${String(i + 1).padStart(3, '0')}.png`,
        );
        setProgress((i + 1) / frames.length);
        // Browsers throttle rapid successive downloads; pace them out.
        await sleep(180);
      }
      toast(`Exported ${frames.length} frames`, 'success');
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const exportVideo = async () => {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    setBusy(true);
    setProgress(0);

    const ffmpeg = ffmpegRef.current;
    
    try {
      if (!ffmpeg.loaded) {
        toast('Loading video encoder...', 'success');
        ffmpeg.on('progress', ({ progress: p }) => {
          // Progress during ffmpeg processing
          setProgress(0.5 + (p * 0.5));
        });
        
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        });
      }

      // 1. Write all frames to FFmpeg filesystem
      let frameCount = 0;
      for (let i = 0; i < frames.length; i++) {
        paint(ctx, i);
        const dataUrl = canvas.toDataURL('image/png');
        
        // Handle hold duration by writing duplicate frames
        const hold = frames[i].holdDuration || 1;
        for (let h = 0; h < hold; h++) {
          frameCount++;
          const filename = `frame-${String(frameCount).padStart(4, '0')}.png`;
          ffmpeg.writeFile(filename, await fetchFile(dataUrl));
        }
        
        // Progress bar for frame generation (0-50%)
        setProgress((i + 1) / frames.length * 0.5);
      }

      // 2. Run FFmpeg to encode to MP4
      // Scale requires even numbers for H.264
      await ffmpeg.exec([
        '-framerate', String(fps),
        '-i', 'frame-%04d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        'output.mp4'
      ]);

      // 3. Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      downloadBlob(blob, `${stem}.mp4`);
      
      toast('Video exported', 'success');

      // Cleanup
      for (let i = 1; i <= frameCount; i++) {
        ffmpeg.deleteFile(`frame-${String(i).padStart(4, '0')}.png`);
      }
      ffmpeg.deleteFile('output.mp4');
      
    } catch (err) {
      console.error(err);
      toast('Video export failed', 'error');
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const run = () => {
    if (kind === 'png') exportPng();
    else if (kind === 'sequence') exportSequence();
    else exportVideo();
  };

  const options: { value: ExportKind; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      value: 'png',
      icon: <ImageIcon size={18} />,
      title: 'Current frame',
      desc: `PNG · frame ${currentFrameIndex + 1}`,
    },
    {
      value: 'sequence',
      icon: <Images size={18} />,
      title: 'Frame sequence',
      desc: `${frames.length} numbered PNG files`,
    },
    {
      value: 'video',
      icon: <Film size={18} />,
      title: 'Animation',
      desc: `MP4 video · ${duration.toFixed(2)}s at ${fps} fps`,
    },
  ];

  return (
    <Modal
      open={open}
      onClose={() => !busy && setPanel('showExport', false)}
      title="Export"
      subtitle={`${projectName} · ${frames.length} frame${frames.length === 1 ? '' : 's'}`}
      icon={<Download size={18} />}
      footer={
        <>
          <Button variant="ghost" onClick={() => setPanel('showExport', false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {busy ? `${Math.round(progress * 100)}%` : 'Export'}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={busy}
            onClick={() => setKind(opt.value)}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
              kind === opt.value
                ? 'border-brand bg-brand-soft'
                : 'border-line hover:border-line-2 hover:bg-panel-2'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                kind === opt.value ? 'brand-gradient text-white' : 'bg-panel-2 text-ink-3'
              }`}
            >
              {opt.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-extrabold text-ink">{opt.title}</span>
              <span className="block text-[11px] font-semibold text-ink-3">{opt.desc}</span>
            </span>
            <span
              className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                kind === opt.value ? 'border-brand bg-brand' : 'border-line-2'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4 rounded-2xl bg-panel-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-ink">Resolution</span>
          <Segmented
            size="sm"
            value={scale}
            onChange={setScale}
            options={SCALES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>

        <div className="tabular flex items-center justify-between text-[11px] font-bold text-ink-3">
          <span>Output size</span>
          <span>
            {width} × {height} px
          </span>
        </div>

        {kind !== 'video' && (
          <Switch
            checked={transparent}
            onChange={setTransparent}
            label="Transparent background"
            description="Skip the paper, export only the artwork"
          />
        )}
      </div>

      {busy && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-panel-3">
          <div
            className="h-full brand-gradient transition-[width] duration-150"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {kind === 'video' && (
        <p className="mt-4 text-[11px] font-medium leading-relaxed text-ink-3">
          Video encoding happens entirely in your browser using FFmpeg. It takes a moment to process — keep this tab open until it finishes.
        </p>
      )}
    </Modal>
  );
};

export default ExportModal;
