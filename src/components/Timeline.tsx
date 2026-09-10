import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Music, SkipBack, Play, Pause, SkipForward, Layers, Plus, Repeat } from 'lucide-react';

const Timeline: React.FC = () => {
  const frames = useStore(state => state.frames);
  const currentFrameIndex = useStore(state => state.currentFrameIndex);
  const isPlaying = useStore(state => state.isPlaying);
  const isLooping = useStore(state => state.isLooping);
  const fps = useStore(state => state.fps);

  const addFrame = useStore(state => state.addFrame);
  const setCurrentFrame = useStore(state => state.setCurrentFrame);
  const setPlaying = useStore(state => state.setPlaying);
  const setLooping = useStore(state => state.setLooping);
  const setFps = useStore(state => state.setFps);
  
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (isPlaying) {
      intervalId = setInterval(() => {
        if (currentFrameIndex >= frames.length - 1) {
          if (isLooping) {
            setCurrentFrame(0);
          } else {
            setPlaying(false);
          }
        } else {
          setCurrentFrame(currentFrameIndex + 1);
        }
      }, 1000 / fps);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, currentFrameIndex, frames.length, fps, isLooping, setCurrentFrame, setPlaying]);

  useEffect(() => {
    if (timelineRef.current) {
      const activeEl = timelineRef.current.querySelector(`[data-frame="${currentFrameIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentFrameIndex]);

  return (
    <div className="flex items-end justify-between w-full pointer-events-auto">
      {/* Left side: Music & FPS */}
      <div className="pb-3 pl-4 flex flex-col gap-2">
        <select 
          value={fps} 
          onChange={(e) => setFps(Number(e.target.value))}
          className="text-xs bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-600 outline-none w-16"
        >
          <option value={5}>5 fps</option>
          <option value={10}>10 fps</option>
          <option value={12}>12 fps</option>
          <option value={20}>20 fps</option>
          <option value={24}>24 fps</option>
          <option value={30}>30 fps</option>
          <option value={60}>60 fps</option>
        </select>
        <button className="p-3 text-gray-600 hover:bg-black/5 rounded-full cursor-pointer transition-colors w-12 h-12 flex items-center justify-center">
          <Music size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Center: Frames */}
      <div className="flex-1 max-w-3xl mx-6 overflow-hidden relative pb-1">
        <div 
          ref={timelineRef}
          className="flex items-end gap-1 overflow-x-auto no-scrollbar pt-6 pb-2"
        >
          {frames.map((frame, index) => {
            const isActive = currentFrameIndex === index;
            return (
              <div 
                key={frame.id} 
                data-frame={index}
                onClick={() => setCurrentFrame(index)}
                className={`relative flex-shrink-0 w-16 h-[4.5rem] bg-white cursor-pointer transition-colors
                  ${isActive ? 'border border-[#ff4d79] rounded-md shadow-sm z-10' : 'border border-gray-200 rounded-sm hover:border-gray-300'}
                `}
              >
                {/* Frame Number Badge */}
                <div className={`absolute top-0 right-0 px-1.5 py-0.5 text-[9px] font-bold
                  ${isActive ? 'bg-[#ff4d79] text-white rounded-bl-md rounded-tr-md' : 'text-gray-400'}
                `}>
                  {index + 1}
                </div>
              </div>
            );
          })}
          
          {/* Add Frame Button */}
          <div 
            onClick={addFrame}
            className="flex-shrink-0 w-16 h-[4.5rem] border border-dashed border-gray-300 rounded-sm flex items-center justify-center cursor-pointer hover:bg-white transition-colors ml-1"
          >
            <Plus size={20} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Right side: Playback & Layers */}
      <div className="flex items-center gap-1 pb-3 pr-4">
        <button 
          onClick={() => setLooping(!isLooping)}
          className={`p-2.5 rounded-full cursor-pointer transition-colors ${isLooping ? 'text-[#ff4d79] bg-[#ff4d79]/10' : 'text-gray-600 hover:bg-black/5'}`}
          title="Loop Playback"
        >
          <Repeat size={18} strokeWidth={2} />
        </button>
        <button 
          onClick={() => setCurrentFrame(0)}
          className="p-2.5 text-gray-600 hover:bg-black/5 rounded-full cursor-pointer transition-colors"
        >
          <SkipBack size={20} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => setPlaying(!isPlaying)}
          className="p-2.5 text-gray-600 hover:bg-black/5 rounded-full cursor-pointer transition-colors"
        >
          {isPlaying ? <Pause size={20} strokeWidth={1.5} /> : <Play size={20} strokeWidth={1.5} />}
        </button>
        <button 
          onClick={() => setCurrentFrame(frames.length - 1)}
          className="p-2.5 text-gray-600 hover:bg-black/5 rounded-full cursor-pointer transition-colors"
        >
          <SkipForward size={20} strokeWidth={1.5} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        <button className="p-2.5 text-gray-600 hover:bg-black/5 rounded-full relative cursor-pointer transition-colors">
          <Layers size={22} strokeWidth={1.5} />
          <div className="absolute top-1 right-0 bg-[#ff4d79] text-white text-[9px] font-bold px-1 rounded-full shadow-sm">
            3
          </div>
        </button>
      </div>
    </div>
  );
};

export default Timeline;
