import React from 'react';
import { useStore } from '../store';
import { PenTool, Pencil, Highlighter, Eraser, MousePointer2, PaintBucket, Type } from 'lucide-react';

const Toolbar: React.FC = () => {
  const tool = useStore(state => state.tool);
  const setTool = useStore(state => state.setTool);

  return (
    <div className="flex flex-col items-center bg-white/90 backdrop-blur-md rounded-[2rem] shadow-sm border border-gray-100 p-2 gap-2 pointer-events-auto">
      <button 
        onClick={() => setTool('pen')}
        className={`p-3 rounded-2xl transition-colors ${tool === 'pen' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
        title="Pen"
      >
        <PenTool size={22} strokeWidth={1.5} />
      </button>
      <button 
        onClick={() => setTool('pencil')}
        className={`p-3 rounded-2xl transition-colors ${tool === 'pencil' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
        title="Pencil"
      >
        <Pencil size={22} strokeWidth={1.5} />
      </button>
      <button 
        onClick={() => setTool('highlighter')}
        className={`p-3 rounded-2xl transition-colors ${tool === 'highlighter' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
        title="Highlighter"
      >
        <Highlighter size={22} strokeWidth={1.5} />
      </button>
      <button 
        onClick={() => setTool('eraser')}
        className={`p-3 rounded-2xl transition-colors ${tool === 'eraser' ? 'bg-[#ff4d79] text-white' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
        title="Eraser"
      >
        <Eraser size={22} strokeWidth={1.5} />
      </button>
      
      <div className="w-8 h-px bg-gray-200 my-1"></div>
      
      <button className="p-3 rounded-2xl text-gray-600 hover:bg-gray-100 cursor-pointer" title="Lasso">
        <MousePointer2 size={22} strokeWidth={1.5} className="rotate-90" />
      </button>
      <button className="p-3 rounded-2xl text-gray-600 hover:bg-gray-100 cursor-pointer" title="Bucket">
        <PaintBucket size={22} strokeWidth={1.5} />
      </button>
      <button className="p-3 rounded-2xl text-gray-600 hover:bg-gray-100 cursor-pointer" title="Text">
        <Type size={22} strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default Toolbar;
