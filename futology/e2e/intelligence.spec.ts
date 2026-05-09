import { test, expect } from '@playwright/test';

test.describe('Intelligence Hub', () => {
  test('hub page lists feature cards', async ({ page }) => {
    await page.goto('/intelligence');
    await expect(page.locator('main')).toBeVisible();
    const cards = page.locator('a[href*="/intelligence/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(6);
  });

  test('match predictor renders', async ({ page }) => {
    await page.goto('/intelligence/match');
    await expect(page.locator('main')).toBeVisible();
  });

  test('player pulse renders', async ({ page }) => {
    await page.goto('/intelligence/players');
    await expect(page.locator('main')).toBeVisible();
  });

  test('extras hub renders', async ({ page }) => {
    await page.goto('/intelligence/extras');
    await expect(page.locator('main')).toBeVisible();
  });
});
