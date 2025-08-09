import React, { useEffect, useState } from 'react';

export default function VideoList({ onPlay }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async () => {
      try {
        const r = await fetch(`${import.meta.env.VITE_API_CATALOG}/videos?page=1`);
        if (r.ok) {
          const data = await r.json();
            setVideos(data.videos || []);
        }
      } finally { setLoading(false); }
    };
    load();
  },[]);

  if (loading) return <div>Loading videos...</div>;
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      {videos.map(v => (
        <div key={v.upload_id} className="p-3 rounded bg-gray-800 flex flex-col">
          <div className="font-semibold truncate">{v.title}</div>
          <div className="text-xs text-gray-400">{v.category}</div>
          <button onClick={()=>onPlay(v.upload_id)} className="mt-auto text-sm px-3 py-1 bg-indigo-600 rounded hover:bg-indigo-500">Play</button>
        </div>
      ))}
    </div>
  );
}
