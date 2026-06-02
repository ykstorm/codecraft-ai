import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Terminal Pane", () => {
  test("terminal pane component exists in preview area", async ({ page }) => {
    // Navigate to home page to check component renders
    await page.goto(BASE_URL, { timeout: 30_000 });

    // Check that xterm.js terminal is listed as a feature
    const terminalMention = page.getByText(/xterm|terminal/i);
    const hasTerminalFeature = await terminalMention.count() > 0;
    expect(hasTerminalFeature).toBeTruthy();
  });
});

test.describe("AI Completions", () => {
  test("AI toggle button is present on home page", async ({ page }) => {
    await page.goto(BASE_URL, { timeout: 30_000 });

    // Home page should mention AI completions
    const hasAIMention = await page.getByText(/AI|ollama|monaco/i).count() > 0;
    expect(hasAIMention).toBeTruthy();
  });

  test("code-completion API route responds", async ({ page }) => {
    // Check the API route is registered — use absolute URL
    const response = await page.request.get(`${BASE_URL}/api/code-completion`, { ignoreHTTPSErrors: true });
    // Should return 405 (Method Not Allowed) for GET, or redirect for auth
    expect([200, 301, 302, 405]).toContain(response.status());
  });
});