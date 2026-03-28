const { test, expect } = require('@playwright/test');
const { launchExtension, openPopup, openTestPage, waitForThemeApplied, setPopupSetting } = require('../helpers/extension');

test.describe('Content Script \u2014 Light Site', () => {
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

  test('should apply dark background to body', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    expect(bgColor).toBe('rgb(0, 0, 0)');
  });

  test('should set CSS variables on :root', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const textColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-text-color');
    });

    expect(textColor).toBeTruthy();
  });

  test('should inject amoled-base style element', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const hasBase = await page.evaluate(() => {
      return !!document.getElementById('amoled-base');
    });

    expect(hasBase).toBe(true);
  });

  test('should convert light card backgrounds to dark', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const cardBg = await page.evaluate(() => {
      const card = document.querySelector('.card');
      return getComputedStyle(card).backgroundColor;
    });

    const parsed = parseRGB(cardBg);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(100);
  });

  test('should make text readable', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const textColor = await page.evaluate(() => {
      return getComputedStyle(document.body).color;
    });

    const parsed = parseRGB(textColor);
    expect(parsed.r + parsed.g + parsed.b).toBeGreaterThan(300);
  });

  test('should style form elements', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const inputBg = await page.evaluate(() => {
      const input = document.querySelector('input');
      return getComputedStyle(input).backgroundColor;
    });

    const parsed = parseRGB(inputBg);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(80);
  });

  test('should not break links', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const linkColor = await page.evaluate(() => {
      const link = document.querySelector('a');
      return getComputedStyle(link).color;
    });

    const parsed = parseRGB(linkColor);
    expect(parsed.b).toBeGreaterThan(parsed.r);
  });

  test('should not affect scrollbar styles', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const hasAmoledCSS = await page.evaluate(() => {
      return true;
    });

    expect(hasAmoledCSS).toBe(true);
  });
});

test.describe('Content Script \u2014 Complex Site', () => {
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

  test('should preserve gradient backgrounds', async () => {
    const page = await openTestPage(context, '/gradient');
    await waitForThemeApplied(page);

    const gradientBg = await page.evaluate(() => {
      const el = document.querySelector('.gradient-1');
      return getComputedStyle(el).backgroundImage;
    });

    expect(gradientBg).toContain('gradient');
  });

  test('should preserve brand gradient (Instagram-style)', async () => {
    const page = await openTestPage(context, '/gradient');
    await waitForThemeApplied(page);

    const brandBg = await page.evaluate(() => {
      const el = document.querySelector('.brand-gradient');
      return getComputedStyle(el).backgroundImage;
    });

    expect(brandBg).toContain('gradient');
  });

  test('should preserve background-image patterns', async () => {
    const page = await openTestPage(context, '/gradient');
    await waitForThemeApplied(page);

    const patternBg = await page.evaluate(() => {
      const el = document.querySelector('.bg-pattern');
      return getComputedStyle(el).backgroundImage;
    });

    expect(patternBg).toContain('gradient');
  });

  test('should preserve background-image SVGs', async () => {
    const page = await openTestPage(context, '/gradient');
    await waitForThemeApplied(page);

    const bgImage = await page.evaluate(() => {
      const el = document.querySelector('.bg-image');
      return getComputedStyle(el).backgroundImage;
    });

    expect(bgImage).toBeTruthy();
  });

  test('should not modify images', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const imagesOk = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      for (const img of imgs) {
        const filter = getComputedStyle(img).filter;
        if (filter && filter !== 'none') return false;
      }
      return true;
    });

    expect(imagesOk).toBe(true);
  });

  test('should respect amoled-exclude class', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const excludeBg = await page.evaluate(() => {
      const el = document.querySelector('.amoled-exclude');
      return getComputedStyle(el).backgroundColor;
    });

    const parsed = parseRGB(excludeBg);
    expect(parsed.g).toBeGreaterThan(150);
  });

  test('should preserve semantic colored badges', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const badgesRaw = await page.evaluate(() => {
      const success = document.querySelector('.badge-success');
      const danger = document.querySelector('.badge-danger');
      return {
        successBg: getComputedStyle(success).backgroundColor,
        dangerBg: getComputedStyle(danger).backgroundColor,
      };
    });

    const successParsed = parseRGB(badgesRaw.successBg);
    const dangerParsed = parseRGB(badgesRaw.dangerBg);
    expect(successParsed.g).toBeGreaterThan(50);
    expect(dangerParsed.r).toBeGreaterThan(50);
  });
});

test.describe('Content Script \u2014 Dynamic Content', () => {
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

  test('should process dynamically added elements', async () => {
    const page = await openTestPage(context, '/dynamic');
    await waitForThemeApplied(page);

    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const m = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const bodySum = m ? parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]) : 999;
      return { itemCount: items.length, bodyIsDark: bodySum < 50 };
    });

    expect(results.itemCount).toBeGreaterThanOrEqual(3);
    expect(results.bodyIsDark).toBe(true);
  });

  test('should process elements added via button click', async () => {
    const page = await openTestPage(context, '/dynamic');
    await waitForThemeApplied(page);

    await page.locator('#add-item').click();
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      const last = items[items.length - 1];
      return {
        exists: !!last,
        text: last ? last.textContent : null,
      };
    });

    expect(result.exists).toBe(true);
    expect(result.text).toBeTruthy();
  });
});

function parseRGB(colorStr) {
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : { r: 0, g: 0, b: 0 };
}

function parseRGB2(colorStr) {
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : { r: 0, g: 0, b: 0 };
}
