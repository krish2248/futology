import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers/auth';

test.describe('Intelligence Hub', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('hub page lists feature cards', async ({ page }) => {
    await page.goto('/intelligence');
    await expect(page.locator('main')).toBeVisible();
    const cards = page.locator('main a[href^="/intelligence/"]');
    await expect(cards.nth(5)).toBeVisible();
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
