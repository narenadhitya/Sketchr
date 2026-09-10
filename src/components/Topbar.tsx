import React from 'react';
import { useStore } from '../store';
import { ChevronLeft, Ruler, Copy, ClipboardPaste, Undo, Redo, Maximize2, MoreVertical, CheckCircle2, Loader2 } from 'lucide-react';

const Topbar: React.FC = () => {
  const projectName = useStore(state => state.projectName);
  const setProjectName = useStore(state => state.setProjectName);
  const setView = useStore(state => state.setView);
  const saveCurrentProject = useStore(state => state.saveCurrentProject);
  const saveStatus = useStore(state => state.saveStatus);
  
  const isRulerActive = useStore(state => state.isRulerActive);
  const toggleRuler = useStore(state => state.toggleRuler);
  const undoStroke = useStore(state => state.undoStroke);
  const redoStroke = useStore(state => state.redoStroke);
  const copyStrokes = useStore(state => state.copyStrokes);
  const pasteStrokes = useStore(state => state.pasteStrokes);
  const undoneStrokes = useStore(state => state.undoneStrokes);
  const clipboardStrokes = useStore(state => state.clipboardStrokes);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex justify-between items-center px-4 py-4 z-10 pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <button 
          onClick={() => {
            saveCurrentProject();
            setView('home');
          }}
          className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
        >
          <ChevronLeft size={24} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-lg font-bold text-gray-800 bg-transparent border-none outline-none focus:bg-black/5 px-2 py-1 rounded-md"
          />
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-white/50 px-2 py-1 rounded-full border border-gray-100 shadow-sm backdrop-blur-sm">
            {saveStatus === 'Saving...' ? (
              <>
                <Loader2 size={12} className="animate-spin text-[#ff4d79]" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={12} className="text-green-500" />
                Saved to local
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-1.5 px-3">
        <button 
          onClick={toggleRuler}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${isRulerActive ? 'bg-[#ff4d79] text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`} 
          title="Straight Line / Ruler"
        >
          <Ruler size={20} />
        </button>
        <button 
          onClick={copyStrokes}
          className="p-2 rounded-xl transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer" 
          title="Copy Frame Content"
        >
          <Copy size={20} />
        </button>
        <button 
          onClick={pasteStrokes}
          disabled={clipboardStrokes.length === 0}
          className={`p-2 rounded-xl transition-colors ${clipboardStrokes.length > 0 ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`} 
          title="Paste Content"
        >
          <ClipboardPaste size={20} />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        <button 
          onClick={undoStroke}
          className="p-2 rounded-xl transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer" 
          title="Undo"
        >
          <Undo size={20} />
        </button>
        <button 
          onClick={redoStroke}
          disabled={undoneStrokes.length === 0}
          className={`p-2 rounded-xl transition-colors ${undoneStrokes.length > 0 ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`} 
          title="Redo"
        >
          <Redo size={20} />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        <button 
          onClick={toggleFullscreen}
          className="p-2 rounded-xl transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer" 
          title="Fullscreen"
        >
          <Maximize2 size={20} />
        </button>
        <button className="p-2 rounded-xl transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer" title="More Options">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
