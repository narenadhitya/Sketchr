import React from 'react';
import { useStore } from '../store';
import { ChevronLeft, Ruler, Copy, ClipboardPaste, Undo, Redo, Maximize2, MoreVertical } from 'lucide-react';

const Topbar: React.FC = () => {
  const projectName = useStore(state => state.projectName);
  const setProjectName = useStore(state => state.setProjectName);

  return (
    <div className="flex justify-between items-center px-4 py-4 z-10 pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <button className="p-2 rounded-full hover:bg-black/5 cursor-pointer">
          <ChevronLeft size={24} className="text-gray-500" />
        </button>
        <input 
          type="text" 
          value={projectName} 
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent border-none text-gray-800 font-bold text-lg focus:ring-0 focus:outline-none w-48 truncate"
        />
      </div>
      
      <div className="flex items-center gap-2 pointer-events-auto">
        <button className="p-2 rounded-full hover:bg-black/5 text-gray-500 cursor-pointer"><Ruler size={20} strokeWidth={1.5} /></button>
        <button className="p-2 rounded-full hover:bg-black/5 text-gray-500 cursor-pointer"><Copy size={20} strokeWidth={1.5} /></button>
        <button className="p-2 rounded-full hover:bg-black/5 text-gray-300 cursor-default"><ClipboardPaste size={20} strokeWidth={1.5} /></button>
        <button className="p-2 rounded-full hover:bg-black/5 text-gray-300 cursor-default"><Undo size={20} strokeWidth={1.5} /></button>
        <button className="p-2 rounded-full hover:bg-black/5 text-gray-300 cursor-default"><Redo size={20} strokeWidth={1.5} /></button>
        <button className="p-2 rounded-full hover:bg-black/5 text-gray-500 cursor-pointer"><Maximize2 size={20} strokeWidth={1.5} /></button>
        <button className="p-2 rounded-full hover:bg-black/5 text-gray-500 cursor-pointer"><MoreVertical size={20} strokeWidth={1.5} /></button>
      </div>
    </div>
  );
};

export default Topbar;
