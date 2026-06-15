import type { WebContainer } from "@webcontainer/api";

/**
 * Single shared WebContainer per page/tab. WebContainer.boot() throws if called
 * twice without teardown, so every consumer (home ShellDemo, playground) must go
 * through this getter instead of booting directly. We never teardown — the
 * instance lives for the session so client-side navigation can reuse it.
 */
let bootPromise: Promise<WebContainer> | null = null;

export function getWebContainer(): Promise<WebContainer> {
  if (!bootPromise) {
    bootPromise = import("@webcontainer/api")
      .then(({ WebContainer }) => WebContainer.boot())
      .catch((err) => {
        // Don't cache a rejected boot. A transient failure (e.g. a network blip
        // reaching the *.staticblitz.com CDN) would otherwise wedge every later
        // call with the same rejection until a full page reload. Clearing it lets
        // the next getWebContainer() attempt a fresh boot.
        bootPromise = null;
        throw err;
      });
  }
  return bootPromise;
}
