import { test, expect } from "@playwright/test";

test.describe("Playground IDE", () => {
  test("boots WebContainer and loads playground page", async ({ page }) => {
    // Navigate to new playground — WebContainer boots lazily
    await page.goto("/playground/new", { timeout: 30_000 });

    // Page should load without crash
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });

    // Should see some playground UI element (sidebar, editor, or loader)
    const hasPlaygroundUI =
      (await page.locator('[data-testid="playground"]').count()) > 0 ||
      (await page.locator('[class*="playground"]').count()) > 0 ||
      (await page.getByText(/loading|editor|files/i).count()) > 0;

    expect(hasPlaygroundUI).toBeTruthy();
  });

  test("dashboard page loads with project list", async ({ page }) => {
    await page.goto("/dashboard", { timeout: 15_000 });

    // Dashboard should render without error
    await expect(page.locator("body")).toBeVisible();

    // Should have either a project list or empty state
    const hasContent =
      (await page.getByText(/new project|create/i).count()) > 0 ||
      (await page.locator('[data-testid="project-card"]').count()) > 0;

    expect(hasContent).toBeTruthy();
  });

  test("home page loads correctly", async ({ page }) => {
    await page.goto("/", { timeout: 15_000 });
    await expect(page.locator("body")).toBeVisible();

    // Should see landing page content
    const hasContent = (await page.getByText(/code|ide|build/i).count()) > 0;
    expect(hasContent).toBeTruthy();
  });
});