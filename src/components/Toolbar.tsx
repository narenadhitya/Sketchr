import React, { useState } from 'react';
import { useStore } from '../store';
import { PenTool, Pencil, Highlighter, Eraser, MousePointer2, PaintBucket, Type, Palette } from 'lucide-react';

const COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
  '#FFFFFF', '#FF0000', '#FF8800', '#FFFF00', '#88FF00',
  '#00FF00', '#00FF88', '#00FFFF', '#0088FF', '#0000FF',
  '#8800FF', '#FF00FF', '#FF0088', '#8B4513', '#D2691E',
  '#F4A460', '#FFDAB9', '#FFC0CB', '#FF69B4', '#C71585'
];

const Toolbar: React.FC = () => {
  const tool = useStore(state => state.tool);
  const setTool = useStore(state => state.setTool);
  const brushColor = useStore(state => state.brushColor);
  const setBrushColor = useStore(state => state.setBrushColor);
  const brushSize = useStore(state => state.brushSize);
  const setBrushSize = useStore(state => state.setBrushSize);

  const [showSettings, setShowSettings] = useState(false);

  const handleToolClick = (newTool: any) => {
    if (tool === newTool) {
      setShowSettings(!showSettings);
    } else {
      setTool(newTool);
      setShowSettings(true);
    }
  };

  return (
    <div className="relative pointer-events-auto">
      <div className="flex flex-col items-center bg-white/90 backdrop-blur-md rounded-[2rem] shadow-sm border border-gray-100 p-2 gap-2">
        <button 
          onClick={() => handleToolClick('pen')}
          className={`p-3 rounded-2xl transition-colors ${tool === 'pen' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
          title="Pen"
        >
          <PenTool size={22} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => handleToolClick('pencil')}
          className={`p-3 rounded-2xl transition-colors ${tool === 'pencil' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
          title="Pencil"
        >
          <Pencil size={22} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => handleToolClick('highlighter')}
          className={`p-3 rounded-2xl transition-colors ${tool === 'highlighter' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
          title="Highlighter"
        >
          <Highlighter size={22} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => handleToolClick('eraser')}
          className={`p-3 rounded-2xl transition-colors ${tool === 'eraser' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
          title="Eraser"
        >
          <Eraser size={22} strokeWidth={1.5} />
        </button>
        
        <div className="w-8 h-px bg-gray-200 my-1"></div>
        
        <button className="p-3 rounded-2xl text-gray-600 hover:bg-gray-100 cursor-pointer" title="Lasso">
          <MousePointer2 size={22} strokeWidth={1.5} className="rotate-90" />
        </button>
        <button 
          onClick={() => handleToolClick('bucket')}
          className={`p-3 rounded-2xl transition-colors ${tool === 'bucket' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
          title="Bucket"
        >
          <PaintBucket size={22} strokeWidth={1.5} />
        </button>
        <button className="p-3 rounded-2xl text-gray-600 hover:bg-gray-100 cursor-pointer" title="Text">
          <Type size={22} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-2xl text-gray-600 hover:bg-gray-100 cursor-pointer" title="Palette"
        >
          <Palette size={22} strokeWidth={1.5} />
        </button>
      </div>

      {showSettings && (
        <div className="absolute left-full top-0 ml-4 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tool Settings</h3>
            {/* Preview Circle */}
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
               <div 
                 className="rounded-full" 
                 style={{ 
                   backgroundColor: brushColor, 
                   width: Math.min(brushSize, 40), 
                   height: Math.min(brushSize, 40),
                   opacity: tool === 'highlighter' ? 0.4 : tool === 'pencil' ? 0.7 : 1
                 }} 
               />
            </div>
          </div>
          
          {tool !== 'bucket' && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Size</span>
                <span className="text-sm font-bold text-gray-800">{brushSize}px</span>
              </div>
              <input 
                type="range" 
                min="1" max="100" 
                value={brushSize} 
                onChange={e => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-[#ff4d79]"
              />
            </div>
          )}

          <div>
            <span className="text-sm text-gray-600 mb-2 block">Color</span>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${brushColor === c ? 'border-[#ff4d79] scale-110 shadow-sm' : 'border-gray-200 hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
