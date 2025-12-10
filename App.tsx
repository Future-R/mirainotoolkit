import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Counter from './pages/Counter';
import AnimeNamer from './pages/AnimeNamer';
import TextMapEditor from './pages/TextMapEditor';
import Layout from './components/Layout';

const AppContent: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/counter" element={<Counter />} />
        <Route path="/anime-namer" element={<AnimeNamer />} />
        <Route path="/text-map" element={<TextMapEditor />} />
        {/* Future tools will be added here */}
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;