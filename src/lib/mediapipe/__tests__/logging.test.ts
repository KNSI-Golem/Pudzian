import { afterEach, describe, expect, it, vi } from "vitest";
import { runMediaPipeOperation } from "../logging";

const originalConsoleError = console.error;
const originalConsoleInfo = console.info;

afterEach(() => {
  console.error = originalConsoleError;
  console.info = originalConsoleInfo;
  vi.restoreAllMocks();
});

describe("MediaPipe runtime logging", () => {
  it("reports the exact XNNPACK status line as information", () => {
    const error = vi.fn();
    const info = vi.fn();
    console.error = error;
    console.info = info;

    runMediaPipeOperation(() => {
      console.error(
        "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.",
      );
    });

    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
    expect(console.error).toBe(error);
  });

  it("forwards unrelated errors unchanged", () => {
    const error = vi.fn();
    console.error = error;
    const failure = new Error("inference failed");

    runMediaPipeOperation(() => {
      console.error("MediaPipe failure", failure);
    });

    expect(error).toHaveBeenCalledWith("MediaPipe failure", failure);
  });

  it("does not suppress similar but non-matching messages", () => {
    const error = vi.fn();
    const info = vi.fn();
    console.error = error;
    console.info = info;
    const nearMatch =
      "INFO: Created TensorFlow Lite XNNPACK delegate for CPU. extra";

    runMediaPipeOperation(() => {
      console.error(nearMatch);
    });

    expect(error).toHaveBeenCalledWith(nearMatch);
    expect(info).not.toHaveBeenCalled();
  });

  it("restores the original logger after a synchronous error", () => {
    const error = vi.fn();
    console.error = error;
    const failure = new Error("inference failed");

    expect(() =>
      runMediaPipeOperation(() => {
        throw failure;
      }),
    ).toThrow(failure);

    expect(console.error).toBe(error);
  });

  it("restores the original logger after an asynchronous error", async () => {
    const error = vi.fn();
    console.error = error;
    const failure = new Error("initialization failed");

    await expect(
      runMediaPipeOperation(async () => {
        await Promise.resolve();
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(console.error).toBe(error);
  });

  it("keeps the narrow filter active until async setup finishes", async () => {
    const error = vi.fn();
    const info = vi.fn();
    console.error = error;
    console.info = info;

    await runMediaPipeOperation(async () => {
      await Promise.resolve();
      console.error(
        "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.",
      );
    });

    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
    expect(console.error).toBe(error);
  });

  it("keeps overlapping operations scoped until the last one finishes", async () => {
    const error = vi.fn();
    console.error = error;
    let finishFirst!: () => void;
    let finishSecond!: () => void;

    const first = runMediaPipeOperation(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        }),
    );
    const scopedLogger = console.error;
    const second = runMediaPipeOperation(
      () =>
        new Promise<void>((resolve) => {
          finishSecond = resolve;
        }),
    );

    finishFirst();
    await first;
    expect(console.error).toBe(scopedLogger);

    finishSecond();
    await second;
    expect(console.error).toBe(error);
  });

  it("does not overwrite a logger installed during an operation", () => {
    const replacement = vi.fn();

    runMediaPipeOperation(() => {
      console.error = replacement;
    });

    expect(console.error).toBe(replacement);
  });
});
