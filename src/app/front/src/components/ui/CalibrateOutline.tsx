import React, { useEffect, useState } from "react";
import type { CalibrationStatus } from "@/types/calibrate";

interface CalibrateOutlineOptions {
  calibrateStatus: CalibrationStatus;
}

export function CalibrateOutline(options: CalibrateOutlineOptions) {
  const { calibrateStatus } = options;
  const [isVisible, setIsVisible] = useState(true);
  const outlineSrc = {
    NO: "/calibrate/golem-outline-red.svg",
    STARTED: "/calibrate/golem-outline-orange.svg",
    YES: "/calibrate/golem-outline-green.svg",
  }[calibrateStatus];

  useEffect(() => {
    if (calibrateStatus === "YES") {
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(fadeTimer);
    }

    if (calibrateStatus === "NO") {
      setIsVisible(true);
    }
  }, [calibrateStatus]);

  if (!isVisible) return null;

  return (
    <div className="golem-outline w-3/4 max-w-lg h-auto flex items-center justify-center">
      <img
        src={outlineSrc}
        alt="Golem Outline"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
