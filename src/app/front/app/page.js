import myVideo from '/videos/get-started.mp4';
import HowItWorks from "./components/how-it-works";
import VideoUpload from "./components/video-upload";
import Video from 'next-video';

export default function Home() {
  return (
    <div>
      <HowItWorks />
      <VideoUpload />
    </div>
  );
}
