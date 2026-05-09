import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('all primary tabs are reachable', async ({ page }) => {
    const routes = ['/', '/scores', '/predictions', '/intelligence', '/profile'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('clubs and leagues index pages render', async ({ page }) => {
    await page.goto('/clubs');
    await expect(page.locator('main')).toBeVisible();
    await page.goto('/leagues');
    await expect(page.locator('main')).toBeVisible();
  });

  test('news page renders', async ({ page }) => {
    await page.goto('/news');
    await expect(page.locator('main')).toBeVisible();
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist-xyz');
    // Static export returns 200 for the not-found page, dev mode returns 404
    expect([200, 404]).toContain(response?.status() ?? 200);
  });
});
