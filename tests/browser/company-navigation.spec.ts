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


test('Arabic project directory exposes translated filters and right-to-left direction', async ({ page }) => {
  await page.goto('/ar/#/projects');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  const group = page.getByRole('group', { name: 'تصفية سجلات المشاريع' });
  await expect(group).toBeVisible();
  await group.getByRole('button', { name: 'مواقع الموانئ' }).click();
  await expect(page.locator('.project-card')).toHaveCount(1);
  await expect(group.getByRole('button', { name: 'مواقع الموانئ' })).toHaveAttribute('aria-pressed', 'true');
});

test('project directory remains operable at a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/projects');
  const group = page.getByRole('group', { name: 'Filter project records' });
  await expect(group).toBeVisible();
  await group.getByRole('button', { name: 'Priority areas' }).click();
  await expect(group.getByRole('button', { name: 'Priority areas' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.project-card').first()).toBeVisible();
});

test.describe('localized company content', () => {
  const cases = [
    { locale: 'en', dir: 'ltr', vision: 'Build opportunity.', mission: 'From local connections to global markets', gem: 'A broad gemstone' },
    { locale: 'so', dir: 'ltr', vision: 'Dhis fursado.', mission: 'Xiriirrada maxalliga ah ilaa suuqyada caalamiga ah', gem: 'Dhagaxyo qaali ah oo' },
    { locale: 'ar', dir: 'rtl', vision: 'بناء الفرص.', mission: 'من العلاقات المحلية إلى الأسواق العالمية', gem: 'مجموعة متنوعة من' },
    { locale: 'zh', dir: 'ltr', vision: '创造机遇。', mission: '从本地联系走向全球市场', gem: '丰富的宝石' },
  ] as const;

  for (const { locale, dir, vision, mission, gem } of cases) {
    test(`${locale} renders translated company sections and correct document direction`, async ({ page }) => {
      const prefix = locale === 'en' ? '/' : `/${locale}/`;
      await page.goto(`${prefix}#/about?section=vision-mission`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale === 'zh' ? 'zh-Hans' : locale);
      await expect(page.locator('html')).toHaveAttribute('dir', dir);
      await expect(page.locator('#vision-mission')).toContainText(vision);
      await expect(page.locator('#vision-mission')).toContainText(mission);
      await expect(page.locator('#vision-mission li')).toHaveCount(6);
      await expect(page.locator('#gemstones')).toContainText(gem);
      await expect(page.locator('#gemstones .gemstone-card')).toHaveCount(11);
    });
  }

  test('Arabic company content fits a narrow mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/ar/#/about?section=vision-mission');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#vision-mission')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
