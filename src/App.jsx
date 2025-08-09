import React, { useState } from 'react';
import UploadForm from './components/UploadForm.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import VideoList from './components/VideoList.jsx';
import StatusPoller from './components/StatusPoller.jsx';

export default function App() {
  const [currentUploadId, setCurrentUploadId] = useState('');
  const [playbackId, setPlaybackId] = useState('');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">StreamHive</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <UploadForm onUploaded={setCurrentUploadId} />
          <StatusPoller uploadId={currentUploadId} onReady={setPlaybackId} />
        </div>
        <div>
          <VideoPlayer uploadId={playbackId} />
        </div>
      </div>
      <VideoList onPlay={setPlaybackId} />
    </div>
  );
}
