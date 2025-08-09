import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ uploadId }) {
  const ref = useRef();
  const hlsRef = useRef();
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [bufferInfo, setBufferInfo] = useState({ buffered: 0, target: 0 });

  useEffect(() => {
    if (!uploadId) return;
    
    const video = ref.current;
    const url = `${import.meta.env.VITE_API_PLAYBACK}/playback/videos/${uploadId}/master.m3u8`;
    
    setIsLoading(true);
    
    let hls;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      setIsLoading(false);
    } else if (Hls.isSupported()) {
      // Use HLS.js for other browsers
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Reduce buffer sizes for faster quality switching
        maxBufferLength: 10, // seconds
        maxMaxBufferLength: 20, // seconds
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.3 // seconds
      });
      
      hlsRef.current = hls;
      
      hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
        console.log('HLS manifest loaded:', data);
        const availableLevels = data.levels.map((level, index) => ({
          index,
          width: level.width,
          height: level.height,
          bitrate: level.bitrate,
          name: `${level.height}p`
        }));
        setLevels(availableLevels);
        setCurrentLevel(hls.currentLevel);
        setIsLoading(false);
      });
      
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log('Level switched to:', data.level);
        setCurrentLevel(data.level);
      });
      
      // Track buffer info for debugging
      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        if (ref.current) {
          const video = ref.current;
          const buffered = video.buffered.length > 0 ? 
            video.buffered.end(video.buffered.length - 1) - video.currentTime : 0;
          setBufferInfo(prev => ({ ...prev, buffered }));
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        setIsLoading(false);
      });
      
      hls.loadSource(url);
      hls.attachMedia(video);
    }
    
    return () => { 
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      setLevels([]);
      setCurrentLevel(-1);
    };
  }, [uploadId]);

  const handleQualityChange = (levelIndex) => {
    if (hlsRef.current) {
      const hls = hlsRef.current;
      
      // Set the new quality level
      hls.currentLevel = levelIndex;
      
      // For immediate quality change, we can clear the buffer
      // This causes a brief pause but ensures immediate switch
      if (levelIndex !== -1 && ref.current) {
        const currentTime = ref.current.currentTime;
        // Clear future buffer to force immediate quality change
        hls.trigger(Hls.Events.BUFFER_FLUSHING, {
          startOffset: currentTime + 0.1, // Keep current segment
          endOffset: Number.POSITIVE_INFINITY,
          type: 'video'
        });
      }
      
      setCurrentLevel(levelIndex);
    }
  };

  const handleForceQualityChange = (levelIndex) => {
    if (hlsRef.current && ref.current) {
      const hls = hlsRef.current;
      const currentTime = ref.current.currentTime;
      
      // More aggressive: clear all buffer for immediate switch
      hls.trigger(Hls.Events.BUFFER_FLUSHING, {
        startOffset: currentTime,
        endOffset: Number.POSITIVE_INFINITY,
        type: 'video'
      });
      
      hls.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
  };

  if (!uploadId) return null;

  return (
    <div className="mt-4">
      <div className="relative">
        <video 
          ref={ref} 
          controls 
          className="w-full max-w-3xl bg-black" 
          poster={isLoading ? undefined : undefined}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white">Loading video...</div>
          </div>
        )}
        
        {/* Quality Selector */}
        {levels.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Quality:</span>
              <select 
                value={currentLevel} 
                onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                className="px-2 py-1 text-sm border rounded bg-white"
              >
                <option value={-1}>Auto</option>
                {levels.map((level) => (
                  <option key={level.index} value={level.index}>
                    {level.name} ({Math.round(level.bitrate / 1000)}kbps)
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => handleForceQualityChange(currentLevel)}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                title="Force immediate quality switch (clears buffer)"
              >
                Force Switch
              </button>
            </div>
            
            {/* Buffer and Quality Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {currentLevel >= 0 && currentLevel < levels.length && (
                <span>
                  Playing: {levels[currentLevel]?.name}
                </span>
              )}
              <span>
                Buffer: {bufferInfo.buffered.toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
