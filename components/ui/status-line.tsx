import type { ReactNode } from "react";

export type StatusTone = "neutral" | "ok" | "bad";

// One line of text that screen readers announce when it changes.
export function StatusLine({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <p role="status" className="status" data-tone={tone}>
      {children}
    </p>
  );
}
