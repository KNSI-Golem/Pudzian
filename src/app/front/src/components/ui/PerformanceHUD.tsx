import React, { useEffect, useState } from 'react';
import { perfTracker } from '@/lib/perf/perfTracker';

export function PerformanceHUD() {
  const [metrics, setMetrics] = useState({
    poseMs: 0,
    handMs: 0,
    videoFps: 0,
    threeFps: 0,
  });

  useEffect(() => {
    const unsub = perfTracker.subscribe((m) => {
      setMetrics({ ...m });
    });
    return unsub;
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-green-400 p-4 rounded-lg font-mono text-sm border border-green-500/30 z-50 pointer-events-none shadow-2xl">
      <div className="text-white font-bold border-b border-green-500/30 pb-2 mb-2">🔥 System Metrics</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="opacity-70">Video Loop:</span>
        <span className={metrics.videoFps < 25 ? 'text-red-400' : ''}>{metrics.videoFps} fps</span>
        
        <span className="opacity-70">Three.js:</span>
        <span className={metrics.threeFps < 40 ? 'text-red-400' : ''}>{metrics.threeFps} fps</span>
        
        <span className="opacity-70">Pose Cost:</span>
        <span className={metrics.poseMs > 30 ? 'text-orange-400' : ''}>{metrics.poseMs.toFixed(1)} ms</span>
        
        <span className="opacity-70">Hand Cost:</span>
        <span className={metrics.handMs > 30 ? 'text-orange-400' : ''}>{metrics.handMs.toFixed(1)} ms</span>
      </div>
      <div className="mt-3 text-xs opacity-50 border-t border-green-500/20 pt-2">
        Total Engine Wait: {(metrics.poseMs + metrics.handMs).toFixed(1)} ms / frame
      </div>
    </div>
  );
}
