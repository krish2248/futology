import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers/auth';

test.describe('Futology Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/');

    await expect(page).toHaveTitle(/futology/i);

    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/');

    await page.locator('a[href="/scores"]').first().click();
    await expect(page).toHaveURL(/.*scores/);

    await page.locator('a[href="/predictions"]').first().click();
    await expect(page).toHaveURL(/.*predictions/);
  });

  test('login page accessible', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });
});
