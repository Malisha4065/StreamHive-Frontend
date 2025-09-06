import React, { useState } from 'react';

const ALLOWED_CATEGORIES = [
  'entertainment',
  'education',
  'music',
  'sports',
  'gaming',
  'news',
  'technology',
  'other',
];

export default function UploadForm({ onUploaded, jwt }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('entertainment');
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Select a file'); return; }
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('tags', tags);
      fd.append('category', category || 'other');
      fd.append('isPrivate', isPrivate);
      // Provide user identity so backend can store proper owner name
      const runtime = window.runtimeConfig || {};
      const displayName = runtime.username || (typeof localStorage !== 'undefined' ? (localStorage.getItem('username') || '') : '');
      const userIdStr = runtime.userId != null ? String(runtime.userId) : (typeof localStorage !== 'undefined' ? (localStorage.getItem('userId') || '') : '');
      if (displayName) {
        fd.append('owner_name', displayName);
        fd.append('username', displayName);
        fd.append('author_name', displayName);
      }
      if (userIdStr) {
        fd.append('user_id', userIdStr);
      }
      const headers = { Authorization: 'Bearer ' + jwt };
      if (userIdStr) headers['X-User-ID'] = userIdStr;
      if (displayName) headers['X-User-Name'] = displayName;

      const r = await fetch(window.runtimeConfig.VITE_API_UPLOAD, {
        method: 'POST',
        headers,
        body: fd
      });
      if (!r.ok) throw new Error('Upload failed');
      const data = await r.json();
      onUploaded(data.uploadId);
      setSuccess('Video uploaded successfully! Processing will begin shortly.');
      // reset fields (optional)
      setTitle(''); setDescription(''); setTags(''); setCategory('entertainment'); setIsPrivate(false); setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🎬</div>
        <h2 className="text-xl font-bold text-slate-200">Upload Your Video</h2>
        <p className="text-sm text-slate-400 mt-1">Share your content with the world</p>
      </div>

      <div className="space-y-1">
        <label className="block">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <span>📁</span>
            <span className="font-medium">Video file</span>
            <span className="text-xs text-slate-500">(Max 100MB)</span>
          </div>
          <div className="relative">
            <input 
              type="file" 
              accept="video/*" 
              onChange={e=>setFile(e.target.files[0])}
              className="file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-indigo-600 file:to-purple-600 file:text-white file:px-4 file:py-2 file:hover:from-indigo-500 file:hover:to-purple-500 file:transition-all file:duration-200
                         text-slate-300 bg-slate-800/60 border border-white/10 rounded-xl w-full p-3 hover:border-white/20 transition-colors" 
            />
            {file && (
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <span>✅</span>
                <span>Selected: {file.name}</span>
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <span>🏷️</span>
            <span className="font-medium">Title</span>
            <span className="text-red-400">*</span>
          </div>
          <input 
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
            placeholder="Enter video title" 
            className="input hover:border-white/20 focus:border-indigo-400 transition-colors" 
            required
          />
        </label>
        <label className="block">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <span>📂</span>
            <span className="font-medium">Category</span>
          </div>
          <select
            value={category}
            onChange={(e)=>setCategory(e.target.value)}
            className="input hover:border-white/20 focus:border-indigo-400 transition-colors"
          >
            {ALLOWED_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
          <span>📝</span>
          <span className="font-medium">Description</span>
          <span className="text-xs text-slate-500">(Optional)</span>
        </div>
        <textarea 
          value={description} 
          onChange={e=>setDescription(e.target.value)} 
          placeholder="Describe your video content..." 
          className="textarea hover:border-white/20 focus:border-indigo-400 transition-colors min-h-[100px] resize-none" 
          maxLength={500}
        />
        <div className="text-xs text-slate-500 mt-1 text-right">
          {description.length}/500
        </div>
      </label>

      <label className="block">
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
          <span>🏷️</span>
          <span className="font-medium">Tags</span>
          <span className="text-xs text-slate-500">(Optional)</span>
        </div>
        <input 
          value={tags} 
          onChange={e=>setTags(e.target.value)} 
          placeholder="fun, tutorial, gaming, music..." 
          className="input hover:border-white/20 focus:border-indigo-400 transition-colors" 
        />
        <div className="text-xs text-slate-500 mt-1">Separate tags with commas</div>
      </label>

      <div className="flex items-center justify-center p-4 border border-white/10 rounded-xl bg-slate-800/30">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2" 
            checked={isPrivate} 
            onChange={e=>setIsPrivate(e.target.checked)} 
          />
          <div className="flex items-center gap-2">
            <div>
              <div className="text-slate-300 font-medium">
                Private Video
              </div>
              <div className="text-xs text-slate-500">
                Only you can see this video
              </div>
            </div>
          </div>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-300 p-3 bg-rose-900/20 border border-rose-500/20 rounded-lg">
          <span>⚠️</span>
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 text-green-300 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
          <span>✅</span>
          <span className="text-sm">{success}</span>
        </div>
      )}

      <button 
        disabled={busy} 
        className={`w-full transition-all duration-200 ${busy ? 'btn-muted' : 'btn-primary hover:shadow-lg hover:scale-[1.02]'}`}
      >
        {busy ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
            <span>Uploading…</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>🚀</span>
            <span>Upload Video</span>
          </div>
        )}
      </button>
    </form>
  );
}
