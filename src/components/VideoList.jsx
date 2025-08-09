import React, { useEffect, useState } from 'react';

export default function VideoList({ onPlay }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Component initialized');

  console.log('VideoList component rendered, loading:', loading, 'videos count:', videos.length);

  useEffect(()=>{
    const load = async () => {
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
    load();
  },[]);

  if (loading) return <div>Loading videos... <br/><small>{debugInfo}</small></div>;
  if (!videos.length) return <div className="mt-4 text-sm text-gray-400">No videos found in catalog. <br/><small>Debug: {debugInfo}</small></div>;
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      {videos.map(v => {
        const ready = v.status === 'ready';
        return (
          <div key={v.upload_id} className="p-3 rounded bg-gray-800 flex flex-col">
            <div className="font-semibold truncate" title={v.title}>{v.title}</div>
            <div className="text-xs text-gray-400 flex gap-2 items-center">
              <span>{v.category}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${ready ? 'bg-green-600' : 'bg-yellow-600'}`}>{v.status}</span>
            </div>
            <button disabled={!ready} onClick={()=>ready && onPlay(v.upload_id)} className={`mt-auto text-sm px-3 py-1 rounded ${ready ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600 cursor-not-allowed'}`}>{ready ? 'Play' : 'Processing'}</button>
          </div>
        );
      })}
    </div>
  );
}
