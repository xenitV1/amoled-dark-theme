const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied, openPopup } = require('../helpers/extension');
const { parseRGB } = require('../helpers/color-utils');

test.describe('Dark Mode Toggle Interaction', () => {
  let context, extensionId;

  test.beforeAll(async () => {
    const result = await launchExtension();
    context = result.context;
    extensionId = result.extensionId;
    await new Promise(r => setTimeout(r, 2000));
  });

  test.afterAll(async () => {
    if (context) await context.close();
  });

  test('light mode site should be themed by extension', async () => {
    const page = await openTestPage(context, '/dark-toggle');
    await waitForThemeApplied(page);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bodyBg);
    expect(parsed).not.toBeNull();
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });

  test('toggling site to its own dark mode changes theme behavior', async () => {
    const page = await openTestPage(context, '/dark-toggle');
    await waitForThemeApplied(page);

    const toggleBtn = page.locator('.theme-toggle');
    await toggleBtn.click();
    await page.waitForTimeout(2000);

    const isDarkAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(isDarkAttr).toBe('dark');
  });

  test('toggling back to light re-applies full dark theme', async () => {
    const page = await openTestPage(context, '/dark-toggle');
    await waitForThemeApplied(page);

    const toggleBtn = page.locator('.theme-toggle');
    await toggleBtn.click();
    await page.waitForTimeout(1000);

    await toggleBtn.click();
    await page.waitForTimeout(2000);

    const isDarkAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(isDarkAttr).toBeNull();
  });

  test('extension should not break site toggle button', async () => {
    const page = await openTestPage(context, '/dark-toggle');
    await waitForThemeApplied(page);

    const toggleBtn = page.locator('.theme-toggle');
    const isVisible = await toggleBtn.isVisible();
    expect(isVisible).toBe(true);

    await toggleBtn.click();
    await page.waitForTimeout(1000);

    const isDarkAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(isDarkAttr).toBe('dark');

    const stillVisible = await toggleBtn.isVisible();
    expect(stillVisible).toBe(true);

    await toggleBtn.click();
    await page.waitForTimeout(1000);

    const backToLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(backToLight).toBeNull();
  });

  test('site CSS variables should not prevent extension from working', async () => {
    const page = await openTestPage(context, '/dark-toggle');
    await waitForThemeApplied(page);

    const computedVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        bg: style.getPropertyValue('--bg').trim(),
        text: style.getPropertyValue('--text').trim(),
        cardBg: style.getPropertyValue('--card-bg').trim(),
      };
    });

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bodyBg);
    expect(parsed).not.toBeNull();
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });
});
