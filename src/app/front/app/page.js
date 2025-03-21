import { geistSans } from "./fonts";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(80vh-140px)] px-4 py-8">
        <h1 className={`${geistSans.className}`}>Hello World</h1>
    </div>
  );
}