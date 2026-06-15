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
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
