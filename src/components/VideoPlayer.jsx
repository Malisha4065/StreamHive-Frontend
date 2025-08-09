import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ uploadId }) {
  const ref = useRef();
  useEffect(() => {
    if (!uploadId) return;
    const video = ref.current;
    const url = `${import.meta.env.VITE_API_PLAYBACK}/playback/videos/${uploadId}/master.m3u8`;
    let hls;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    }
    return () => { if (hls) hls.destroy(); };
  }, [uploadId]);
  if (!uploadId) return null;
  return (
    <div className="mt-4">
      <video ref={ref} controls className="w-full max-w-3xl bg-black" />
    </div>
  );
}
