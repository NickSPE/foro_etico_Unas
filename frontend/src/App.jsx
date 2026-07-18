import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import Home from './pages/Home';
import CategoryPage from './pages/Category';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Auditoria from './pages/Auditoria';
import { isSupabaseConfigured } from './supabaseClient';

function ConfigErrorScreen() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />
      
      <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0Z"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Configuración Pendiente</h1>
            <p className="text-slate-400 text-sm">Falta enlazar la base de datos Supabase en Vercel</p>
          </div>
        </div>

        <p className="text-slate-300 mb-6 leading-relaxed">
          Tu aplicación frontend se ha desplegado correctamente en Vercel, pero el cliente de base de datos no puede inicializarse porque no se encuentran las variables de entorno de Supabase.
        </p>

        <div className="space-y-4 bg-slate-950/50 rounded-xl p-5 border border-slate-800/80 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">¿Cómo solucionarlo en Vercel?</h2>
          
          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-3 leading-relaxed">
            <li>
              Abre el <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium">Panel de Proyectos de Vercel <span className="text-[10px]">↗</span></a> y selecciona tu proyecto <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-xs font-mono">foro-etico-unas-nlha</code>.
            </li>
            <li>
              Ve a la pestaña <span className="font-semibold text-white">Settings</span> (Configuración) en el menú superior, y luego a <span className="font-semibold text-white">Environment Variables</span>.
            </li>
            <li>
              Agrega las siguientes variables copiándolas de tu archivo local <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-xs font-mono">.env</code>:
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 font-mono text-xs">
                <div className="bg-slate-900 border border-slate-800 p-2 rounded flex flex-col">
                  <span className="text-emerald-400 font-semibold">Key:</span>
                  <span className="text-white select-all">VITE_SUPABASE_URL</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2 rounded flex flex-col">
                  <span className="text-emerald-400 font-semibold">Key:</span>
                  <span className="text-white select-all">VITE_SUPABASE_ANON_KEY</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2 rounded flex flex-col md:col-span-2">
                  <span className="text-amber-400 font-semibold">Key (Opcional para IA):</span>
                  <span className="text-white select-all">VITE_GEMINI_API_KEY</span>
                </div>
              </div>
            </li>
            <li>
              Una vez guardadas, ve a la pestaña de <span className="font-semibold text-white">Deployments</span> (Despliegues), haz clic en el botón de los tres puntos <span className="font-bold text-white">···</span> al lado del último despliegue y selecciona <span className="text-emerald-400 font-medium">Redeploy</span>.
            </li>
          </ol>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-800/60 pt-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span>Nota: Los archivos locales <code className="bg-slate-800 px-1 py-0.2 rounded text-slate-400 font-mono">.env</code> no se suben al repositorio remoto por razones de seguridad.</span>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  
  // Hide the left sidebar on full-screen authentication routes
  const isAuthRoute = ['/login', '/registro'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      {/* Topbar navigation */}
      <Navbar />
      
      {/* Primary layout grid */}
      <div className="max-w-[1400px] w-full mx-auto px-4 flex gap-4 flex-1">
        {!isAuthRoute && <LeftSidebar />}
        
        {/* Main Content Pane */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categoria/:categorySlug" element={<CategoryPage />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/crear-post" element={<CreatePost />} />
            <Route path="/user/:username" element={<Profile />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/search" element={<Search />} />
            <Route path="/auditoria" element={<Auditoria />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

