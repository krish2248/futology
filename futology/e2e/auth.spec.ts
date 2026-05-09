import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    const email = page.locator('input[type="email"]');
    await expect(email).toBeVisible();
  });

  test('onboarding page renders', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('main, body')).toBeVisible();
  });

  test('login page has submit button', async ({ page }) => {
    await page.goto('/login');
    const button = page.getByRole('button').first();
    await expect(button).toBeVisible();
  });
});
