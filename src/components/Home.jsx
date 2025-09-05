import React, { useState } from "react";
import VideoPlayer from "./VideoPlayer.jsx";
import VideoList from "./VideoList.jsx";
import "./home.css";

export default function Home({ onNavigateUpload }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const isLoggedIn = !!(window.runtimeConfig && window.runtimeConfig.VITE_JWT);

  return (
    <div className="home-page p-4 md:p-6">
      {/* Header with Upload button on right */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">All Videos</h2>
        <button
          onClick={onNavigateUpload}
          className="ml-56 bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-700 transition"
        >
          ⬆ Upload Video
        </button>
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

      {/* Your Private Videos (visible only when logged in) */}
      {isLoggedIn && (
        <div className="video-library card mt-6">
          <VideoList scope="mine" filterPrivateOnly onPlay={(id) => setSelectedVideo(id)} />
        </div>
      )}
    </div>
  );
}
