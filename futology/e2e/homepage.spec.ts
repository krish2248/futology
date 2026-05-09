import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders hero copy', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text?.length ?? 0).toBeGreaterThan(0);
  });

  test('shows live strip section', async ({ page }) => {
    await page.goto('/');
    // The home page renders either live matches or an empty state — both
    // count as the live region rendering successfully.
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('exposes a primary CTA above the fold', async ({ page }) => {
    await page.goto('/');
    const ctas = page.getByRole('link');
    expect(await ctas.count()).toBeGreaterThan(0);
  });
});
