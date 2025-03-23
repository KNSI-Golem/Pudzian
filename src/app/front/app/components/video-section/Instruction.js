export default function Instruction() {
    return (
      <section className="max-w-5xl mx-auto px-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-15">
          Upload a video to transform into the Golem
        </h1>
  
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Step 1: Before */}
          <div className="flex flex-col items-center">
          <div className="border-2 border-gray-400 rounded-xl overflow-hidden w-fit">
            <img src="/person-video-frame.svg" alt="After transformation" className="w-96 sm:w-128" />
          </div> 
            <p className="mt-2 text-sm font-medium text-gray-600">You</p>
          </div>
  
          {/* AI Flow */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-md font-semibold mb-2">AI</p>
            <span className="text-4xl">→</span>
          </div>
  
          {/* Step 2: After */}
          <div className="flex flex-col items-center">
          <div className="border-2 border-gray-400 rounded-xl overflow-hidden w-fit">
            <img src="/golem-video-frame.svg" alt="After transformation" className="w-96 sm:w-128" />
          </div>  
            <p className="mt-2 text-sm font-medium text-gray-600">Golem</p>
          </div>
        </div>
      </section>
    );
  }
  