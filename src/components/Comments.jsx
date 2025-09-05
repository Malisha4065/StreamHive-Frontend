import React, { useEffect, useMemo, useState } from 'react';

export default function Comments({ videoId, ownerId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);

  const apiBase = (window.runtimeConfig.VITE_API_CATALOG || '').replace(/\/$/, '');
  const userId = window.runtimeConfig?.userId || (()=>{ try { return parseInt(localStorage.getItem('userId')||''); } catch { return ''; } })();
  const isLoggedIn = !!userId;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const canDelete = useMemo(() => (c) => {
    // Permission based on IDs; display uses author_name
    return isLoggedIn && (String(c.user_id) === String(userId) || String(ownerId) === String(userId));
  }, [isLoggedIn, userId, ownerId]);

  const load = async () => {
    if (!videoId) return;
    setLoading(true);
    setError('');
    try {
      const headers = {};
      if (userId) headers['X-User-ID'] = String(userId);
      const r = await fetch(`${apiBase}/videos/${videoId}/comments?page=${page}&per_page=${perPage}`, { headers });
      if (!r.ok) {
        if (r.status === 403) {
          setError('Comments are not available for this video.');
        } else {
          setError(`Failed to load comments (${r.status})`);
        }
        setComments([]);
        return;
      }
      const data = await r.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
      if (typeof data.total === 'number') setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    if (!content.trim()) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`${apiBase}/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-ID': String(userId) } : {})
        },
        body: JSON.stringify({ content: content.trim(), author_name: (window.runtimeConfig?.username || '') })
      });
      if (!r.ok) {
        const msg = r.status === 401 ? 'Please login' : (r.status === 403 ? 'Not allowed' : 'Failed to add comment');
        setError(msg);
        return;
      }
      setContent('');
      // Reload first page to show newest first
      setPage(1);
      await load(); // Immediately reload comments to show the new one
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!isLoggedIn) return;
    if (!window.confirm('Delete this comment?')) return;
    try {
      const r = await fetch(`${apiBase}/comments/${id}`, {
        method: 'DELETE',
        headers: {
          ...(userId ? { 'X-User-ID': String(userId) } : {})
        }
      });
      if (!r.ok) {
        setError('Failed to delete comment');
        return;
      }
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [videoId, page, perPage]);

  // Periodic refresh to show updates from other users
  useEffect(() => {
    if (!videoId) return;
    
    const intervalId = setInterval(() => {
      load();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [videoId, page, perPage]);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💬</span>
        <h3 className="text-lg font-semibold text-slate-200">Comments</h3>
        {total > 0 && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
            {total}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 p-4 bg-slate-800/30 rounded-lg">
          <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
          <span className="text-sm">Loading comments…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-rose-300 p-3 bg-rose-900/20 border border-rose-500/20 rounded-lg">
          <span>⚠️</span>
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <div className="space-y-4">{comments.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">💭</div>
              <div className="text-sm">No comments yet. Be the first to share your thoughts!</div>
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} className="group p-4 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-800/40 border border-white/10 hover:border-white/20 transition-all duration-200 hover:shadow-lg">
              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed mb-3">{c.content}</div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full grid place-items-center text-white font-bold text-xs">
                    {(c.author_name || `User ${c.user_id}`)[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium">{c.author_name || `User ${c.user_id}`}</span>
                  <span className="text-slate-600">•</span>
                  <span>{new Date(c.created_at).toLocaleDateString()} at {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                </div>
                {canDelete(c) && (
                  <button 
                    onClick={() => remove(c.id)} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-900/20"
                    title="Delete comment"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="mt-6 space-y-3">
        <div className="relative">
          <textarea
            className="textarea min-h-[100px] pr-12 resize-none"
            placeholder={isLoggedIn ? "✨ Share your thoughts..." : "🔐 Login to join the conversation"}
            disabled={!isLoggedIn || busy}
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={1000}
          />
          <div className="absolute bottom-2 right-2 text-xs text-slate-500">
            {content.length}/1000
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {total > 0 && (
              <div className="flex items-center gap-1">
                <span>📄</span>
                <span>Page {page} of {totalPages}</span>
                <span className="text-slate-600">•</span>
                <span>{total} comments</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              className={`btn-ghost text-sm px-3 py-1 ${!hasPrevPage || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
              disabled={!hasPrevPage || loading} 
              onClick={() => setPage(p => Math.max(1, p-1))}
            >
              ← Prev
            </button>
            <button 
              type="button" 
              className={`btn-ghost text-sm px-3 py-1 ${!hasNextPage || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
              disabled={!hasNextPage || loading} 
              onClick={() => setPage(p => p+1)}
            >
              Next →
            </button>
            <button 
              disabled={!isLoggedIn || busy || !content.trim()} 
              className={`transition-all duration-200 ${(!isLoggedIn || busy || !content.trim()) ? 'btn-muted' : 'btn-primary hover:shadow-lg'}`}
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  <span>Posting…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>💬</span>
                  <span>Post Comment</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
