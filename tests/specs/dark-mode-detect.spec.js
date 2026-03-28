const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, openPopup, setPopupSetting, waitForThemeApplied } = require('../helpers/extension');

test.describe('Dark Mode Detection', () => {
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

  test('should SKIP site with html[dark] attribute (YouTube)', async () => {
    const page = await openTestPage(context, '/youtube');
    await page.waitForTimeout(2000);
    
    const ytBg = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--yt-spec-base-background');
    });
    
    const hasBase = await page.evaluate(() => {
      return !!document.getElementById('amoled-base');
    });
    
    expect(hasBase).toBe(false);
  });

  test('should SKIP site with data-color-mode="dark" (GitHub)', async () => {
    const page = await openTestPage(context, '/github');
    await page.waitForTimeout(2000);
    
    const hasBase = await page.evaluate(() => {
      return !!document.getElementById('amoled-base');
    });
    
    expect(hasBase).toBe(false);
  });

  test('should SKIP site with skin-theme-clientpref-night (Wikipedia)', async () => {
    const page = await openTestPage(context, '/dark');
    await page.waitForTimeout(2000);
    
    const hasBase = await page.evaluate(() => {
      return !!document.getElementById('amoled-base');
    });
    
    expect(hasBase).toBe(false);
  });

  test('should PROCESS light-themed site', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);
    
    const hasBase = await page.evaluate(() => {
      return !!document.getElementById('amoled-base');
    });
    
    expect(hasBase).toBe(true);
  });

  test('should still apply image filter on already-dark site', async () => {
    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }
    
    await popup.locator('#image-filter').evaluate(el => el.click());
    await popup.waitForTimeout(800);
    await popup.close();
    
    const page = await openTestPage(context, '/youtube');
    await page.waitForTimeout(3000);
    
    const hasImageStyle = await page.evaluate(() => {
      return !!document.getElementById('amoled-images');
    });
    
    expect(hasImageStyle).toBe(true);
    
    const popup2 = await openPopup(context, extensionId);
    if (popup2) {
      await popup2.locator('#image-filter').evaluate(el => el.click());
      await popup2.waitForTimeout(500);
      await popup2.close();
    }
  });

  test('should still apply custom CSS on already-dark site', async () => {
    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }
    
    await popup.locator('#custom-css').fill('h1 { color: #ff00ff !important; }');
    await popup.waitForTimeout(500);
    await popup.close();
    
    const page = await openTestPage(context, '/youtube');
    await page.waitForTimeout(2000);
    
    const hasCustomCSS = await page.evaluate(() => {
      return !!document.getElementById('amoled-custom-css');
    });
    
    expect(hasCustomCSS).toBe(true);
    
    const popup2 = await openPopup(context, extensionId);
    if (popup2) {
      await popup2.locator('#custom-css').fill('');
      await popup2.waitForTimeout(300);
      await popup2.close();
    }
  });
});
