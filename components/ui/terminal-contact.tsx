"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const EMAIL = "raolakshyaraj@gmail.com";

/**
 * <TerminalContact> — fake-terminal contact prompt. Composes a mailto: from the
 * typed message. No backend, no network — read-only-safe.
 */
export function TerminalContact() {
  const [msg, setMsg] = useState("");

  const subject = encodeURIComponent("codecraft — incoming connection");
  const mailto = `mailto:${EMAIL}?subject=${subject}&body=${encodeURIComponent(msg)}`;

  return (
    <div className="cc-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-cyan-400/40" />
        <span className="font-mono text-xs text-muted-foreground">
          operator@codecraft:~$ contact
        </span>
      </div>
      <div className="space-y-3 p-4 font-mono text-sm">
        <div className="text-muted-foreground">
          <span className="text-cyan-400">&gt;</span> establishing secure channel…
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          placeholder="type your message, operator"
          className="w-full resize-none rounded border border-border bg-transparent p-3 font-mono text-sm text-foreground outline-none focus:border-cyan-400"
        />
        <a
          href={mailto}
          className="inline-flex items-center gap-2 rounded border border-cyan-400/40 px-4 py-2 font-mono text-sm text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-400/10"
        >
          <Send className="h-4 w-4" />
          transmit
        </a>
      </div>
    </div>
  );
}
