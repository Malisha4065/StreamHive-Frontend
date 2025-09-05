import React, { useEffect, useState } from 'react';
import UploadForm from './components/UploadForm.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import VideoList from './components/VideoList.jsx';
import StatusPoller from './components/StatusPoller.jsx';
import Login from './components/Login.jsx';
import Footer from './components/Footer.jsx';
import Home from './components/Home.jsx';
import './components/login.css'; // Optional if using custom CSS

export default function App() {
  const [currentUploadId, setCurrentUploadId] = useState('');
  const [playbackId, setPlaybackId] = useState('');
  const [jwt, setJwt] = useState('');
  const [page, setPage] = useState('home'); // 'home' | 'upload' | 'library'
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Load persisted auth on mount
  useEffect(()=>{
    try {
      const savedToken = localStorage.getItem('jwt');
      const savedName = localStorage.getItem('username');
      const savedUserId = localStorage.getItem('userId');
      if (savedToken) {
        setJwt(savedToken);
        window.runtimeConfig = window.runtimeConfig || {};
        window.runtimeConfig.VITE_JWT = savedToken;
      }
      if (savedName) {
        window.runtimeConfig = window.runtimeConfig || {};
        window.runtimeConfig.username = savedName;
      }
      if (savedUserId) {
        window.runtimeConfig = window.runtimeConfig || {};
        window.runtimeConfig.userId = parseInt(savedUserId);
      }
    } catch {}
  }, []);
  
  const handleLogin = (token) => {
    setJwt(token);
    window.runtimeConfig.VITE_JWT = token;
  };

  return (
    <div className="app-wrap">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          {/* Left - Logo + App Name */}
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setPage('home')}
            aria-label="Go to Home"
          >
            <div className="h-10 w-10 rounded-2xl bg-white/10 grid place-items-center border border-white/10 shadow">
              <span className="text-lg">🎬</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="title-gradient">StreamHive</span>
            </h1>
          </button>

          {/* Right - User Profile + Logout */}
          {jwt && (
            <div className="relative">
              <button
                aria-label="Profile menu"
                className="h-10 w-10 rounded-full bg-indigo-600 grid place-items-center text-white font-bold select-none"
                onClick={() => setShowProfileMenu(v=>!v)}
              >
                {window.runtimeConfig?.username?.[0]?.toUpperCase() || "U"}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-slate-900/95 shadow-xl backdrop-blur p-2 z-50">
                  <div className="px-3 py-2 text-sm text-slate-300">
                    Signed in as
                    <div className="font-semibold text-slate-100 truncate">
                      {window.runtimeConfig?.username || 'User'}
                    </div>
                  </div>
                  <div className="hr-glow my-2" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-lg text-rose-300"
                    onClick={() => {
                      try {
                        localStorage.removeItem('jwt');
                        localStorage.removeItem('username');
                        localStorage.removeItem('userId');
                      } catch {}
                      setJwt("");
                      window.runtimeConfig = window.runtimeConfig || {};
                      window.runtimeConfig.VITE_JWT = "";
                      window.runtimeConfig.username = "";
                      window.runtimeConfig.userId = undefined;
                      setShowProfileMenu(false);
                      setPage('home'); // Reset to home page
                      setCurrentUploadId(''); // Clear any upload state
                      setPlaybackId(''); // Clear any playback state
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="hr-glow mt-4" />
      </header>

      {/* Body */}
      <main className="space-y-6">
        {!jwt ? (
          <div className="grid place-items-center min-h-[60vh]">
            <div className="card max-w-md w-full">
              <Login onLogin={handleLogin} />
            </div>
          </div>
        ) : page === 'home' ? (
          <Home
            onNavigateUpload={() => setPage('upload')}
            onNavigateLibrary={() => setPage('library')}
          />
        ) : page === 'upload' ? (
          <div className="grid place-items-center">
            <div className="card max-w-2xl w-full">
              <UploadForm onUploaded={setCurrentUploadId} jwt={jwt} />
              <StatusPoller uploadId={currentUploadId} onReady={setPlaybackId} />
            </div>
          </div>
        ) : (
          // Library page
          <>
            {playbackId && (
              <div className="card">
                <VideoPlayer uploadId={playbackId} />
              </div>
            )}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">My Library</h2>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => setPage('home')}>Home</button>
                  <button className="btn-primary" onClick={() => setPage('upload')}>Upload</button>
                </div>
              </div>
              <VideoList scope="mine" onPlay={setPlaybackId} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

