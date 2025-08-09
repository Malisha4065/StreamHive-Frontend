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
        maxBufferHole: 0.3, // seconds
        // Improve quality switching behavior
        abrEwmaFastLive: 3.0,
        abrEwmaSlowLive: 9.0,
        abrEwmaFastVoD: 3.0,
        abrEwmaSlowVoD: 9.0,
        abrMaxWithRealBitrate: false,
        // Allow immediate quality switches
        startLevel: -1,
        capLevelToPlayerSize: false
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
        console.log('Level switched to:', data.level, 'Resolution:', levels[data.level]);
        setCurrentLevel(data.level);
        
        // Log current video dimensions for debugging
        if (ref.current) {
          console.log('Video element size:', {
            videoWidth: ref.current.videoWidth,
            videoHeight: ref.current.videoHeight,
            elementWidth: ref.current.clientWidth,
            elementHeight: ref.current.clientHeight
          });
        }
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
      
      console.log('Quality change requested:', levelIndex, levels[levelIndex]?.name);
      
      // Force immediate quality switch
      hls.currentLevel = levelIndex;
      
      // Also update nextLevel to ensure consistency
      if (levelIndex === -1) {
        hls.nextLevel = -1; // Auto mode
      } else {
        hls.nextLevel = levelIndex;
      }
      
      // Update state immediately for UI feedback
      setCurrentLevel(levelIndex);
      
      // Log for debugging
      console.log('HLS levels after change:', {
        currentLevel: hls.currentLevel,
        nextLevel: hls.nextLevel,
        autoLevelEnabled: hls.autoLevelEnabled
      });
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
              {ref.current && (
                <span>
                  Video: {ref.current.videoWidth}x{ref.current.videoHeight}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
