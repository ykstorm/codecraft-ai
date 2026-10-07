import { PanelResizeHandle } from "react-resizable-panels";

// The splitter between two panes. It is focusable, and the arrow keys move it.
export function ResizeHandle({ label }: { label: string }) {
  return (
    <PanelResizeHandle className="resize-handle" aria-label={label}>
      <svg width="3" height="15" viewBox="0 0 3 15" aria-hidden="true" focusable="false">
        <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
        <circle cx="1.5" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="1.5" cy="13.5" r="1.5" fill="currentColor" />
      </svg>
    </PanelResizeHandle>
  );
}
