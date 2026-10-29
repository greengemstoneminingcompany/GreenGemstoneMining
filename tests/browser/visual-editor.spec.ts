import { test, expect } from '@playwright/test';
import path from 'node:path';

const fixture = '/tests/fixtures/visual-editor.html';

test('actual preview opens the editor from its trigger without a query parameter and still requires admin sign-in', async ({ page }) => {
 const pageErrors: string[] = [];
 page.on('pageerror', error => pageErrors.push(error.message));
 await page.goto('/');
 await expect.poll(() => page.locator('#root').evaluate(el => el.childElementCount)).toBeGreaterThan(0);
 await expect(page.locator('#ggmc-visual-editor')).toHaveCount(0);
 const trigger = page.getByRole('button', { name: 'Open Preview Editor' });
 await expect(trigger).toBeVisible();
 expect(new URL(page.url()).searchParams.has('edit')).toBe(false);
 await trigger.click();
 await expect(page.locator('#ggmc-editor-auth-gate')).toBeVisible();
 await expect(page.locator('#ggmc-visual-editor')).toHaveCount(0);
 await expect(page.locator('#ggmc-editor-auth-gate')).toContainText('Opening this URL does not grant access');
 await expect(page.locator('#root')).toBeVisible();
 expect(pageErrors).toEqual([]);
});

test('normal page render does not mount editor without edit=1', async ({ page }) => {
 await page.goto(fixture);
 await expect(page.locator('#root')).toBeVisible();
 await expect(page.locator('#ggmc-visual-editor')).toHaveCount(0);
 await expect(page.locator('body')).not.toHaveClass(/ggmc-ve-on/);
});

test('preview-only trigger opens and closes the editor without changing page content', async ({ page }) => {
 await page.goto(fixture + '?preview-editor=1');
 const trigger = page.getByRole('button', { name: 'Open Preview Editor' });
 await expect(trigger).toBeVisible();
 await trigger.click();
 await expect(page.locator('#ggmc-visual-editor')).toBeVisible();
 page.on('dialog', dialog => dialog.accept());
 await page.getByRole('button', { name: 'Close', exact: true }).click();
 await expect(page.getByRole('button', { name: 'Open Preview Editor' })).toBeVisible();
 await expect(page.locator('#headline')).toHaveText('White text that should be editable');
});

test('studio can be resized horizontally, vertically, and diagonally', async ({ page }) => {
 await page.setViewportSize({ width: 1280, height: 900 });
 await page.goto(fixture + '?edit=1');
 const panel = page.locator('#ggmc-visual-editor');
 const original = await panel.boundingBox();
 if (!original) throw new Error('Editor is not visible.');
 const widthHandle = panel.getByRole('separator', { name: 'Resize width', exact: true });
 const wbox = await widthHandle.boundingBox();
 if (!wbox) throw new Error('Width handle is not visible.');
 await page.mouse.move(wbox.x + wbox.width / 2, wbox.y + 10);
 await page.mouse.down(); await page.mouse.move(wbox.x + wbox.width / 2 - 100, wbox.y + 10); await page.mouse.up();
 await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(original.width);
 const heightHandle = panel.getByRole('separator', { name: 'Resize height' });
 const hbox = await heightHandle.boundingBox();
 if (!hbox) throw new Error('Height handle is not visible.');
 const beforeHeight = (await panel.boundingBox())!.height;
 await page.mouse.move(hbox.x + hbox.width / 2, hbox.y + 2); await page.mouse.down();
 await page.mouse.move(hbox.x + hbox.width / 2, hbox.y + 90); await page.mouse.up();
 await expect.poll(async () => (await panel.boundingBox())!.height).toBeLessThan(beforeHeight);
 const corner = panel.getByRole('separator', { name: 'Resize width and height' });
 const cbox = await corner.boundingBox(); if (!cbox) throw new Error('Corner handle is not visible.');
 await page.mouse.move(cbox.x + 2, cbox.y + 2); await page.mouse.down();
 await page.mouse.move(cbox.x - 70, cbox.y + 70); await page.mouse.up();
 expect(await page.evaluate(() => localStorage.getItem('ggmc-ve-height'))).not.toBeNull();
 expect(await page.evaluate(() => localStorage.getItem('ggmc-ve-width'))).not.toBeNull();
});

test('edit=1 mounts editor, saves white text locally, survives reload and reopen', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await expect(page.locator('#ggmc-visual-editor')).toBeVisible();
 const headline = page.locator('#headline');
 await expect(headline).toHaveAttribute('contenteditable', 'true');
 await headline.fill('Updated white headline');
 await expect.poll(() => page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('ggmc-preview-editor-v2') || '{}');
  const text = saved.text as Record<string, { after?: unknown }> | undefined;
  return Object.values(text || {}).some(entry => entry.after === 'Updated white headline');
 })).toBe(true);
 await page.reload();
 await expect(page.locator('#ggmc-visual-editor')).toBeVisible();
 await expect(page.locator('#headline')).toHaveText('Updated white headline');
 await page.goto(fixture + '?edit=1');
 await expect(page.locator('#headline')).toHaveText('Updated white headline');
});

test('choosing a text layer keeps text mode active and supports deleting and undoing white text', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const search = page.getByRole('searchbox', { name: 'Find anything on this page' });
 await search.fill('White text that should be editable');
 await page.getByRole('button', { name: /h1 #headline/ }).click();
 await expect(page.getByRole('button', { name: 'Edit text', exact: true })).toHaveClass(/active/);
 const headline = page.locator('#headline');
 await expect(headline).toHaveAttribute('contenteditable', 'true');
 await headline.fill('');
 await expect(headline).toBeEmpty();
 await page.getByRole('button', { name: 'Undo', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Undid');
 await expect(headline).toHaveText('White text that should be editable');
});

test('clicking a white text fragment in a mixed-format heading opens its text editor', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const heading = page.locator('#split-headline');
 const box = await heading.boundingBox();
 if (!box) throw new Error('Split heading is not visible.');
 await page.mouse.click(box.x + 2, box.y + box.height / 2);
 const directText = page.getByRole('textbox', { name: 'Edit this text while keeping links and formatting' });
 await expect(directText).toBeFocused();
 await expect(directText).toHaveValue("Somaliland's ");
 await directText.fill('Somaliland’s');
 await directText.press('Tab');
 await expect(heading).toHaveText('Somaliland’s mineral frontier');
});

test('image editing replaces, crops, filters, backgrounds, and removes images in the local draft', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const sampleImage = path.resolve('public/assets/images/company-field.webp');
 const image = page.locator('#test-image');
 await page.getByRole('button', { name: 'Select element', exact: true }).click();
 await image.click();
 await page.getByLabel('Replace image from this device').setInputFiles(sampleImage);
 await expect.poll(() => image.getAttribute('src')).toMatch(/^data:image\/webp;base64,/);
 await page.getByRole('button', { name: 'Undo', exact: true }).click();
 await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
 await page.getByRole('button', { name: 'Redo', exact: true }).click();
 await expect.poll(() => image.getAttribute('src')).toMatch(/^data:image\/webp;base64,/);
 await page.getByLabel('Image fit').selectOption('contain');
 await expect(image).toHaveCSS('object-fit', 'contain');
 await page.getByRole('textbox', { name: 'Image focus (horizontal, vertical)' }).fill('65% 40%');
 await page.getByRole('textbox', { name: 'Image focus (horizontal, vertical)' }).press('Tab');
 await expect(image).toHaveCSS('object-position', '65% 40%');
 await page.getByLabel('Image look').selectOption('grayscale(1)');
 await expect(image).toHaveCSS('filter', 'grayscale(1)');

 const main = page.locator('#root main');
 await page.getByLabel('Find anything on this page').fill('main');
 await page.getByRole('button', { name: /main —/ }).click();
 await page.getByLabel('Choose background image from this device').setInputFiles(sampleImage);
 await expect.poll(() => main.evaluate(el => getComputedStyle(el).backgroundImage)).toContain('data:image/webp');
 await page.getByLabel('Background fit').selectOption('contain');
 await expect(main).toHaveCSS('background-size', 'contain');
 await page.getByLabel('Background focus').fill('center 40%');
 await page.getByLabel('Background focus').press('Tab');
 await expect(main).toHaveCSS('background-position', '50% 40%');
 await page.getByRole('button', { name: 'Remove background image', exact: true }).click();
 await expect(main).toHaveCSS('background-image', 'none');
});

test('undo and redo restore the edited canvas text', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const headline = page.locator('#headline');
 await headline.fill('Temporary undo test');
 await expect(headline).toHaveText('Temporary undo test');
 await page.getByRole('button', { name: 'Undo', exact: true }).click();
 await expect(headline).toHaveText('White text that should be editable');
 await page.getByRole('button', { name: 'Redo', exact: true }).click();
 await expect(headline).toHaveText('Temporary undo test');
});

test('Close restores canvas styles and stops editor keyboard interception', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const root = page.locator('#root');
 await page.locator('#ggmc-visual-editor button').filter({ hasText: 'Mobile' }).click();
 await expect(root).toHaveAttribute('data-ve-viewport', 'Mobile');
 page.on('dialog', dialog => dialog.accept());
 await page.locator('#ggmc-visual-editor button').filter({ hasText: 'Close' }).click();
 await expect(page.locator('#ggmc-visual-editor')).toHaveCount(0);
 await expect(page.locator('body')).not.toHaveClass(/ggmc-ve-on|ggmc-ve-text|ggmc-ve-select/);
 await expect(page.locator('#root')).toHaveAttribute('style', /max-width:\s*900px/i);
 await expect(root).toHaveAttribute('data-ve-viewport', 'before');
 await expect(page.locator('#headline')).not.toHaveAttribute('contenteditable', 'true');
 await expect(page.locator('#headline')).not.toHaveAttribute('data-ve-key');
 expect(new URL(page.url()).searchParams.has('edit')).toBe(false);
 const prevented = await page.evaluate(() => {
  const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true, bubbles: true });
  document.dispatchEvent(event);
  return event.defaultPrevented;
 });
 expect(prevented).toBe(false);
});

test('editor interactions preserve nested links and buttons', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const nested = page.locator('.nested');
 await expect(nested.locator('a')).toHaveText('Nested contact link');
 await expect(nested.locator('button')).toHaveText('Nested action');
 await expect(nested).toContainText('Section label');
});

test('nested text inspector edits without removing nested links or buttons', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const nested = page.locator('.nested');
 await nested.click();
 const directText = page.locator('#ggmc-visual-editor textarea[aria-label="Edit this text while keeping links and formatting"]');
 await expect(directText).toHaveValue('Section label ');
 await directText.fill('Updated section label ');
 await page.locator('#ggmc-visual-editor button').filter({ hasText: 'Mobile' }).click();
 await expect(nested).toContainText('Updated section label');
 await expect(nested.locator('a')).toHaveText('Nested contact link');
 await expect(nested.locator('a')).toHaveAttribute('href', '#contact');
 await expect(nested.locator('button')).toHaveText('Nested action');
});

test('undo restores the original text-node positions around nested markup', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const nested = page.locator('.nested-punctuation');
 await nested.click();
 const directText = page.locator('#ggmc-visual-editor textarea[aria-label="Edit this text while keeping links and formatting"]');
 await directText.fill('Updated section label .');
 await page.locator('#ggmc-visual-editor button').filter({ hasText: 'Mobile' }).click();
 const afterEdit = await nested.evaluate(el => [...el.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent));
 expect(afterEdit).toEqual(['Updated section label ', '.']);
 await page.getByRole('button', { name: 'Undo', exact: true }).click();
 const afterUndo = await nested.evaluate(el => [...el.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent));
 expect(afterUndo).toEqual(['Section label ', '.']);
 await expect(nested.locator('a')).toHaveAttribute('href', '#contact');
 await expect(nested.locator('button')).toHaveText('Nested action');
});

test('Add content creates every supported block type', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await page.locator('#ggmc-visual-editor select[aria-label="Block type"]').selectOption('text');
 await page.getByRole('button', { name: 'Add content', exact: true }).click();
 await page.getByRole('button', { name: 'Cancel', exact: true }).click();
 await expect(page.locator('#root [data-ve-block-id]')).toHaveCount(0);
 const kinds = ['section', 'text', 'card', 'grid', 'image', 'video', 'link', 'divider', 'spacer'];
 for (const kind of kinds) {
  await page.locator('#ggmc-visual-editor select[aria-label="Block type"]').selectOption(kind);
  await page.getByRole('button', { name: 'Add content', exact: true }).click();
  await page.getByPlaceholder('Heading or title').fill('Test ' + kind);
  if (['section', 'text', 'card', 'grid', 'video'].includes(kind)) await page.getByPlaceholder('Description or text').fill('Test block content');
  if (kind === 'image') await page.getByPlaceholder('Image URL').fill('/sample.png');
  if (kind === 'video') await page.getByPlaceholder('Video URL').fill('/sample.mp4');
  await page.getByRole('button', { name: 'Add block', exact: true }).click();
  await expect(page.locator('#root [data-ve-block-id]')).toHaveCount(kinds.indexOf(kind) + 1);
 }
 await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ggmc-preview-editor-v2') || '{}').blocks.map((block: { kind: string }) => block.kind))).toEqual(kinds);
 await expect(page.locator('#root [data-ve-block-id] video[controls]')).toHaveAttribute('src', '/sample.mp4');
 await expect(page.locator('#root [data-ve-block-id].ve-added-grid')).toHaveCount(1);
 await expect(page.locator('#root [data-ve-block-id].ve-added-grid .ve-added-card')).toHaveCount(2);
 await expect(page.locator('#root [data-ve-block-id].ve-added-spacer')).toHaveCSS('height', '48px');
});

test('layer search finds elements beyond the initial layer list', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const search = page.getByLabel('Find anything on this page');
 await page.getByRole('button', { name: 'Show more results', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor')).toContainText('Showing 101–116 of 116 items.');
 await search.fill('Extra layer 104');
 const result = page.locator('#ggmc-visual-editor button').filter({ hasText: 'Extra layer 104' }).first();
 await expect(result).toBeVisible();
 await expect(page.locator('#ggmc-visual-editor')).toContainText(/matches/);
 await result.click();
 await expect(page.locator('#ggmc-visual-editor')).toContainText('Selected:');
});

test('simple text formatting and rotation controls apply to the selected element', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await page.getByRole('button', { name: 'Select element', exact: true }).click();
 const headline = page.locator('#headline');
 await headline.click();
 await page.getByLabel('Font weight').selectOption('700');
 await expect(headline).toHaveCSS('font-weight', '700');
 await page.getByLabel('Font style').selectOption('italic');
 await expect(headline).toHaveCSS('font-style', 'italic');
 await page.getByLabel('Text decoration').selectOption('underline');
 await expect(headline).toHaveCSS('text-decoration-line', 'underline');
 await page.getByLabel('Text case').selectOption('uppercase');
 await expect(headline).toHaveCSS('text-transform', 'uppercase');
 await page.getByLabel('Rotation in degrees').fill('12');
 await page.getByLabel('Rotation in degrees').press('Tab');
 await expect(headline).toHaveCSS('rotate', '12deg');
 await page.getByRole('button', { name: 'Undo', exact: true }).click();
 await expect(headline).not.toHaveCSS('rotate', '12deg');
});

test('selected element controls style, hide/show, move, duplicate, and remove', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await page.getByRole('button', { name: 'Select element', exact: true }).click();
 const contact = page.locator('#contact');
 await contact.click();
 const baseColor = await contact.evaluate(el => getComputedStyle(el).color);
 await page.locator('#ggmc-visual-editor input[type="color"]').first().fill('#123456');
 await expect(contact).toHaveCSS('color', 'rgb(18, 52, 86)');
 await page.getByRole('button', { name: 'Reset styles', exact: true }).click();
 await expect(contact).toHaveCSS('color', baseColor);
 await page.locator('#ggmc-visual-editor input[type="color"]').first().fill('#123456');
 await page.getByRole('button', { name: 'Hide', exact: true }).click();
 await expect(contact).toHaveCSS('display', 'none');
 await page.getByRole('button', { name: 'Show', exact: true }).click();
 await expect(contact).not.toHaveCSS('display', 'none');
 const before = await contact.evaluate(el => [...el.parentElement!.children].indexOf(el));
 await page.getByRole('button', { name: 'Move up', exact: true }).click();
 const moved = await contact.evaluate(el => [...el.parentElement!.children].indexOf(el));
 expect(moved).toBe(before - 1);
 await page.getByRole('button', { name: 'Move down', exact: true }).click();
 await expect.poll(() => contact.evaluate(el => [...el.parentElement!.children].indexOf(el))).toBe(before);
 await expect(page.locator('#ggmc-visual-editor')).toContainText('Moved in this preview');
 await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
 const duplicate = page.locator('#root [data-ve-block-id]');
 await expect(duplicate).toHaveCount(1);
 page.on('dialog', dialog => dialog.accept());
 await duplicate.click();
 await page.getByRole('button', { name: 'Remove block', exact: true }).click();
 await expect(duplicate).toHaveCount(0);
});

test('text conversion and existing-button dropdown actions work', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const headline = page.locator('#headline');
 const box = await headline.boundingBox();
 if (!box) throw new Error('Headline is not visible for selection.');
 await page.mouse.move(box.x + 2, box.y + box.height / 2);
 await page.mouse.down();
 await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
 await page.mouse.up();
 await page.getByRole('button', { name: 'Selected text → button/link', exact: true }).click();
 await page.locator('#ggmc-visual-editor .ve-add-form select').selectOption('button');
 await page.locator('#ggmc-visual-editor textarea[placeholder^="Optional dropdown items"]').fill('Learn more | #contact');
 await page.getByRole('button', { name: 'Apply', exact: true }).click();
 const converted = headline.locator('[data-ve-inline-action]');
 await expect(converted).toHaveText('White text that should be editable');
 await converted.click();
 await expect(page.locator('#root .ve-dropdown-menu')).toBeVisible();
 await expect(page.locator('#root .ve-dropdown-menu a')).toHaveAttribute('href', '#contact');

 await page.getByRole('button', { name: 'Select element', exact: true }).click();
 await page.locator('.nested button').click();
 await page.getByRole('button', { name: 'Add dropdown to selected button', exact: true }).click();
 await page.locator('#ggmc-visual-editor textarea[placeholder^="Optional dropdown items"]').fill('Contact | #contact');
 await page.getByRole('button', { name: 'Apply', exact: true }).click();
 await page.getByRole('button', { name: 'Edit text', exact: true }).click();
 const nestedButton = page.locator('.nested button');
 await nestedButton.click();
 await expect(page.locator('.nested .ve-dropdown-menu')).toBeVisible();
 await expect(page.locator('.nested .ve-dropdown-menu a')).toHaveAttribute('href', '#contact');
});

test('server controls fail clearly without a preview server API', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await page.evaluate(() => { Reflect.deleteProperty(window, '__GGMC_EDITOR_API__'); });
 for (const name of ['Sign in', 'Refresh', 'Load draft', 'Save server draft']) {
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Server drafts are not connected on this preview.');
 }
 await page.getByRole('button', { name: 'Publish snapshot', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Save a new draft before publishing.');
 await page.getByRole('button', { name: 'Load versions', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Load or save a server draft first.');
 await page.getByRole('button', { name: 'Restore locally', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Select a version first.');
 await page.getByRole('button', { name: 'Restore to server draft', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Load a server draft and select a version first.');
});

test('panel buttons dock, collapse, expand, preview widths, export, and reset', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const panel = page.locator('#ggmc-visual-editor');
 await page.getByRole('button', { name: 'Dock left', exact: true }).click();
 await expect(panel).toHaveClass(/ve-left/);
 await page.getByRole('button', { name: 'Dock right', exact: true }).click();
 await expect(panel).not.toHaveClass(/ve-left/);
 await page.getByRole('button', { name: 'Collapse', exact: true }).click();
 await expect(panel).toHaveClass(/ve-collapsed/);
 await page.getByRole('button', { name: 'Expand', exact: true }).click();
 await expect(panel).not.toHaveClass(/ve-collapsed/);
 for (const size of ['Tablet', 'Mobile', 'Desktop']) {
  await page.getByRole('button', { name: size, exact: true }).click();
  await expect(page.locator('#root')).toHaveAttribute('data-ve-viewport', size);
 }
 await expect.poll(() => page.locator('#root').evaluate(el => (el as HTMLElement).style.width)).toBe('90%');
 await expect.poll(() => page.locator('#root').evaluate(el => (el as HTMLElement).style.boxShadow)).toContain('1px 2px 3px');
 await page.locator('#headline').fill('Reset me');
 await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
 await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Editor change package copied');
 const exported = await page.evaluate(() => navigator.clipboard.readText());
 expect(JSON.parse(exported)).toMatchObject({ targetBranch: 'preview/resource-navigation-gallery', draftOnly: true });
 await page.on('dialog', dialog => dialog.accept());
 await page.getByRole('button', { name: 'Reset draft', exact: true }).click();
 await expect(panel).toBeVisible();
 await expect(page.locator('#headline')).toHaveText('White text that should be editable');
 await expect(panel).toContainText('0 text edits');
});


test('edit query alone cannot activate the editor without the preview build marker', async ({ page }) => {
 await page.route('**/tests/fixtures/visual-editor.html?edit=1', async route => {
  const response = await route.fetch();
  const body = (await response.text()).replace('<meta name="ggmc-preview-editor" content="enabled">','');
  await route.fulfill({ response, body });
 });
 await page.goto(fixture + '?edit=1');
 await expect(page.locator('#ggmc-visual-editor')).toHaveCount(0);
 await expect(page.locator('#ggmc-editor-auth-gate')).toHaveCount(0);
 await expect(page.locator('body')).not.toHaveClass(/ggmc-ve-on/);
});

test('preview editor requires an authenticated admin session, not a query parameter', async ({ page }) => {
 await page.route('**/tests/fixtures/visual-editor.html?edit=1', async route => {
  const response = await route.fetch();
  const body = (await response.text()).replace(/window\.__GGMC_EDITOR_API__=\{[^;]+;\s*/, '');
  await route.fulfill({ response, body });
 });
 await page.goto(fixture + '?edit=1');
 await expect(page.locator('#ggmc-editor-auth-gate')).toBeVisible();
 await expect(page.locator('#ggmc-visual-editor')).toHaveCount(0);
 await expect(page.locator('#ggmc-editor-auth-gate')).toContainText('Opening this URL does not grant access');
});

test('custom HTML preserves plain text and multiple roots while stripping dangerous markup', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await expect(page.locator('#ggmc-visual-editor')).toBeVisible();
 await page.locator('#ggmc-visual-editor select[aria-label="Block type"]').selectOption('html');
 await page.getByRole('button', { name: 'Add content', exact: true }).click();
 await page.locator('#ggmc-visual-editor textarea[placeholder^="Paste HTML"]').fill('<p onerror="alert(1)">Root A</p><p>Root B</p><script>alert(2)</script><iframe src="javascript:alert(3)"></iframe><form onsubmit="alert(4)"><input name="x"><button type="submit">Preview form</button></form>');
 await page.getByRole('button', { name: 'Add block', exact: true }).click();
 const block = page.locator('#root [data-ve-block-id]').last();
 await expect(block.locator('p')).toHaveCount(2);
 await expect(block).toContainText('Root A');
 await expect(block).toContainText('Root B');
 await expect(block.locator('script,iframe')).toHaveCount(0);
 await expect(block.locator('[onerror],[onsubmit],[onclick]')).toHaveCount(0);
 await expect(block.locator('form')).toHaveCount(1);
 await block.locator('form button').click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Custom forms are preview-only');
 await page.locator('#ggmc-visual-editor select[aria-label="Block type"]').selectOption('html');
 await page.getByRole('button', { name: 'Add content', exact: true }).click();
 await page.locator('#ggmc-visual-editor textarea[placeholder^="Paste HTML"]').fill('plain text only');
 await page.getByRole('button', { name: 'Add block', exact: true }).click();
 await expect(page.locator('#root [data-ve-block-id]').last()).toHaveText('plain text only');
});

test('custom HTML rejects empty input without throwing or inserting a block', async ({ page }) => {
 const errors: string[] = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.goto(fixture + '?edit=1');
 await page.locator('#ggmc-visual-editor select[aria-label="Block type"]').selectOption('html');
 await page.getByRole('button', { name: 'Add content', exact: true }).click();
 await page.getByRole('button', { name: 'Add block', exact: true }).click();
 await expect(page.locator('#root [data-ve-block-id]')).toHaveCount(0);
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Enter valid, non-empty HTML content');
 await expect(page.locator('#ggmc-visual-editor .ve-add-form')).toBeVisible();
 expect(errors).toEqual([]);
});

test('unsafe links and CSS URL values are rejected and docking clears stale left positioning', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await page.locator('#ggmc-visual-editor select[aria-label="Block type"]').selectOption('link');
 await page.getByRole('button', { name: 'Add content', exact: true }).click();
 await page.locator('#ggmc-visual-editor input[placeholder="Link URL"]').fill('javascript:alert(1)');
 await page.getByRole('button', { name: 'Add block', exact: true }).click();
 await expect(page.locator('#root [data-ve-block-id]')).toHaveCount(0);
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Use HTTPS, HTTP, mailto:');
 const panel = page.locator('#ggmc-visual-editor');
 await panel.evaluate(el => (el as HTMLElement).style.left = '50px');
 await page.getByRole('button', { name: 'Dock left', exact: true }).click();
 await expect(panel).not.toHaveAttribute('style', /left:\s*50px/);
 await page.getByRole('button', { name: 'Dock right', exact: true }).click();
 await expect(panel).not.toHaveAttribute('style', /left:\s*50px/);
 await page.getByRole('button', { name: 'Select element', exact: true }).click();
 await page.locator('#contact').click();
 await page.locator('#ggmc-visual-editor details summary').click();
 const shadow = page.locator('#ggmc-visual-editor input[placeholder="0 4px 18px #0003"]');
 await shadow.fill('url(https://evil.example/x.png)');
 await shadow.press('Tab');
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('That CSS value is not allowed');
});


test('server draft pointer survives reload and publishing starts a separate copy', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await page.locator('#ggmc-visual-editor input[placeholder="Draft name"]').fill('Reload cycle test');
 await page.getByRole('button', { name: 'Save server draft', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Server draft saved as version 1');
 const first = await page.evaluate(() => JSON.parse(localStorage.getItem('ggmc-preview-editor-server-draft-v1') || '{}'));
 expect(first.id).toMatch(/^fixture-/);
 expect(first.version).toBe(1);
 await page.reload();
 await expect(page.locator('#ggmc-visual-editor')).toBeVisible();
 await page.getByRole('button', { name: 'Refresh', exact: true }).click();
 await page.getByRole('button', { name: 'Load draft', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor input[placeholder="Draft name"]')).toHaveValue('Reload cycle test');
 page.on('dialog', dialog => dialog.accept());
 await page.getByRole('button', { name: 'Publish snapshot', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor .ve-status')).toContainText('Published server snapshot v2');
 const published = await page.evaluate(() => JSON.parse(localStorage.getItem('ggmc-preview-editor-server-draft-v1') || '{}'));
 expect(published.id).toBe(first.id);
 expect(published.version).toBe(2);
 expect(published.status).toBe('published');
 await page.getByRole('button', { name: 'Save server draft', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor input[placeholder="Draft name"]')).toHaveValue('Reload cycle test (copy)');
 const copyState = await page.evaluate(() => JSON.parse(localStorage.getItem('ggmc-preview-editor-server-draft-v1') || '{}'));
 expect(copyState.id).not.toBe(first.id);
 expect(copyState.version).toBe(1);
 expect(copyState.status).toBe('draft');
});


test('AI-generated copy is reviewed first and applied only after explicit acceptance', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 await page.getByRole('button', { name: 'Select element', exact: true }).click();
 await page.locator('#headline').click();
 const headline = page.locator('#headline');
 await expect(headline).toHaveText('White text that should be editable');
 const source = page.locator('#ggmc-visual-editor textarea[aria-label="Text to send for AI review"]');
 await source.fill('White text that should be editable');
 const accept = page.getByRole('button', { name: 'Accept and apply to selected element', exact: true });
 await expect(accept).toBeDisabled();
 await page.getByRole('button', { name: 'Generate suggestion', exact: true }).click();
 await expect(page.locator('#ggmc-visual-editor textarea[aria-label="AI suggestion review"]')).toHaveValue('Suggested: White text that should be editable');
 await expect(headline).toHaveText('White text that should be editable');
 await expect(accept).toBeEnabled();
 await accept.click();
 await expect(headline).toHaveText('Suggested: White text that should be editable');
});

test('Creative Studio module exposes design tokens, reusable templates, AI review and version comparison', async ({ page }) => {
 await page.goto(fixture + '?edit=1');
 const panel = page.locator('#ggmc-visual-editor');
 await expect(panel.getByText('Global design tokens')).toBeVisible();
 await expect(panel.getByText('Creative library')).toBeVisible();
 await expect(panel.getByText('AI section workshop')).toBeVisible();
 await expect(panel.getByText('Version comparison')).toBeVisible();
 await panel.getByRole('button', { name: 'Apply design system', exact: true }).click();
 await expect(page.locator('#root')).toHaveCSS('--ggmc-accent', '#c4a252');
 await panel.getByLabel('Starter layout').selectOption('mission-story');
 await panel.getByRole('button', { name: 'Add starter section', exact: true }).click();
 await expect(page.locator('#root [data-ve-block-id]')).toHaveCount(1);
 await expect(page.locator('#root [data-ve-block-id]')).toContainText('Built on responsible practice');
 await panel.getByLabel('Template name').fill('Mission template');
 await panel.getByRole('button', { name: 'Select element', exact: true }).click();
 await page.locator('#root [data-ve-block-id]').click();
 await panel.getByRole('button', { name: 'Save selected block as template', exact: true }).click();
 await expect(panel).toContainText('Mission template');
 // Saved templates must survive a full editor reload before they can be reused.
 await page.reload();
 await expect(panel).toBeVisible();
 await expect(panel).toContainText('Mission template');
 await panel.getByRole('button', { name: 'Insert', exact: true }).click();
 await expect(page.locator('#root [data-ve-block-id]')).toHaveCount(2);
});

