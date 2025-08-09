import React, { useState } from 'react';

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Select a file'); return; }
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('tags', tags);
      fd.append('category', category);
      fd.append('isPrivate', isPrivate);
      const r = await fetch(import.meta.env.VITE_API_UPLOAD, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + import.meta.env.VITE_JWT },
        body: fd
      });
      if (!r.ok) throw new Error('Upload failed');
      const data = await r.json();
      onUploaded(data.uploadId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 p-4 border rounded bg-gray-800">
      <h2 className="text-lg font-semibold">Upload Video</h2>
      <input type="file" accept="video/*" onChange={e=>setFile(e.target.files[0])} className="w-full" />
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full p-2 bg-gray-700 rounded" />
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="w-full p-2 bg-gray-700 rounded" />
      <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Tags comma separated" className="w-full p-2 bg-gray-700 rounded" />
      <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" className="w-full p-2 bg-gray-700 rounded" />
      <label className="flex items-center gap-2"><input type="checkbox" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} /> Private</label>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <button disabled={busy} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded">{busy? 'Uploading...' : 'Upload'}</button>
    </form>
  );
}
