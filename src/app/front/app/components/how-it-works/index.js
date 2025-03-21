import { ArrowRight } from 'lucide-react';
import { FaCloudUploadAlt, FaHourglassHalf, FaPlayCircle } from 'react-icons/fa';

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto mt-20 px-4 text-center">
      <h2 className="text-4xl font-bold mb-16">How It Works</h2>

      <div className="flex flex-col md:flex-row items-center justify-center gap-10">
        {/* Step 1 with icon */}
        <div className="flex-1 bg-white shadow-md p-8 rounded-xl">
          <FaCloudUploadAlt size={80} className="mx-auto mb-4 text-teal-500"/>
          <h3 className="text-xl font-semibold mb-2">Upload Your Video</h3>
          <p className="text-gray-600">Record or upload a short video of yourself — we’ll do the rest.</p>
        </div>

        {/* Arrow */}
        <ArrowRight className="hidden md:block w-12 h-12 text-teal-500 mx-2" />

        {/* Step 2 with icon */}
        <div className="flex-1 bg-white shadow-md p-8 rounded-xl">
          <FaHourglassHalf size={80} className="mx-auto mb-4 text-teal-500"/>
          <h3 className="text-xl font-semibold mb-2">Wait for the Magic</h3>
          <p className="text-gray-600">Our AI transforms your video into a Pudzian-powered deepfake. This might take a moment.</p>
        </div>

        {/* Arrow */}
        <ArrowRight className="hidden md:block w-12 h-12 text-teal-500 mx-2" />

        {/* Step 3 with icon */}
        <div className="flex-1 bg-white shadow-md p-8 rounded-xl">
          <FaPlayCircle size={80} className="mx-auto mb-4 text-teal-500"/>
          <h3 className="text-xl font-semibold mb-2">Enjoy the Deepfake</h3>
          <p className="text-gray-600">Watch your custom deepfake — Pudzian style 💪</p>
        </div>
      </div>
    </section>
  );
}
