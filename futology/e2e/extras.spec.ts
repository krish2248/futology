import { test, expect } from '@playwright/test';

test.describe('Phase 6 wishlist features', () => {
  test('extras hub renders feature cards', async ({ page }) => {
    await page.goto('/intelligence/extras');
    await expect(page.locator('main')).toBeVisible();
    const cards = page.locator('a[href*="/intelligence/extras/"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('tournament simulator renders', async ({ page }) => {
    await page.goto('/intelligence/extras/tournament-simulator');
    await expect(page.locator('main')).toBeVisible();
  });

  test('match momentum renders', async ({ page }) => {
    await page.goto('/intelligence/extras/momentum');
    await expect(page.locator('main')).toBeVisible();
  });

  test('referee bias renders', async ({ page }) => {
    await page.goto('/intelligence/extras/referee-bias');
    await expect(page.locator('main')).toBeVisible();
  });

  test('weather impact renders', async ({ page }) => {
    await page.goto('/intelligence/extras/weather');
    await expect(page.locator('main')).toBeVisible();
  });

  test('press intensity renders', async ({ page }) => {
    await page.goto('/intelligence/extras/press-intensity');
    await expect(page.locator('main')).toBeVisible();
  });

  test('injury intelligence renders', async ({ page }) => {
    await page.goto('/intelligence/extras/injuries');
    await expect(page.locator('main')).toBeVisible();
  });

  test('odds movement renders', async ({ page }) => {
    await page.goto('/intelligence/extras/odds');
    await expect(page.locator('main')).toBeVisible();
  });
});
