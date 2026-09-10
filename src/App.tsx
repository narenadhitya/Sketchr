import React, { useEffect } from 'react';
import Home from './components/Home';
import Editor from './components/Editor';
import { useStore } from './store';

function App() {
  const currentView = useStore(state => state.currentView);
  const loadProjectsList = useStore(state => state.loadProjectsList);

  useEffect(() => {
    // Initial load of project metadata
    loadProjectsList();
  }, [loadProjectsList]);

  return (
    <>
      {currentView === 'home' && <Home />}
      {currentView === 'editor' && <Editor />}
    </>
  );
}

export default App;
