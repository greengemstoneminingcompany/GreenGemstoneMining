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

  test('filters the shared project directory without changing the route', async ({ page }) => {
    await page.goto('/#/projects');
    const cards = page.locator('.project-card');
    await expect(cards).toHaveCount(14);
    await page.getByRole('button', { name: 'Port sites' }).click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Lughaya port site');
    await page.getByRole('button', { name: 'All records' }).click();
    await expect(cards).toHaveCount(14);
    await expect(page).toHaveURL(/#\/projects$/);
  });
});

test('shared About records update detailed sections and office details together', async ({ page }) => {
  await page.goto('/#/about');
  await page.evaluate(() => {
    const records = structuredClone(window.__GGMC_COMPANY_DEFAULT_RECORDS__!);
    records.about.operations.cards[2].items = ['Verified equipment acceptance'];
    records.about.development.cards[0].title = 'Verified development acceptance';
    records.about.community.cards[0].paragraphs = ['Verified community acceptance'];
    records.about.services.cards[0].title = 'Verified service acceptance';
    records.about.history.cards[0].paragraphs = ['Verified history acceptance'];
    records.about.leadership.cards[0].title = 'Verified leadership acceptance';
    records.profile.officeAddress = 'Verified office acceptance';
    window.dispatchEvent(new CustomEvent('ggmc-company-records', { detail: records }));
  });
  await expect(page.locator('#operations')).toContainText('Verified equipment acceptance');
  await expect(page.locator('#development-projects')).toContainText('Verified development acceptance');
  await expect(page.locator('#rural-development')).toContainText('Verified community acceptance');
  await expect(page.locator('#services')).toContainText('Verified service acceptance');
  await expect(page.locator('#history-details')).toContainText('Verified history acceptance');
  await expect(page.locator('#leadership')).toContainText('Verified leadership acceptance');
  await expect(page.locator('#leadership')).toContainText('Verified office acceptance');
  await page.getByRole('link', { name: 'Contact', exact: true }).first().click();
  await expect(page.locator('.page-contact-detail').last()).toContainText('Verified office acceptance');
});
