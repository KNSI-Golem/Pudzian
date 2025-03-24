'use client';

import { useState } from "react";
import Instruction from "./Instruction";
import UploadButton from "./UploadButton";
import SubmitButton from "./SubmitButton";
import ChangeButton from "./ChangeButton";

export default function VideoSection() {
  const [uploadedUrl, setUploadedUrl] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center mb-30 mt-30">
      {!uploadedUrl && (
          <>
            <Instruction />
            <UploadButton onUploadSuccess={(url) => setUploadedUrl(url)} />
          </>
        )}

      {uploadedUrl && (
        <div className="flex flex-col items-center justify-center mb-30">
          <video
            src={uploadedUrl}
            controls
            className="max-w-2xl w-full rounded shadow"
          />
          <div className="flex flex-row gap-10">
            <SubmitButton url={ uploadedUrl }/>
            <ChangeButton url={ uploadedUrl } onChange={() => setUploadedUrl(null)}/>
          </div>
        </div>
      )}

      
    </div>
  );
}
