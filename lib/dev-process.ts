/**
 * Helpers for the playground's dev server process: keep the last lines of its
 * output, and report an exit nobody asked for instead of leaving the page at
 * "starting dev server" for good.
 */

export type OutputTail = {
  /** feed one streamed chunk; lines may span chunks */
  push(chunk: string): void;
  /** the last lines seen, oldest first, blank lines left out */
  lines(): string[];
};

export function createOutputTail(maxLines: number): OutputTail {
  const kept: string[] = [];
  let partial = "";

  const keep = (line: string) => {
    if (line.trim() === "") return;
    kept.push(line);
    if (kept.length > maxLines) kept.shift();
  };

  return {
    push(chunk) {
      const parts = (partial + chunk).split("\n");
      partial = parts.pop() ?? "";
      for (const part of parts) keep(part.replace(/\r$/, ""));
    },
    lines() {
      const all = partial.trim() === "" ? [...kept] : [...kept, partial];
      return all.slice(-maxLines);
    },
  };
}

/** The terminal text printed when the dev server exits on its own. */
export function formatDevExit(code: number, lines: string[]): string {
  const head = `\r\n[error] dev server exited with code ${code}`;
  if (lines.length === 0) return `${head}, with no output\r\n`;
  const body = lines.map((line) => `  ${line}`).join("\r\n");
  return `${head}. Its last lines:\r\n${body}\r\n`;
}

/** The message for the error banner. */
export function devExitMessage(code: number): string {
  return `The dev server stopped with exit code ${code}. Its last lines are in the terminal. Retry installs again from the template.`;
}

/**
 * Wait for the dev server to exit and report it, unless the exit came from
 * our own kill on unmount or reset (`isDisposed()` is true then).
 */
export function watchDevExit(
  dev: { exit: Promise<number> },
  tail: OutputTail,
  opts: {
    isDisposed: () => boolean;
    emit: (text: string) => void;
    onExit: (code: number) => void;
  }
): Promise<void> {
  return dev.exit.then((code) => {
    if (opts.isDisposed()) return;
    opts.emit(formatDevExit(code, tail.lines()));
    opts.onExit(code);
  });
}
