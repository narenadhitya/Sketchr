import { useEffect } from 'react';
import Home from './components/Home';
import Editor from './components/Editor';
import { ToastStack } from './components/ui';
import { useStore } from './store';

function App() {
  const currentView = useStore((s) => s.currentView);
  const initStorage = useStore((s) => s.initStorage);

  useEffect(() => {
    // Restores the workspace folder (if one was chosen) before listing projects.
    void initStorage();
  }, [initStorage]);

  return (
    <>
      {currentView === 'home' ? <Home /> : <Editor />}
      <ToastStack />
    </>
  );
}

export default App;
