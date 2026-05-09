import { test, expect } from '@playwright/test';

test.describe('Profile & Settings', () => {
  test('profile page renders', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('main')).toBeVisible();
  });

  test('settings page renders', async ({ page }) => {
    await page.goto('/profile/settings');
    await expect(page.locator('main')).toBeVisible();
  });

  test('settings exposes notification toggles', async ({ page }) => {
    await page.goto('/profile/settings');
    const switches = page.locator('[role="switch"]');
    expect(await switches.count()).toBeGreaterThan(0);
  });

  test('profile page exposes a settings link', async ({ page }) => {
    await page.goto('/profile');
    const settingsLink = page.locator('a[href*="/profile/settings"]');
    expect(await settingsLink.count()).toBeGreaterThan(0);
  });
});
