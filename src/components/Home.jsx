import React, { useState } from "react";
import VideoPlayer from "./VideoPlayer.jsx";
import VideoList from "./VideoList.jsx";
import "./home.css";

export default function Home({ onNavigateUpload, onNavigateLibrary }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const isLoggedIn = !!(window.runtimeConfig && window.runtimeConfig.VITE_JWT);
  const [privateCount, setPrivateCount] = useState(null); // null=unknown, number=loaded

  return (
    <div className="home-page p-4 md:p-6 space-y-8">
      {/* Header actions */}
      <div className="flex justify-end items-center">
        <div className="flex gap-3">
          <button
            onClick={onNavigateLibrary}
            className="btn-ghost flex items-center gap-2"
          >
            <span>📚</span>
            <span>My Library</span>
          </button>
          <button
            onClick={onNavigateUpload}
            className="btn-primary flex items-center gap-2"
          >
            <span>⬆️</span>
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      {/* Main Video Player (only render when a video is selected) */}
      {selectedVideo && (
        <div className="main-video-card card">
          <VideoPlayer uploadId={selectedVideo} />
        </div>
      )}

      {/* Public Videos */}
      <div className="video-library card">
        <VideoList scope="public" onPlay={(id) => setSelectedVideo(id)} />
      </div>

      {/* Your Private Videos (visible only when logged in and there are items) */}
      {isLoggedIn && privateCount !== 0 && (
        <div className="video-library card">
          <VideoList
            scope="mine"
            filterPrivateOnly
            onPlay={(id) => setSelectedVideo(id)}
            onLoaded={(n) => setPrivateCount(n)}
          />
        </div>
      )}
    </div>
  );
}
