const XNNPACK_INFO_MESSAGE =
  "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.";

let operationDepth = 0;
let previousConsoleError: typeof console.error | undefined;
let mediaPipeConsoleError: typeof console.error | undefined;

function isXnnpackInfo(args: readonly unknown[]): boolean {
  return args.some(
    (argument) =>
      typeof argument === "string" &&
      argument.trim() === XNNPACK_INFO_MESSAGE,
  );
}

function beginMediaPipeOperation(): () => void {
  if (operationDepth === 0) {
    previousConsoleError = console.error;
    mediaPipeConsoleError = (...args: unknown[]) => {
      if (isXnnpackInfo(args)) {
        console.info(...args);
        return;
      }
      previousConsoleError?.(...args);
    };
    console.error = mediaPipeConsoleError;
  }
  operationDepth += 1;

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    operationDepth -= 1;
    if (operationDepth !== 0) return;
    if (
      previousConsoleError &&
      console.error === mediaPipeConsoleError
    ) {
      console.error = previousConsoleError;
    }
    previousConsoleError = undefined;
    mediaPipeConsoleError = undefined;
  };
}

export function runMediaPipeOperation<T>(operation: () => T): T {
  const finish = beginMediaPipeOperation();
  try {
    const result = operation();
    if (
      result &&
      typeof result === "object" &&
      "finally" in result &&
      typeof result.finally === "function"
    ) {
      return result.finally(finish) as T;
    }
    finish();
    return result;
  } catch (error) {
    finish();
    throw error;
  }
}
