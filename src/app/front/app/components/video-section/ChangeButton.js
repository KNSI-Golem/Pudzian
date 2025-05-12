'use client';

import { useState } from "react";

const ChangeButton = ({ onStart, onStop }) => {
  const [isStreaming, setIsStreaming] = useState(false);

  const handleClick = () => {
    if (isStreaming) {
      onStop();
    } else {
      onStart();
    }
    setIsStreaming(!isStreaming);
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <button
        onClick={handleClick}
        className={`w-50 ${
          isStreaming ? "bg-red-500 hover:bg-red-600" : "bg-teal-500 hover:bg-teal-600"
        } text-white font-semibold py-2 px-6 rounded button`}
      >
        {isStreaming ? "Stop" : "Start"}
      </button>
    </div>
  );
};

export default ChangeButton;