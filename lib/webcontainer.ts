import type { WebContainer } from "@webcontainer/api";

import { TimeoutError, withTimeout } from "@/lib/timeout";

/** How long WebContainer.boot() may take before the page gives up on it. */
export const BOOT_TIMEOUT_MS = 60_000;

/** The boot frame never answered. This page cannot boot again; a reload can. */
export class BootTimeoutError extends Error {
  constructor() {
    super(
      `The WebContainer runtime did not start within ${
        BOOT_TIMEOUT_MS / 1000
      } s. Its boot frame from stackblitz.com never answered. A content blocker, a VPN or proxy, or a dropped connection is the usual cause.`
    );
    this.name = "BootTimeoutError";
  }
}

/**
 * Single shared WebContainer per page/tab. WebContainer.boot() throws if called
 * twice without teardown, so every consumer (home ShellDemo, playground) must go
 * through this getter instead of booting directly. We never teardown; the
 * instance lives for the session so client-side navigation can reuse it.
 *
 * How a failed boot behaves:
 * - A rejected boot is not cached, so the next call boots again. That works
 *   when the boot frame loaded and a later step failed, because the library
 *   releases its boot lock on a rejection.
 * - A boot frame that never loads leaves the library's own boot pending for
 *   good, and @webcontainer/api waits on that pending boot before it starts a
 *   new one, so a second boot() in this page would hang as well. After
 *   BOOT_TIMEOUT_MS the boot fails with BootTimeoutError, and that rejection
 *   stays cached: only a page reload can start over, which is what the
 *   playground's retry button does in that case.
 */
let bootPromise: Promise<WebContainer> | null = null;

export function getWebContainer(): Promise<WebContainer> {
  if (!bootPromise) {
    bootPromise = import("@webcontainer/api")
      .then(({ WebContainer }) =>
        withTimeout(WebContainer.boot(), BOOT_TIMEOUT_MS, "WebContainer boot")
      )
      .catch((err) => {
        if (err instanceof TimeoutError) throw new BootTimeoutError();
        bootPromise = null;
        throw err;
      });
  }
  return bootPromise;
}
