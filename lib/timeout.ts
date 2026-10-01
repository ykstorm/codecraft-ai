/**
 * Run a promise with a wall-clock timeout. If the promise does not settle
 * within `ms`, the returned promise rejects with a `TimeoutError` and the
 * caller is responsible for any cleanup (killing a process, etc.). The
 * underlying promise is not cancelled — JS promises can't be — so pass an
 * `onTimeout` callback to tear down whatever the promise was driving.
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "operation",
  onTimeout?: () => void
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      try {
        onTimeout?.();
      } finally {
        reject(new TimeoutError(`${label} timed out after ${ms}ms`));
      }
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
