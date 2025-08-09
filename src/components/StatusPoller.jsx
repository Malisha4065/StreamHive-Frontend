import React, { useEffect, useState } from 'react';

export default function StatusPoller({ uploadId, onReady }) {
  const [status, setStatus] = useState('');

  useEffect(()=>{
    if (!uploadId) return;
    let timer;
    const poll = async () => {
      const r = await fetch(`${import.meta.env.VITE_API_CATALOG}/videos/upload/${uploadId}`);
      if (r.ok) {
        const v = await r.json();
        setStatus(v.status);
        if (v.status === 'ready' && v.hls_master_url) {
          onReady(uploadId);
          return; // stop polling
        }
      }
      timer = setTimeout(poll, 5000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [uploadId, onReady]);

  if (!uploadId) return null;
  return <div className="mt-2 text-sm text-gray-300">Transcode status: {status || 'pending...'}</div>;
}
