import { test, expect } from "@playwright/test";

/**
 * Smoke tests that run against a locally built-and-started server (see
 * playwright.config.mts `webServer`). They assert real HTTP behaviour — status
 * codes, security headers, public vs. gated routing — without needing a live
 * cross-origin-isolated WebContainer boot (that is exercised on the Vercel
 * preview, not in CI).
 */

test("landing page is 200 and cross-origin isolated", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
  const headers = res.headers();
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["cross-origin-embedder-policy"]).toBe("require-corp");
});

test("/api/now is reachable anonymously (200)", async ({ request }) => {
  const res = await request.get("/api/now");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.service).toBe("codecraft");
});

test("live playground renders a preview pane", async ({ page }) => {
  const res = await page.goto("/playground/vite-react-starter");
  expect(res?.status()).toBe(200);
  await expect(page.getByText(/preview/i).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("unknown template slug shows a friendly not-found", async ({ page }) => {
  const res = await page.goto("/playground/nope");
  expect(res?.status()).toBe(200);
  await expect(page.getByText(/Template not found/i)).toBeVisible();
});

test("/dashboard redirects anonymous users (307)", async ({ request }) => {
  const res = await request.get("/dashboard", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
});
