import React, { useState } from "react";
import VideoPlayer from "./VideoPlayer.jsx";
import VideoList from "./VideoList.jsx";
import "./home.css";

export default function Home({ onNavigateUpload, onNavigateLibrary }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const isLoggedIn = !!(window.runtimeConfig && window.runtimeConfig.VITE_JWT);
  const [privateCount, setPrivateCount] = useState(null); // null=unknown, number=loaded

  return (
    <div className="home-page p-4 md:p-6">
      {/* Header actions */}
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-3">
          <button
            onClick={onNavigateLibrary}
            className="btn-ghost"
          >
            My Library
          </button>
          <button
            onClick={onNavigateUpload}
            className="btn-primary"
          >
            ⬆ Upload Video
          </button>
        </div>
      </div>

      {/* Main Video Player (only render when a video is selected) */}
      {selectedVideo && (
        <div className="main-video-card card mb-6">
          <VideoPlayer uploadId={selectedVideo} />
        </div>
      )}

      {/* Public Videos */}
      <div className="video-library card">
        <VideoList scope="public" onPlay={(id) => setSelectedVideo(id)} />
      </div>

      {/* Your Private Videos (visible only when logged in and there are items) */}
      {isLoggedIn && privateCount !== 0 && (
        <div className="video-library card mt-6">
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
