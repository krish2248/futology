import { test, expect } from '@playwright/test';

test.describe('Browse pages', () => {
  test('clubs index renders', async ({ page }) => {
    await page.goto('/clubs');
    await expect(page.locator('main')).toBeVisible();
  });

  test('clubs index links to detail pages', async ({ page }) => {
    await page.goto('/clubs');
    const detailLinks = page.locator('a[href*="/clubs/"]');
    expect(await detailLinks.count()).toBeGreaterThan(0);
  });

  test('leagues index renders', async ({ page }) => {
    await page.goto('/leagues');
    await expect(page.locator('main')).toBeVisible();
  });

  test('leagues index links to standings pages', async ({ page }) => {
    await page.goto('/leagues');
    const detailLinks = page.locator('a[href*="/leagues/"]');
    expect(await detailLinks.count()).toBeGreaterThan(0);
  });

  test('tournaments page renders', async ({ page }) => {
    await page.goto('/tournaments');
    await expect(page.locator('main')).toBeVisible();
  });
});
