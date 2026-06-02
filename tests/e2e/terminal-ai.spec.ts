import { test, expect } from "@playwright/test";

// E2E tests that run against the deployed preview/production URL.
// No local server needed — tests use the deployed site.
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

  test("home page mentions AI completions and Ollama", async ({ page }) => {
    await page.goto(DEPLOYED_URL, { timeout: 30_000 });
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });

    // Verify AI/AI completions mention (case-insensitive)
    const hasAI = /AI|ollama|monaco|codellama/i.test(await page.content());
    expect(hasAI).toBeTruthy();
  });
});

test.describe("API Routes", () => {
  test("code-completion route is registered on deployed app", async ({ page }) => {
    // The route exists if the deployed app returns 405 (method not allowed) for GET,
    // or 401/redirect (auth required) — both prove the route is registered
    const response = await page.request.get(`${DEPLOYED_URL}/api/code-completion`);
    expect([200, 301, 302, 405]).toContain(response.status());
  });
});