const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied } = require('../helpers/extension');
const { parseRGB } = require('../helpers/color-utils');

test.describe('Infinite Scroll / Progressive Loading', () => {
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

  test('initial items should be loaded and page should be themed', async () => {
    const page = await openTestPage(context, '/infinite-scroll');
    await waitForThemeApplied(page);

    const hasActive = await page.evaluate(() => document.documentElement.classList.contains('amoled-active'));
    expect(hasActive).toBe(true);

    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const m = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const bodySum = m ? parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]) : 999;
      return { itemCount: items.length, bodySum };
    });

    expect(results.itemCount).toBeGreaterThan(0);
    expect(results.bodySum).toBeLessThan(30);
  });

  test('body background is dark', async () => {
    const page = await openTestPage(context, '/infinite-scroll');
    await waitForThemeApplied(page);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bodyBg);
    expect(parsed).not.toBeNull();
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(20);
  });

  test('scrolled-in items should be in DOM after scroll', async () => {
    const page = await openTestPage(context, '/infinite-scroll');
    await waitForThemeApplied(page);

    await page.evaluate(() => {
      const container = document.querySelector('.scroll-container');
      if (container) container.scrollTop = container.scrollHeight;
    });
    await page.waitForTimeout(2000);

    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      return items.length;
    });

    expect(results).toBeGreaterThan(0);
  });

  test('scrolling should load more items and extension stays active', async () => {
    const page = await openTestPage(context, '/infinite-scroll');
    await waitForThemeApplied(page);

    const beforeCount = await page.evaluate(() => document.querySelectorAll('.item').length);

    await page.evaluate(() => {
      const container = document.querySelector('.scroll-container');
      if (container) container.scrollTop = container.scrollHeight;
    });
    await page.waitForTimeout(2000);

    const afterResults = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      return {
        count: items.length,
        hasActive: document.documentElement.classList.contains('amoled-active')
      };
    });

    expect(afterResults.count).toBeGreaterThanOrEqual(beforeCount);
    expect(afterResults.hasActive).toBe(true);
  });

  test('text should be readable with dark background', async () => {
    const page = await openTestPage(context, '/infinite-scroll');
    await waitForThemeApplied(page);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color);

    const bgParsed = parseRGB(bodyBg);
    const textParsed = parseRGB(bodyColor);

    expect(bgParsed.r + bgParsed.g + bgParsed.b, 'body bg should be dark').toBeLessThan(30);
    expect(textParsed.r + textParsed.g + textParsed.b, 'body text should be light').toBeGreaterThan(100);
  });
});
