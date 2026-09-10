import React, { useEffect } from 'react';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import Timeline from './Timeline';
import Topbar from './Topbar';
import { useStore } from '../store';

const Editor: React.FC = () => {
  const saveCurrentProject = useStore(state => state.saveCurrentProject);

  useEffect(() => {
    // Auto-save every 5 seconds
    const interval = setInterval(() => {
      saveCurrentProject();
    }, 5000);

    return () => clearInterval(interval);
  }, [saveCurrentProject]);

  return (
    <div className="flex flex-col h-screen bg-[#f0f3f9] text-gray-800 font-sans overflow-hidden relative">
      <Topbar />
      
      {/* Canvas Layer - taking up full space underneath UI */}
      <div className="absolute inset-0 z-0">
         <DrawingCanvas />
      </div>

      {/* Floating Toolbar on the left */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
        <Toolbar />
      </div>

      {/* Timeline at the bottom */}
      <div className="absolute bottom-0 w-full z-10 pb-4 px-4 bg-gradient-to-t from-[#f0f3f9] to-transparent pt-10 pointer-events-none">
        <Timeline />
      </div>
    </div>
  );
};

export default Editor;
