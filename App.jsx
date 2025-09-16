import React, { useState, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export default function ImageToVideoApp() {
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
