import React, { useEffect, useState } from 'react';

export default function VideoList({ onPlay, scope = 'public', filterPrivateOnly = false, onLoaded }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Component initialized');
  const [deleting, setDeleting] = useState(new Set());

  const loadVideos = async () => {
    try {
  const userId = window.runtimeConfig?.userId || (()=>{ try { return parseInt(localStorage.getItem('userId')||''); } catch { return ''; } })();
  const useMine = scope === 'mine' && userId;
  const endpoint = useMine ? `${window.runtimeConfig.VITE_API_CATALOG}/users/${userId}/videos?page=1` : `${window.runtimeConfig.VITE_API_CATALOG}/videos?page=1`;
      setDebugInfo(`Fetching from: ${endpoint} (userId=${userId||'anon'})`);
      const headers = {};
  if (useMine) headers['X-User-ID'] = String(userId);
      const r = await fetch(endpoint, { headers });
      setDebugInfo(`Response: ${r.status} ${r.ok ? 'OK' : 'Error'}`);
      if (r.ok) {
        const data = await r.json();
        const list = Array.isArray(data.videos) ? data.videos : [];
        const filtered = filterPrivateOnly ? list.filter(v => v.is_private === true) : list;
        setVideos(filtered);
        if (typeof onLoaded === 'function') onLoaded(filtered.length);
        setDebugInfo(`Loaded ${data.videos?.length || 0} videos`);
      } else {
        setDebugInfo(`API Error: ${r.status}`);
        if (typeof onLoaded === 'function') onLoaded(0);
      }
    } catch (error) {
      setDebugInfo(`Fetch Error: ${error.message}`);
      if (typeof onLoaded === 'function') onLoaded(0);
    } finally { 
      setLoading(false); 
    }
  };

  // Helpers
  const getUserId = () => {
    try {
      const rid = window.runtimeConfig?.userId;
      if (rid != null && rid !== '') return String(rid);
      const stored = localStorage.getItem('userId');
      if (stored != null && stored !== '') return String(parseInt(stored));
    } catch {}
    return null;
  };

  // Format an owner display name: prefer provided name; prettify emails; fallback to User {id}
  const prettifyName = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const s = String(raw).trim();
    // If looks like an email, take the local part
    const atIdx = s.indexOf('@');
    const base = atIdx > 0 ? s.slice(0, atIdx) : s;
    // Replace separators with spaces and title-case
    const words = base.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
    const titled = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return titled || s;
  };

  const getOwnerName = (video) => {
    const raw = video.owner_name || video.username || video.owner || null;
    const pretty = prettifyName(raw);
    if (pretty) return { display: pretty, tooltip: raw };
    if (video.user_id != null) return { display: `User ${video.user_id}`, tooltip: `User ${video.user_id}` };
    return { display: 'Unknown', tooltip: 'Unknown owner' };
  };

  // Check if current user owns the video
  const canDeleteVideo = (video) => {
    const uid = getUserId();
    return !!uid && String(video.user_id) === String(uid);
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Delete this video permanently?')) return;
    setDeleting(prev => new Set(prev.add(videoId)));
    try {
  const endpoint = `${window.runtimeConfig.VITE_API_CATALOG}/videos/${videoId}`;
  const headers = { 'Content-Type': 'application/json' };
  const uid = getUserId();
  if (uid) headers['X-User-ID'] = String(uid);
  const jwt = window.runtimeConfig?.VITE_JWT;
  if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
  const response = await fetch(endpoint, { method: 'DELETE', headers });
      if (response.ok) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error deleting: ${error.message}`);
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(videoId); return s; });
    }
  };

  useEffect(() => { loadVideos(); }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-slate-400">
          <div className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full"></div>
          <span className="text-sm">Loading videos…</span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-800/60 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="rounded-lg bg-slate-700/50 aspect-video mb-3" />
              <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!videos.length) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">
          {scope === 'mine' ? '📚' : '🎬'}
        </div>
        <div className="text-slate-400 mb-2">
          {scope === 'mine' ? 'No videos in your library yet.' : 'No videos found.'}
        </div>
        <div className="text-xs text-slate-500">
          Debug: {debugInfo}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">
          {scope === 'mine' ? (filterPrivateOnly ? '🔒' : '📚') : '🎬'}
        </span>
        <h3 className="text-lg font-semibold text-slate-200">
          {scope === 'mine' ? (filterPrivateOnly ? 'Private Videos' : 'Your Library') : 'All Videos'}
        </h3>
        {videos.length > 0 && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
            {videos.length}
          </span>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {videos.map(v => {
          const ready = v.status === 'ready';
          const isDeleting = deleting.has(v.id);
          const canDelete = canDeleteVideo(v);
          const thumbnailEndpoint = `${window.runtimeConfig.VITE_API_PLAYBACK}/playback/videos/${v.upload_id}/thumbnail.jpg`;

          return (
            <div
              key={v.upload_id}
              className="group bg-gradient-to-br from-slate-800/60 to-slate-800/40 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div
                className={`mb-3 relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900/70 grid place-items-center text-xs text-slate-400 cursor-pointer`}
                onClick={() => ready && onPlay(v.upload_id)}
                title={ready ? 'Play video' : 'Video is still processing'}
              >
                {ready && window.runtimeConfig.VITE_API_PLAYBACK ? (
                  <>
                    <img
                      src={thumbnailEndpoint}
                      alt={v.title}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <span className="text-xl text-slate-800">▶️</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {ready ? '🎬' : '⏳'}
                    </div>
                    <div>{ready ? 'No thumbnail' : 'Processing…'}</div>
                  </div>
                )}
                
                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    ready ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {ready ? '✓ Ready' : '⏳ Processing'}
                  </span>
                </div>
                
                {/* Privacy indicator */}
                {v.is_private && (
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-700/80 text-slate-300 border border-slate-600">
                      🔒 Private
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200 line-clamp-2 leading-tight" title={v.title}>
                  {v.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>📂</span>
                    <span className="capitalize">{v.category || 'Uncategorized'}</span>
                  </span>
                  {(() => { const owner = getOwnerName(v); return (
                    <span className="flex items-center gap-1 min-w-0" title={owner.tooltip || owner.display}>
                      <span>👤</span>
                      <span className="truncate max-w-[10rem]">{owner.display}</span>
                    </span>
                  ); })()}
                  {canDelete && (
                    <span className="flex items-center gap-1 text-indigo-400">
                      <span>👤</span>
                      <span>Your video</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button 
                  disabled={!ready || isDeleting} 
                  onClick={() => ready && onPlay(v.upload_id)} 
                  className={`flex-1 transition-all duration-200 ${
                    !ready || isDeleting 
                      ? 'btn-muted cursor-not-allowed' 
                      : 'btn-primary hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{ready ? 'Play' : 'Processing'}</span>
                  </div>
                </button>
                {canDelete && (
                  <button 
                    disabled={isDeleting}
                    onClick={() => deleteVideo(v.id)} 
                    className={`px-3 transition-all duration-200 ${
                      isDeleting 
                        ? 'btn-muted cursor-not-allowed' 
                        : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-400/50 rounded-lg'
                    }`}
                    title="Delete video"
                  >
                    {isDeleting ? '⏳' : '🗑️'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-500">Debug: {debugInfo}</div>
    </div>
  );
}
