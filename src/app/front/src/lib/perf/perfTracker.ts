type PerfMetrics = {
    poseMs: number;
    handMs: number;
    videoFps: number;
    threeFps: number;
};
  
type Subscriber = (metrics: PerfMetrics) => void;

class PerformanceTracker {
    private metrics: PerfMetrics = {
        poseMs: 0,
        handMs: 0,
        videoFps: 0,
        threeFps: 0,
    };

    // Obiekty do wylgładzania wyników
    private framesVideo = 0;
    private lastVideoFpsTime = performance.now();
    
    private framesThree = 0;
    private lastThreeFpsTime = performance.now();

    private poseTimes: number[] = [];
    private handTimes: number[] = [];

    private subscribers: Set<Subscriber> = new Set();
    private updateIntervalMs = 300;
    private lastEmitTime = performance.now();

    public subscribe(callback: Subscriber) {
        this.subscribers.add(callback);
        callback(this.metrics); // initial push
        return () => { this.subscribers.delete(callback); };
    }

    private emit() {
        const now = performance.now();
        if (now - this.lastEmitTime > this.updateIntervalMs) {
            this.metrics.poseMs = this.getAverage(this.poseTimes);
            this.metrics.handMs = this.getAverage(this.handTimes);
            
            // Emit to react component
            this.subscribers.forEach(sub => sub(this.metrics));
            
            // Clean rolling lists
            this.poseTimes = [];
            this.handTimes = [];
            this.lastEmitTime = now;
        }
    }

    private getAverage(arr: number[]) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    public startPose() {
        return performance.now();
    }

    public endPose(startTime: number) {
        this.poseTimes.push(performance.now() - startTime);
        this.emit();
    }

    public startHand() {
        return performance.now();
    }

    public endHand(startTime: number) {
        this.handTimes.push(performance.now() - startTime);
        this.emit();
    }

    public markVideoFrame() {
        this.framesVideo++;
        const now = performance.now();
        if (now - this.lastVideoFpsTime >= 1000) {
            this.metrics.videoFps = this.framesVideo;
            this.framesVideo = 0;
            this.lastVideoFpsTime = now;
            this.emit();
        }
    }

    public markThreeFrame() {
        this.framesThree++;
        const now = performance.now();
        if (now - this.lastThreeFpsTime >= 1000) {
            this.metrics.threeFps = this.framesThree;
            this.framesThree = 0;
            this.lastThreeFpsTime = now;
            this.emit();
        }
    }
}

export const perfTracker = new PerformanceTracker();
