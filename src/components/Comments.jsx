import React, { useEffect, useMemo, useState } from 'react';

export default function Comments({ videoId, ownerId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const apiBase = (window.runtimeConfig.VITE_API_CATALOG || '').replace(/\/$/, '');
  const userId = window.runtimeConfig?.userId || (()=>{ try { return parseInt(localStorage.getItem('userId')||''); } catch { return ''; } })();
  const isLoggedIn = !!userId;

  const canDelete = useMemo(() => (c) => {
    return isLoggedIn && (String(c.user_id) === String(userId) || String(ownerId) === String(userId));
  }, [isLoggedIn, userId, ownerId]);

  const load = async () => {
    if (!videoId) return;
    setLoading(true);
    setError('');
    try {
      const headers = {};
      if (userId) headers['X-User-ID'] = String(userId);
      const r = await fetch(`${apiBase}/videos/${videoId}/comments`, { headers });
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
        body: JSON.stringify({ content: content.trim() })
      });
      if (!r.ok) {
        const msg = r.status === 401 ? 'Please login' : (r.status === 403 ? 'Not allowed' : 'Failed to add comment');
        setError(msg);
        return;
      }
      setContent('');
      await load();
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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [videoId]);

  return (
    <div className="mt-4">
      <div className="text-slate-200 font-semibold mb-2">Comments</div>
      {loading ? (
        <div className="text-sm text-slate-400">Loading comments…</div>
      ) : error ? (
        <div className="text-sm text-rose-300">{error}</div>
      ) : (
        <div className="space-y-3">
          {comments.length === 0 && (
            <div className="text-sm text-slate-400">No comments yet.</div>
          )}
          {comments.map(c => (
            <div key={c.id} className="p-3 rounded-lg bg-slate-800/60 border border-white/10">
              <div className="text-sm text-slate-200 whitespace-pre-wrap">{c.content}</div>
              <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                <span>By User {c.user_id}</span>
                <span>•</span>
                <span>{new Date(c.created_at).toLocaleString()}</span>
                {canDelete(c) && (
                  <button onClick={() => remove(c.id)} className="ml-auto text-rose-300 hover:text-rose-200">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="mt-3">
        <textarea
          className="textarea"
          placeholder={isLoggedIn ? "Write a comment..." : "Login to comment"}
          disabled={!isLoggedIn || busy}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button disabled={!isLoggedIn || busy || !content.trim()} className={(!isLoggedIn || busy || !content.trim()) ? 'btn-muted' : 'btn-primary'}>
            {busy ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
