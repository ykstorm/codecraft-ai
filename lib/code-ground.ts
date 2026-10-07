/**
 * The background of the editor and terminal panes, the --code-ground token in
 * app/globals.css. Monaco and xterm take a colour string, not a CSS variable,
 * so they read it here when they start.
 */
export function codeGround(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--code-ground").trim();
}
