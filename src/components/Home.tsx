import React, { useEffect } from 'react';
import { useStore } from '../store';
import { Menu, Search, MoreHorizontal, Home as HomeIcon, Plus, Rocket } from 'lucide-react';

const Home: React.FC = () => {
  const projects = useStore(state => state.projects);
  const loadProjectsList = useStore(state => state.loadProjectsList);
  const createProject = useStore(state => state.createProject);
  const loadProject = useStore(state => state.loadProject);

  useEffect(() => {
    loadProjectsList();
  }, [loadProjectsList]);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      {/* Top Bar */}
      <header className="flex justify-between items-center px-4 py-4">
        <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
          <Menu size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold font-serif tracking-wider">Sketchr</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
          <Search size={24} className="text-gray-600" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex justify-between items-center px-6 border-b border-gray-100">
        <div className="flex gap-6">
          <button className="py-3 text-sm font-bold border-b-2 border-[#ff4d79] text-gray-800">
            Projects
          </button>
          <button className="py-3 text-sm font-bold text-gray-400 hover:text-gray-600 cursor-pointer">
            Movies
          </button>
        </div>
        <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-[#f9fafb]">
        {/* RECENT Section */}
        <div className="p-6">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Recent</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {projects.slice(0, 4).map(proj => (
              <div 
                key={proj.id} 
                onClick={() => loadProject(proj.id)}
                className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <div className="w-56 h-40 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden flex items-center justify-center hover:shadow-md transition-shadow">
                  {/* Thumbnail Placeholder */}
                  <div className="text-gray-300 font-medium">No Preview</div>
                  
                  {/* Badge */}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <div className="bg-white/90 backdrop-blur text-[9px] font-bold px-2 py-1 rounded-full text-gray-700 shadow-sm">
                      00:00
                    </div>
                    <div className="bg-gray-800/80 backdrop-blur text-[9px] font-bold px-2 py-1 rounded-full text-white shadow-sm">
                      {proj.fps} fps
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-700">{proj.name}</span>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-sm text-gray-400 italic">No projects yet. Create one!</div>
            )}
          </div>
        </div>

        {/* ALL Section */}
        <div className="px-6 pb-24">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">All</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {projects.map(proj => (
              <div 
                key={proj.id} 
                onClick={() => loadProject(proj.id)}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="w-full aspect-[4/3] bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden flex items-center justify-center hover:shadow-md transition-shadow">
                   <div className="text-gray-300 font-medium text-sm">No Preview</div>
                </div>
                <span className="text-xs font-bold text-gray-700">{proj.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="h-16 bg-white border-t border-gray-100 flex items-center justify-around px-8 relative z-20">
        <button className="flex flex-col items-center gap-1 text-[#ff4d79] cursor-pointer">
          <HomeIcon size={22} strokeWidth={2} />
          <span className="text-[9px] font-bold">HOME</span>
        </button>
        
        {/* Floating FAB */}
        <button 
          onClick={createProject}
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-[#ff4d79] rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-200 cursor-pointer hover:scale-105 transition-transform"
        >
          <Plus size={32} />
        </button>

        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 cursor-pointer">
          <Rocket size={22} strokeWidth={2} />
          <span className="text-[9px] font-bold text-gray-800">DISCOVER</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;
