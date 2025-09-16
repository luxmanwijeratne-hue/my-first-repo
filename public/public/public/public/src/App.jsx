import React, { useState, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export default function App() {
  const [files, setFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const ffmpegRef = useRef(null);

  function handleFiles(selectedFiles) {
    const arr = Array.from(selectedFiles).map((f, i) => ({
      id: Math.random().toString(36).slice(2, 9) + i,
      file: f,
      url: URL.createObjectURL(f),
      duration: 2
    }));
    setFiles(prev => [...prev, ...arr]);
  }

  function onInputChange(e) {
    handleFiles(e.target.files);
    e.target.value = null;
  }

  async function ensureFFmpeg() {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = createFFmpeg({
      log: true,
      progress: ({ ratio }) => setProgress(Math.round(ratio * 100))
    });
    setMessage('Loading ffmpeg-core (may take a moment)...');
    await ffmpeg.load();
    ffmpegRef.current = ffmpeg;
    setMessage('ffmpeg ready');
    return ffmpeg;
  }

  async function generateVideo() {
    if (files.length === 0) {
      setMessage('Add at least 1 image');
      return;
    }
    setGenerating(true);
    const ffmpeg = await ensureFFmpeg();

    try { ffmpeg.FS('unlink', 'out.mp4'); } catch (e) {}

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const name = `img${String(i).padStart(3, '0')}.png`;
      const data = await fetchFile(f.file);
      ffmpeg.FS('writeFile', name, data);
    }

    let listFile = '';
    for (let i = 0; i < files.length; i++) {
      const name = `img${String(i).padStart(3, '0')}.png`;
      listFile += `file '${name}'\n`;
      listFile += `duration ${files[i].duration}\n`;
    }
    listFile += `file '${`img${String(files.length - 1).padStart(3, '0')}.png`}'\n`;
    ffmpeg.FS('writeFile', 'images.txt', new TextEncoder().encode(listFile));

    await ffmpeg.run('-f','concat','-safe','0','-i','images.txt','-vsync','vfr','-pix_fmt','yuv420p','out.mp4');

    const data = ffmpeg.FS('readFile', 'out.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images-to-video.mp4';
    a.click();

    setMessage('Video generated');
    setGenerating(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Image → Video PWA</h1>
        <p className="text-sm text-slate-600 mt-2">
          Offline-capable app. Install to home screen to use as a standalone app.
        </p>
      </header>

      <main className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <div className="flex gap-3 items-center">
          <label className="cursor-pointer px-4 py-2 rounded-lg border border-slate-200">
            Add images
            <input type="file" accept="image/*" multiple onChange={onInputChange} className="hidden" />
          </label>

          <button onClick={generateVideo} disabled={generating} className="px-4 py-2 rounded-lg bg-sky-600 text-white disabled:opacity-50">
            {generating ? `Generating (${progress}%)` : 'Generate video'}
          </button>

          <div className="ml-auto text-sm text-slate-500">{message}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.length === 0 && <div className="p-6 border rounded text-slate-500">No images yet</div>}
          {files.map((f, idx) => (
            <div key={f.id} className="flex items-center gap-3 border rounded p-3">
              <img src={f.url} alt="thumb" className="w-24 h-24 object-cover rounded" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <strong className="truncate">{f.file.name}</strong>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-sm">Duration (s):</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={f.duration}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0.1;
                      setFiles(prev => prev.map(p => p.id === f.id ? { ...p, duration: v } : p));
                    }}
                    className="w-24 rounded border px-2 py-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
