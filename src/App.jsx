import React, { useState } from "react";

function App() {
  const [images, setImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(files.map(file => URL.createObjectURL(file)));
  };

  const generateVideo = () => {
    // For now, just show the images as a slideshow preview
    alert("Video generation feature will be added later!");
    setVideoUrl(null);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Image to Video PWA</h1>

      <input 
        type="file" 
        accept="image/*" 
        multiple 
        onChange={handleImageUpload} 
      />

      <div style={{ marginTop: "20px" }}>
        {images.map((img, idx) => (
          <img 
            key={idx} 
            src={img} 
            alt={`preview-${idx}`} 
            style={{ width: "200px", margin: "10px" }} 
          />
        ))}
      </div>

      <button 
        onClick={generateVideo} 
        style={{ marginTop: "20px", padding: "10px 20px" }}
      >
        Generate Video
      </button>

      {videoUrl && (
        <video controls width="400" style={{ marginTop: "20px" }}>
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support video.
        </video>
      )}
    </div>
  );
}

export default App;
