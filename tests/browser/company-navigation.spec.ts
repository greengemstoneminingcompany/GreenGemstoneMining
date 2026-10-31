import { expect, test } from '@playwright/test';

test.describe('company navigation', () => {
  test('opens a section when loaded directly from a deep link', async ({ page }) => {
    await page.goto('/#/about?section=vision-mission');
    const section = page.locator('#vision-mission');
    await expect(section).toBeVisible();
    await expect.poll(async () => section.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= -120 && rect.top < window.innerHeight;
    })).toBe(true);
  });

  test('navigates between company sections without losing the route', async ({ page }) => {
    await page.goto('/#/about?section=leadership');
    await expect(page.locator('#leadership')).toBeVisible();
    await page.goto('/#/about?section=history-details');
    await expect(page.locator('#history-details')).toBeVisible();
  });

  test('keeps the contact route available', async ({ page }) => {
    await page.goto('/#/contact');
    await expect(page.locator('.company-page-contact')).toBeVisible();
  });
});
