'use client'

import React, { useState } from 'react';

const VideoUpload = () => {
  const [videoSrc, setVideoSrc] = useState('');

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      console.log(videoUrl)
      setVideoSrc(videoUrl);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center m-10">
      <div className="p-4 bg-white rounded shadow-lg">
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded file:border-0
                     file:text-sm file:font-semibold
                     file:bg-violet-50 file:text-violet-700
                     hover:file:bg-violet-100"
        />
        {videoSrc && (
          <div className="mt-4">
            <video controls src={videoSrc} width="100%" className="max-w-md">
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;


