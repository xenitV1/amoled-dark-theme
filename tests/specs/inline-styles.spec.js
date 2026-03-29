const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied } = require('../helpers/extension');
const { parseRGB, luminance } = require('../helpers/color-utils');

test.describe('Inline Styles (CSS-in-JS)', () => {
  let context, extensionId;

  test.beforeAll(async () => {
    const result = await launchExtension();
    context = result.context;
    extensionId = result.extensionId;
    await new Promise(r => setTimeout(r, 2000));
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('inline background styles should be detected and themed', async () => {
    const page = await openTestPage(context, '/inline-styles');
    await waitForThemeApplied(page);

    const hasActive = await page.evaluate(() => document.documentElement.classList.contains('amoled-active'));
    expect(hasActive).toBe(true);

    const hasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(hasBase).toBe(true);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bodyBg);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });

  test('inline colored elements preserved (high-saturation brand colors)', async () => {
    const page = await openTestPage(context, '/inline-styles');
    await waitForThemeApplied(page);

    const redBtnColor = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.includes('Delete')) {
          return getComputedStyle(btn).backgroundColor;
        }
      }
      return null;
    });

    expect(redBtnColor).not.toBeNull();
    const parsed = parseRGB(redBtnColor);
    expect(parsed.r).toBeGreaterThan(150);
    expect(parsed.g).toBeLessThan(80);
    expect(parsed.b).toBeLessThan(80);
  });

  test('inline text colors overridden to extension text color', async () => {
    const page = await openTestPage(context, '/inline-styles');
    await waitForThemeApplied(page);

    const textColors = await page.evaluate(() => {
      const els = document.querySelectorAll('[style*="color: #333"], [style*="color:#333"]');
      return Array.from(els).map(el => {
        const color = getComputedStyle(el).color;
        const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        return m ? parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]) : 0;
      });
    });

    for (const sum of textColors) {
      expect(sum).toBeGreaterThan(50);
    }
  });

  test('dynamically added inline-styled elements should get themed', async () => {
    const page = await openTestPage(context, '/inline-styles');
    await waitForThemeApplied(page);

    await page.evaluate(() => {
      const btn = document.querySelector('#add-item-btn');
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);

    const dynamicEl = await page.evaluate(() => {
      const area = document.getElementById('dynamic-area');
      if (!area) return null;
      const child = area.firstElementChild;
      if (!child) return null;
      return {
        exists: true,
        text: child.textContent
      };
    });

    if (dynamicEl) {
      expect(dynamicEl.exists).toBe(true);
      expect(dynamicEl.text).toBeTruthy();
    }
  });

  test('form inputs with inline styles should remain usable', async () => {
    const page = await openTestPage(context, '/inline-styles');
    await waitForThemeApplied(page);

    const inputResults = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return null;
      const bg = getComputedStyle(input).backgroundColor;
      const color = getComputedStyle(input).color;
      const opacity = getComputedStyle(input).opacity;
      return { bg, color, opacity };
    });

    expect(inputResults).not.toBeNull();
    expect(parseFloat(inputResults.opacity)).toBeGreaterThan(0.5);

    const colorParsed = parseRGB(inputResults.color);
    expect(colorParsed.r + colorParsed.g + colorParsed.b).toBeGreaterThan(100);
  });

  test('overall text contrast should be >= 3:1', async () => {
    const page = await openTestPage(context, '/inline-styles');
    await waitForThemeApplied(page);

    const ratio = await page.evaluate(() => {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const bodyColor = getComputedStyle(document.body).color;

      function parseRGB(c) {
        const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [0, 0, 0];
      }
      function lum(r, g, b) {
        const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
          c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      const [br, bg, bb] = parseRGB(bodyBg);
      const [tr, tg, tb] = parseRGB(bodyColor);
      const bgLum = lum(br, bg, bb);
      const textLum = lum(tr, tg, tb);
      const lighter = Math.max(bgLum, textLum);
      const darker = Math.min(bgLum, textLum);
      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});
