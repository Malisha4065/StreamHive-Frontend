
import React, { useState } from 'react';
import UploadForm from './components/UploadForm.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import VideoList from './components/VideoList.jsx';
import StatusPoller from './components/StatusPoller.jsx';
import Login from './components/Login.jsx';
import './components/login.css';

export default function App() {
  const [currentUploadId, setCurrentUploadId] = useState('');
  const [playbackId, setPlaybackId] = useState('');
  const [jwt, setJwt] = useState(window.runtimeConfig?.VITE_JWT || '');

  const handleLogin = (token) => {
    setJwt(token);
    window.runtimeConfig.VITE_JWT = token;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">StreamHive</h1>
      {!jwt ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <UploadForm onUploaded={setCurrentUploadId} />
            <StatusPoller uploadId={currentUploadId} onReady={setPlaybackId} />
          </div>
          <div>
            <VideoPlayer uploadId={playbackId} />
          </div>
        </div>
      )}
      <VideoList onPlay={setPlaybackId} />
    </div>
  );
}
