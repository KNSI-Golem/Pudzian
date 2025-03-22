'use client';

import React, { useRef, useState } from 'react';

const UploadButton = () => {
  const [videoSrc, setVideoSrc] = useState('');
  const fileInputRef = useRef(null);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setVideoSrc(videoUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex flex-col items-center justify-center m-10">
      <div className="p-6 flex flex-col items-center">
        <button
          onClick={triggerFileInput}
          className="w-72 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded button"
        >
          Upload
        </button>

        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          ref={fileInputRef}
          className="hidden"
        />

        {videoSrc && (
          <div className="mt-6">
            <video controls src={videoSrc} className="max-w-md rounded-lg shadow" />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadButton;
