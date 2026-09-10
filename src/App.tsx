import React, { useEffect } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import Toolbar from './components/Toolbar';
import Timeline from './components/Timeline';
import Topbar from './components/Topbar';
import localforage from 'localforage';
import { useStore } from './store';

function App() {
  useEffect(() => {
    localforage.getItem('sketchr-project').then((savedState: any) => {
      if (savedState && savedState.frames) {
        useStore.setState({ ...savedState, brushColor: '#000000' });
      }
    });

    const interval = setInterval(() => {
      const state = useStore.getState();
      localforage.setItem('sketchr-project', {
        frames: state.frames,
        fps: state.fps
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
}

export default App;
