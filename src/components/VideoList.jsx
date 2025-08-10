import React, { useEffect, useState } from 'react';

export default function VideoList({ onPlay }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Component initialized');
  const [deleting, setDeleting] = useState(new Set());

  console.log('VideoList component rendered, loading:', loading, 'videos count:', videos.length);

  const loadVideos = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_CATALOG}/videos?page=1`;
      setDebugInfo(`Fetching from: ${apiUrl}`);
      console.log('Fetching videos from:', apiUrl);
      const r = await fetch(apiUrl);
      console.log('Response received:', r.status, r.ok);
      setDebugInfo(`Response: ${r.status} ${r.ok ? 'OK' : 'Error'}`);
      if (r.ok) {
        const data = await r.json();
        console.log('Data received:', data);
        setVideos(data.videos || []);
        setDebugInfo(`Loaded ${data.videos?.length || 0} videos`);
      } else {
        console.error('API request failed:', r.status, r.statusText);
        setDebugInfo(`API Error: ${r.status} ${r.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setDebugInfo(`Fetch Error: ${error.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to permanently delete this video? This will remove ALL files from storage and cannot be undone!')) {
      return;
    }

    setDeleting(prev => new Set(prev.add(videoId)));
    
    try {
      const endpoint = `${import.meta.env.VITE_API_CATALOG}/videos/${videoId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove video from local state
        setVideos(prev => prev.filter(v => v.id !== videoId));
        console.log(`Video ${videoId} deleted successfully`);
      } else {
        const error = await response.json();
        console.error('Delete failed:', error);
        alert(`Failed to delete video: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(`Error deleting video: ${error.message}`);
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  if (loading) return <div>Loading videos... <br/><small>{debugInfo}</small></div>;
  if (!videos.length) return <div className="mt-4 text-sm text-gray-400">No videos found in catalog. <br/><small>Debug: {debugInfo}</small></div>;
  
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      {videos.map(v => {
        const ready = v.status === 'ready';
        const isDeleting = deleting.has(v.id);
        const hasThumbnail = v.thumbnail_url || v.thumbnailUrl; // backend might use either snake or camel
        const thumbnailEndpoint = `${import.meta.env.VITE_API_PLAYBACK}/playback/videos/${v.upload_id}/thumbnail.jpg`;
        
        return (
          <div key={v.upload_id} className="p-3 rounded bg-gray-800 flex flex-col">
            {ready && hasThumbnail && import.meta.env.VITE_API_PLAYBACK ? (
              <div className="mb-2 cursor-pointer group" onClick={() => ready && onPlay(v.upload_id)}>
                <div className="relative aspect-video w-full overflow-hidden rounded">
                  <img 
                    src={thumbnailEndpoint}
                    alt={v.title}
                    className="object-cover w-full h-full transition-opacity duration-300 opacity-100"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback: hide image if thumbnail fails to load
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs bg-gray-700 text-gray-400" style={{display: 'none'}}>
                    No thumbnail
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-2 aspect-video w-full bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                {ready ? 'No thumbnail' : 'Processing'}
              </div>
            )}
            <div className="font-semibold truncate" title={v.title}>{v.title}</div>
            <div className="text-xs text-gray-400 flex gap-2 items-center mb-2">
              <span>{v.category}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${ready ? 'bg-green-600' : 'bg-yellow-600'}`}>
                {v.status}
              </span>
            </div>
            
            <div className="mt-auto space-y-2">
              <button 
                disabled={!ready || isDeleting} 
                onClick={() => ready && onPlay(v.upload_id)} 
                className={`w-full text-sm px-3 py-1 rounded ${ready ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600 cursor-not-allowed'}`}
              >
                {ready ? 'Play' : 'Processing'}
              </button>
              
              <button 
                disabled={isDeleting}
                onClick={() => deleteVideo(v.id)} 
                className="w-full text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50"
                title="Permanently delete video and all files"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
