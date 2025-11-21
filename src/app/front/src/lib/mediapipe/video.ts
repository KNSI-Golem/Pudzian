import type { VideoStreamConfig } from "@/types";

export const DEFAULT_VIDEO_CONFIG: VideoStreamConfig = {
  width: 640,
  height: 480,
  facingMode: "user",
};


export async function getUserMediaStream(config: Partial<VideoStreamConfig> = {}): Promise<MediaStream> {
  const finalConfig = { ...DEFAULT_VIDEO_CONFIG, ...config };
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: finalConfig.width,
        height: finalConfig.height,
        facingMode: finalConfig.facingMode
      }
    });
    
    return stream;
  } catch (error) {
    throw new Error(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  }
}


export function checkMediaSupport(): { supported: boolean; error?: string } {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: "Camera access not supported in this browser"
    };
  }
  
  return { supported: true };
}