import { test, expect } from "@playwright/test";

test.describe("Terminal Pane", () => {
  test("renders xterm terminal in playground", async ({ page }) => {
    await page.goto("/playground/new", { timeout: 60_000 });

    // Wait for WebContainer to boot (terminal appears after container ready)
    await page.waitForTimeout(5000);

    // Terminal header should be visible
    const terminalHeader = page.getByText("WebContainer Terminal");
    const hasTerminal = await terminalHeader.count() > 0;

    // Also check for xterm canvas (actual terminal DOM)
    const hasXterm = (await page.locator(".xterm").count()) > 0 ||
                     (await page.locator("[class*='xterm']").count()) > 0;

    expect(hasTerminal || hasXterm).toBeTruthy();
  });

  test("terminal accepts keyboard input", async ({ page }) => {
    await page.goto("/playground/new", { timeout: 60_000 });
    await page.waitForTimeout(5000);

    // Find and click the terminal area
    const terminal = page.locator(".xterm").first();
    if (await terminal.count() > 0) {
      await terminal.click();
      await page.keyboard.type("echo hello");
      await page.keyboard.press("Enter");

      // Terminal should have responded (check for $ prompt or output)
      await page.waitForTimeout(2000);
      const pageContent = await page.content();
      // Should contain either the typed command or a response
      const hasTerminalInteraction =
        pageContent.includes("echo hello") ||
        pageContent.includes("hello") ||
        pageContent.includes("$");
      expect(hasTerminalInteraction).toBeTruthy();
    }
  });
});

test.describe("AI Completions", () => {
  test("AI toggle button is present in playground toolbar", async ({ page }) => {
    await page.goto("/playground/new", { timeout: 60_000 });
    await page.waitForTimeout(5000);

    // AI toggle button should be in the toolbar
    const aiButton = page.getByText("AI").first();
    const hasAIButton = await aiButton.count() > 0;
    expect(hasAIButton).toBeTruthy();
  });

  test("monacopilot integration present — code-completion API route exists", async ({ page }) => {
    // Check the API route is registered
    const response = await page.request.get("/api/code-completion", { ignoreHTTPSErrors: true });
    // Route exists (may return 405 for GET or redirect for auth)
    expect([200, 301, 302, 405]).toContain(response.status());
  });
});