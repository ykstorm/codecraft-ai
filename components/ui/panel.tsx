import { useId, type ReactNode } from "react";

// A raised surface. With a title, the heading also names the region.
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section className="panel" aria-labelledby={title ? headingId : undefined}>
      {title && (
        <h2 id={headingId} className="panel-title">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
