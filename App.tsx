import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import LibraryApp from './user-library/LibraryApp';
import PortalApp from './admin-portal/PortalApp';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Admin Portal System - Separate Deployment Logic */}
        <Route path="/admin/*" element={<PortalApp session={session} />} />
        
        {/* User Library System - Separate Deployment Logic */}
        <Route path="/*" element={<LibraryApp />} />
      </Routes>
    </HashRouter>
  );
};

export default App;