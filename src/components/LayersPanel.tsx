import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  MoreVertical,
  Plus,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useStore } from '../store';
import FramePreview from './FramePreview';
import { IconButton, InlineEdit, MenuDivider, MenuItem, Popover, Slider, Tooltip } from './ui';

/** Layer stack for the current frame. Rendered inside the right sidebar. */
const LayersPanel: React.FC = () => {
  const frames = useStore((s) => s.frames);
  const currentFrameIndex = useStore((s) => s.currentFrameIndex);
  const activeLayerIndex = useStore((s) => s.activeLayerIndex);
  const canvasWidth = useStore((s) => s.canvasWidth);
  const canvasHeight = useStore((s) => s.canvasHeight);

  const setActiveLayer = useStore((s) => s.setActiveLayer);
  const addLayer = useStore((s) => s.addLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);
  const duplicateLayer = useStore((s) => s.duplicateLayer);
  const mergeLayerDown = useStore((s) => s.mergeLayerDown);
  const moveLayer = useStore((s) => s.moveLayer);
  const renameLayer = useStore((s) => s.renameLayer);
  const toggleLayerVisibility = useStore((s) => s.toggleLayerVisibility);
  const toggleLayerLock = useStore((s) => s.toggleLayerLock);
  const setLayerOpacity = useStore((s) => s.setLayerOpacity);

  const [menuFor, setMenuFor] = useState<number | null>(null);

  const frame = frames[currentFrameIndex];
  if (!frame) return null;

  const layers = frame.layers;
  const activeLayer = layers[activeLayerIndex];

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="flex-1 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
          Frame {currentFrameIndex + 1}
        </span>
        <span className="tabular rounded-full bg-panel-2 px-2 py-0.5 text-[10px] font-extrabold text-ink-3">
          {layers.length}/12
        </span>
        <Tooltip label="Add layer" side="left">
          <IconButton size="sm" onClick={addLayer} disabled={layers.length >= 12}>
            <Plus size={15} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Rendered top-down: index 0 is the bottom of the stack. */}
      <div>
        {[...layers].reverse().map((layer, reverseIndex) => {
          const index = layers.length - 1 - reverseIndex;
          const isActive = index === activeLayerIndex;

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(index)}
              className={`group relative mb-1 flex cursor-pointer items-center gap-2.5 rounded-2xl p-2 transition-colors ${
                isActive ? 'bg-brand-soft ring-1 ring-brand/40' : 'hover:bg-panel-2'
              }`}
            >
              <div
                className="h-10 w-13 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line"
                style={{
                  width: '3.25rem',
                  opacity: layer.visible ? Math.max(0.25, layer.opacity) : 0.2,
                }}
              >
                <FramePreview layer={layer} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
              </div>

              <div className="min-w-0 flex-1">
                <InlineEdit
                  value={layer.name}
                  onCommit={(v) => renameLayer(index, v)}
                  className={`block w-full text-[13px] font-bold ${
                    isActive ? 'text-ink' : 'text-ink-2'
                  }`}
                  inputClassName="text-[13px] font-bold text-ink"
                />
                <span className="tabular text-[10px] font-semibold text-ink-3">
                  {layer.strokes.length} stroke{layer.strokes.length === 1 ? '' : 's'}
                  {layer.opacity < 1 && ` · ${Math.round(layer.opacity * 100)}%`}
                </span>
              </div>

              <div className="flex shrink-0 items-center">
                <IconButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(index);
                  }}
                  aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                  className={layer.visible ? '' : 'text-brand'}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </IconButton>
                <IconButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerLock(index);
                  }}
                  aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  className={layer.locked ? 'text-warn' : ''}
                >
                  {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </IconButton>

                <Popover
                  open={menuFor === index}
                  onClose={() => setMenuFor(null)}
                  className="right-0 top-full z-50 mt-1 w-44"
                  anchor={
                    <IconButton
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor(menuFor === index ? null : index);
                      }}
                      aria-label="Layer options"
                    >
                      <MoreVertical size={14} />
                    </IconButton>
                  }
                >
                  <MenuItem
                    icon={<ChevronUp size={14} />}
                    disabled={index === layers.length - 1}
                    onClick={() => {
                      moveLayer(index, index + 1);
                      setMenuFor(null);
                    }}
                  >
                    Move up
                  </MenuItem>
                  <MenuItem
                    icon={<ChevronDown size={14} />}
                    disabled={index === 0}
                    onClick={() => {
                      moveLayer(index, index - 1);
                      setMenuFor(null);
                    }}
                  >
                    Move down
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    icon={<Copy size={14} />}
                    onClick={() => {
                      duplicateLayer(index);
                      setMenuFor(null);
                    }}
                  >
                    Duplicate
                  </MenuItem>
                  <MenuItem
                    icon={<ArrowDownToLine size={14} />}
                    disabled={index === 0}
                    onClick={() => {
                      mergeLayerDown(index);
                      setMenuFor(null);
                    }}
                  >
                    Merge down
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    danger
                    icon={<Trash2 size={14} />}
                    disabled={layers.length <= 1}
                    onClick={() => {
                      deleteLayer(index);
                      setMenuFor(null);
                    }}
                  >
                    Delete
                  </MenuItem>
                </Popover>
              </div>
            </div>
          );
        })}
      </div>

      {activeLayer && (
        <div className="mt-3 border-t border-line px-1 pt-3">
          <Slider
            label={`${activeLayer.name} opacity`}
            value={Math.round(activeLayer.opacity * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => setLayerOpacity(activeLayerIndex, v / 100)}
          />
        </div>
      )}
    </div>
  );
};

export default LayersPanel;
