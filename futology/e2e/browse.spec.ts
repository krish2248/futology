import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers/auth';

test.describe('Browse pages', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('clubs index renders', async ({ page }) => {
    await page.goto('/clubs');
    await expect(page.locator('main')).toBeVisible();
  });

  test('clubs index links to detail pages', async ({ page }) => {
    await page.goto('/clubs');
    const detailLinks = page.locator('main a[href^="/clubs/"]');
    await expect(detailLinks.first()).toBeVisible();
  });

  test('leagues index renders', async ({ page }) => {
    await page.goto('/leagues');
    await expect(page.locator('main')).toBeVisible();
  });

  test('leagues index links to standings pages', async ({ page }) => {
    await page.goto('/leagues');
    const detailLinks = page.locator('main a[href^="/leagues/"]');
    await expect(detailLinks.first()).toBeVisible();
  });

  test('tournaments page renders', async ({ page }) => {
    await page.goto('/tournaments');
    await expect(page.locator('main')).toBeVisible();
  });
});
