import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { LanguageProvider } from './language';
import Home from './pages/Home';
import Project from './pages/Project';

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <ScrollToTopOnRouteChange />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:slug" element={<Project />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </LanguageProvider>
  );
}
