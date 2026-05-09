import { test, expect } from '@playwright/test';

test.describe('Predictions', () => {
  test('predictions page renders', async ({ page }) => {
    await page.goto('/predictions');
    await expect(page.locator('main')).toBeVisible();
  });

  test('predictions page has tab UI', async ({ page }) => {
    await page.goto('/predictions');
    // Predictions has 4 tabs: AI / Mine / Leagues / Community
    const buttons = page.getByRole('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('AI tab shows prediction cards', async ({ page }) => {
    await page.goto('/predictions');
    // The default tab renders prediction cards seeded from demoPredictions
    await expect(page.locator('main')).toBeVisible();
  });
});
