import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers/auth';

test.describe('Profile & Settings', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

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
    const settingsLink = page.locator('main a[href*="/profile/settings"]');
    await expect(settingsLink.first()).toBeVisible();
  });
});
