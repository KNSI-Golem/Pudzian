'use client';

import React, { useRef, useState } from 'react';

const UploadButton = ({ onUploadSuccess }) => {
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('Requesting upload URL...');

    try {
      const res = await fetch(
        `/api/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
      );

      if (!res.ok) throw new Error('Failed to get signed URL');

      const { putUrl, getUrl, filename } = await res.json();

      setStatus('Uploading to S3...');

      const uploadRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Upload to S3 failed');

      setStatus('✅ Upload complete!');

      onUploadSuccess(getUrl)
    } catch (error) {
      console.error(error);
      setStatus('❌ Upload failed.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex flex-col items-center mt-10">
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
      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </div>
  );
};

export default UploadButton;
