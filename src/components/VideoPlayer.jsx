import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ uploadId }) {
  const ref = useRef();
  const hlsRef = useRef();
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

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
        lowLatencyMode: false
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
      hlsRef.current.currentLevel = levelIndex;
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
          <div className="mt-2 flex items-center gap-2">
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
            
            {currentLevel >= 0 && currentLevel < levels.length && (
              <span className="text-sm text-gray-500">
                Current: {levels[currentLevel]?.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
