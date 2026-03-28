const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, openPopup, setPopupSetting, waitForThemeApplied } = require('../helpers/extension');

test.describe('Site-Specific CSS Variable Overrides', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    const result = await launchExtension();
    context = result.context;
    extensionId = result.extensionId;
    await new Promise(r => setTimeout(r, 2000));
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should override --yt-spec-base-background for YouTube to pure black', async () => {
    const page = await openTestPage(context, '/light');
    
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--yt-spec-base-background', '#0f0f0f');
      document.documentElement.style.setProperty('--yt-spec-text-primary', '#f1f1f1');
    });
    
    await waitForThemeApplied(page);
    
    const bodyBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    
    expect(bodyBg).toBe('rgb(0, 0, 0)');
  });

  test('should preserve --yt-spec-brand-background-primary (red subscribe button)', async () => {
    const fs = require('fs');
    const content = fs.readFileSync(
      require('path').resolve(__dirname, '../../content/content.js'),
      'utf-8'
    );
    
    expect(content).not.toContain('--yt-spec-brand-button-background');
    expect(content).not.toContain('--yt-spec-brand-background-primary');
    expect(content).not.toContain('--yt-spec-subscribe-button');
  });

  test('should preserve GitHub syntax highlighting colors', async () => {
    const fs = require('fs');
    const content = fs.readFileSync(
      require('path').resolve(__dirname, '../../content/content.js'),
      'utf-8'
    );
    
    expect(content).not.toContain('--fgColor-success');
    expect(content).not.toContain('--fgColor-danger');
    expect(content).not.toContain('--bgColor-danger');
    expect(content).not.toContain('--bgColor-success');
    expect(content).not.toContain('--diff-blob');
  });
});

test.describe('Settings Integration', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    const result = await launchExtension();
    context = result.context;
    extensionId = result.extensionId;
    await new Promise(r => setTimeout(r, 2000));
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('changing brightness in popup should update page text color', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);
    
    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }
    
    await popup.locator('#brightness').fill('100');
    await popup.waitForTimeout(500);
    
    const textColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-text-color');
    });
    
    expect(textColor).toContain('255');
    
    await popup.locator('#brightness').fill('50');
    await popup.waitForTimeout(500);
    
    const textColor50 = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-text-color');
    });
    
    expect(textColor50).toMatch(/12[78]/);
    
    await popup.close();
  });

  test('disabling extension should restore original styles', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);
    
    let hasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(hasBase).toBe(true);
    
    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }
    await popup.locator('#enabled').evaluate(el => el.click());
    await popup.waitForTimeout(800);
    await popup.close();
    
    await page.waitForTimeout(1500);
    
    hasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(hasBase).toBe(false);
    
    const popup2 = await openPopup(context, extensionId);
    if (popup2) {
      await popup2.locator('#enabled').evaluate(el => el.click());
      await popup2.waitForTimeout(500);
      await popup2.close();
    }
  });

  test('switching to soft mode should update CSS variables', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);
    
    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }
    
    await popup.locator('#bg-soft').click();
    await popup.waitForTimeout(500);
    
    const bgVar = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-bg');
    });
    
    expect(bgVar).toContain('5');
    
    await popup.locator('#bg-pure').click();
    await popup.waitForTimeout(500);
    await popup.close();
  });

  test('image filter toggle should add/remove filter style', async () => {
    const page = await openTestPage(context, '/image');
    await waitForThemeApplied(page);
    
    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }
    
    await popup.locator('#image-filter').evaluate(el => el.click());
    await popup.waitForTimeout(800);
    
    let hasFilter = await page.evaluate(() => {
      const el = document.getElementById('amoled-images');
      return el && el.textContent.includes('brightness');
    });
    expect(hasFilter).toBe(true);
    
    await popup.locator('#image-filter').evaluate(el => el.click());
    await popup.waitForTimeout(500);
    
    hasFilter = await page.evaluate(() => {
      const el = document.getElementById('amoled-images');
      return el && el.textContent.includes('brightness');
    });
    expect(hasFilter).toBe(false);
    
    await popup.close();
  });
});
