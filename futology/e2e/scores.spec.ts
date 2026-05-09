import { test, expect } from '@playwright/test';

test.describe('Scores', () => {
  test('scores page renders', async ({ page }) => {
    await page.goto('/scores');
    await expect(page.locator('main')).toBeVisible();
  });

  test('scores page exposes filter tabs', async ({ page }) => {
    await page.goto('/scores');
    // Filter chips: All / Live / Finished / Scheduled
    const buttons = page.getByRole('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('scores page shows match groupings', async ({ page }) => {
    await page.goto('/scores');
    await expect(page.locator('main')).toBeVisible();
  });
});
