'use client';

import { useState } from "react";
import ChangeButton from "./ChangeButton";
import UserVideo from "./UserVideo";
import { ModelViewer } from "../model-viewer";

export default function VideoSection() {
  const [isModelVisible, setIsModelVisible] = useState(false);

  const startVideo = () => setIsModelVisible(true);
  const stopVideo = () => setIsModelVisible(false);

  return (
    <div className="flex flex-col items-center justify-center mb-30 mt-10">
      <div className="flex flex-row gap-10 mt-10">
        <UserVideo isStreaming={isModelVisible} />
        <ModelViewer isVisible={isModelVisible} />
      </div>
      <ChangeButton onStart={startVideo} onStop={stopVideo} />
    </div>
  );
}
