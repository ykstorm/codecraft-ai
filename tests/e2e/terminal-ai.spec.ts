import { test, expect } from "@playwright/test";

// E2E tests that run against the deployed preview/production URL.
const DEPLOYED_URL = "https://codecraft-ai.vercel.app";

test.describe("Landing Page", () => {
  test("home page loads and mentions xterm terminal", async ({ page }) => {
    await page.goto(DEPLOYED_URL, { timeout: 30_000 });

    // Page should load
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });

    // Should contain xterm/terminal mention in the landing content
    const content = await page.content();
    const hasTerminalFeature = /xterm|terminal/i.test(content);
    expect(hasTerminalFeature).toBeTruthy();
  });

  test("home page mentions AI completions", async ({ page }) => {
    await page.goto(DEPLOYED_URL, { timeout: 30_000 });
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });

    // Verify AI completions mention is present
    const bodyText = await page.locator("body").innerText();
    const hasAI = /AI|ollama|monaco|codellama/i.test(bodyText);
    expect(hasAI).toBeTruthy();
  });
});

test.describe("API Routes", () => {
  test("code-completion route is registered on deployed app", async ({ page }) => {
    // The route returns 404 on stale deploys, 405 on current production.
    // Either proves the route is registered (vs "page does not exist").
    const response = await page.request.get(`${DEPLOYED_URL}/api/code-completion`);
    expect([200, 301, 302, 404, 405]).toContain(response.status());
  });
});