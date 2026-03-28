const { test, expect } = require('@playwright/test');
const { launchExtension, openPopup, openTestPage, waitForThemeApplied } = require('../helpers/extension');

test.describe('Popup UI', () => {
  let context;
  let extensionId;
  let popup;

  test.beforeAll(async () => {
    const result = await launchExtension();
    context = result.context;
    extensionId = result.extensionId;
    await new Promise(r => setTimeout(r, 2000));
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    popup = await openPopup(context, extensionId);
    if (!popup) test.skip();
    await popup.reload();
  });

  test.afterEach(async () => {
    if (popup) await popup.close();
  });

  test('should open popup with correct title', async () => {
    const title = await popup.locator('.header h1').textContent();
    expect(title).toBe('AMOLED Black');
  });

  test('should show version number', async () => {
    const version = await popup.locator('.version').textContent();
    expect(version).toContain('v1.1.0');
  });

  test('should have enabled toggle checked by default', async () => {
    const isChecked = await popup.locator('#enabled').isChecked();
    expect(isChecked).toBe(true);
  });

  test('should show brightness at 75% by default', async () => {
    const value = await popup.locator('#brightness').inputValue();
    expect(value).toBe('75');
  });

  test('brightness display should show correct percentage', async () => {
    const display = await popup.locator('#brightness-value').textContent();
    expect(display).toBe('75%');
  });

  test('should update brightness display when slider moves', async () => {
    await popup.locator('#brightness').fill('50');
    const display = await popup.locator('#brightness-value').textContent();
    expect(display).toBe('50%');
  });

  test('should show bg mode Pure as active by default', async () => {
    const pureBtn = popup.locator('#bg-pure');
    const isActive = await pureBtn.getAttribute('class');
    expect(isActive).toContain('active');
  });

  test('should switch bg mode to Soft when clicked', async () => {
    await popup.locator('#bg-soft').click();
    const softBtn = popup.locator('#bg-soft');
    const isActive = await softBtn.getAttribute('class');
    expect(isActive).toContain('active');

    const pureBtn = popup.locator('#bg-pure');
    const pureActive = await pureBtn.getAttribute('class');
    expect(pureActive).not.toContain('active');
  });

  test('should show contrast Normal as active by default', async () => {
    const normalBtn = popup.locator('#contrast-normal');
    const isActive = await normalBtn.getAttribute('class');
    expect(isActive).toContain('active');
  });

  test('should switch contrast level', async () => {
    await popup.locator('#contrast-high').click();
    const highBtn = popup.locator('#contrast-high');
    expect(await highBtn.getAttribute('class')).toContain('active');
  });

  test('should hide image brightness section when image filter is off', async () => {
    const section = popup.locator('#image-brightness-section');
    const display = await section.getAttribute('style');
    expect(display).toContain('none');
  });

  test('should show image brightness section when image filter is toggled on', async () => {
    await popup.locator('#image-filter').evaluate(el => el.click());
    await popup.waitForTimeout(500);
    const section = popup.locator('#image-brightness-section');
    const display = await section.getAttribute('style');
    expect(display).not.toContain('none');
  });

  test('should disable all sections when enabled toggle is off', async () => {
    await popup.locator('#enabled').evaluate(el => el.click());
    await popup.waitForTimeout(200);
    const sections = popup.locator('.section');
    const count = await sections.count();
    for (let i = 0; i < count; i++) {
      const cls = await sections.nth(i).getAttribute('class');
      expect(cls).toContain('disabled');
    }
  });

  test('should accept custom CSS input', async () => {
    const textarea = popup.locator('#custom-css');
    await textarea.fill('body { font-size: 20px; }');
    const value = await textarea.inputValue();
    expect(value).toBe('body { font-size: 20px; }');
  });

  test('should have image brightness at 80% by default', async () => {
    const value = await popup.locator('#image-brightness').inputValue();
    expect(value).toBe('80');
  });
});
