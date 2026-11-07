import { expect, test } from '@playwright/test';

test('light map tabs and regional text remain readable on desktop and mobile', async ({ page }) => {
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#/projects');
    await expect(page.locator('.gm-tab').first()).toBeVisible();
    await page.locator('.gm-tab').first().click();
    await expect(page.locator('.region-card')).toBeVisible();
    const contrast = await page.evaluate(() => {
      const rgb = (value: string) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const luminance = (c: number[]) => c.map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
      const ratio = (a: string, b: string) => { const [low, high] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => x - y); return (high + .05) / (low + .05); };
      const tabs = Array.from(document.querySelectorAll('.gm-tab')).map(el => { const style = getComputedStyle(el); return ratio(style.color, style.backgroundColor); });
      const card = document.querySelector('.region-card')!;
      const style = getComputedStyle(card);
      const stops = style.backgroundImage.match(/rgba?\([^)]+\)/g) || [getComputedStyle(document.body).backgroundColor];
      const text = Array.from(card.querySelectorAll('h3, dd')).map(el => Math.min(...stops.map(bg => ratio(getComputedStyle(el).color, bg))));
      const border = Math.min(...stops.map(bg => ratio(style.borderLeftColor, bg)));
      return { tabs, text, border };
    });
    expect(contrast.tabs.length).toBeGreaterThan(0);
    expect(contrast.text.length).toBeGreaterThan(0);
    expect(Math.min(...contrast.tabs, ...contrast.text)).toBeGreaterThanOrEqual(4.5);
    expect(contrast.border).toBeGreaterThanOrEqual(3);
  }
});
