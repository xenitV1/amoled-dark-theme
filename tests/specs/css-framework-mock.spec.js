const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied, openPopup, setPopupSetting } = require('../helpers/extension');
const { parseRGB, luminance, getContrastRatio } = require('../helpers/color-utils');

test.describe('Utility Class Backgrounds', () => {
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

  test('elements with bg-white should get dark backgrounds', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card');
      return Array.from(cards).map(c => getComputedStyle(c).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        expect(parsed.r + parsed.g + parsed.b, `Card bg ${bg} should be darkened`).toBeLessThan(200);
      }
    }
  });

  test('elements with bg-gray-100 should get dark backgrounds', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const els = document.querySelectorAll('.bg-gray-100');
      return Array.from(els).map(el => getComputedStyle(el).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        expect(parsed.r + parsed.g + parsed.b, `bg-gray-100 element should be darkened`).toBeLessThan(200);
      }
    }
  });

  test('hero section with bg-gray-100 should be themed', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const heroBg = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      return hero ? getComputedStyle(hero).backgroundColor : null;
    });
    const parsed = parseRGB(heroBg);
    if (parsed) {
      expect(parsed.r + parsed.g + parsed.b, 'Hero section should be darkened').toBeLessThan(200);
    }
  });
});

test.describe('Brand Color Preservation', () => {
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

  test('blue buttons (bg-blue-500/bg-blue-600) should retain their color', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const blues = document.querySelectorAll('.bg-blue-500, .bg-blue-600');
      return Array.from(blues).map(el => getComputedStyle(el).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      expect(parsed.b, `Blue button bg ${bg} should retain blue channel`).toBeGreaterThan(80);
    }
  });

  test('green elements should retain their color', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const greens = document.querySelectorAll('.bg-green-500, .bg-green-600');
      return Array.from(greens).map(el => getComputedStyle(el).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        expect(parsed.g, `Green element bg ${bg} should retain green channel`).toBeGreaterThan(80);
      }
    }
  });
});

test.describe('Text Readability', () => {
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

  test('body text should have sufficient contrast against background', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const colors = await page.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundColor;
      const color = getComputedStyle(document.body).color;
      return { bg, color };
    });

    const ratio = getContrastRatio(colors.bg, colors.color);
    expect(ratio, 'Body text contrast ratio should be >= 3:1').toBeGreaterThanOrEqual(3);
  });

  test('paragraph text in cards should be readable', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.card p');
      return Array.from(paragraphs).map(p => {
        const color = getComputedStyle(p).color;
        const parent = p.closest('.card');
        const bg = parent ? getComputedStyle(parent).backgroundColor : null;
        return { color, bg };
      });
    });

    for (const r of results) {
      const textParsed = parseRGB(r.color);
      expect(textParsed.r + textParsed.g + textParsed.b, 'Card text should be light/readable').toBeGreaterThan(30);
    }
  });
});

test.describe('Cards and Pricing Table', () => {
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

  test('pricing card backgrounds should be dark', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const cards = document.querySelectorAll('.pricing-card');
      return Array.from(cards).map(c => getComputedStyle(c).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        expect(parsed.r + parsed.g + parsed.b, `Pricing card bg ${bg} should be darkened`).toBeLessThan(200);
      }
    }
  });

  test('pricing amounts should be readable', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const amounts = await page.evaluate(() => {
      const prices = document.querySelectorAll('.pricing-card .text-4xl');
      return Array.from(prices).map(p => getComputedStyle(p).color);
    });

    for (const color of amounts) {
      const parsed = parseRGB(color);
      expect(parsed.r + parsed.g + parsed.b, 'Price text should be readable').toBeGreaterThan(50);
    }
  });

  test('feature comparison table should be themed', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const tableBg = await page.evaluate(() => {
      const table = document.querySelector('.pricing-table');
      return getComputedStyle(table).backgroundColor;
    });
    const parsed = parseRGB(tableBg);
    if (parsed) {
      expect(parsed.r + parsed.g + parsed.b, 'Table background should be darkened').toBeLessThan(200);
    }
  });
});

test.describe('Settings Integration', () => {
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

  test('changing brightness to 50% should update text color on framework page', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await setPopupSetting(popup, 'brightness', 50);
    await popup.waitForTimeout(800);

    const textColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-text-color');
    });

    const parsed = parseRGB(textColor);
    expect(parsed).not.toBeNull();
    const expected = Math.round(255 * 50 / 100);
    expect(parsed.r, `Text color R should be ~${expected} at 50% brightness`).toBe(expected);

    await setPopupSetting(popup, 'brightness', 75);
    await popup.waitForTimeout(500);
    await popup.close();
  });
});

test.describe('Navbar and Footer', () => {
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

  test('navbar should have dark background', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const navBg = await page.evaluate(() => {
      const nav = document.querySelector('.nav');
      return getComputedStyle(nav).backgroundColor;
    });
    const parsed = parseRGB(navBg);
    expect(luminance(parsed.r, parsed.g, parsed.b), 'Navbar should have dark background').toBeLessThan(0.2);
  });

  test('navbar text should be readable', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const links = document.querySelectorAll('.nav a');
      return Array.from(links).map(a => getComputedStyle(a).color);
    });

    for (const color of results) {
      const parsed = parseRGB(color);
      expect(parsed.r + parsed.g + parsed.b, 'Nav link text should be readable').toBeGreaterThan(30);
    }
  });

  test('footer should have dark background with readable text', async () => {
    const page = await openTestPage(context, '/framework');
    await waitForThemeApplied(page);

    const footerBg = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      return getComputedStyle(footer).backgroundColor;
    });
    const parsed = parseRGB(footerBg);
    expect(luminance(parsed.r, parsed.g, parsed.b), 'Footer should have dark background').toBeLessThan(0.15);

    const footerLinkColor = await page.evaluate(() => {
      const link = document.querySelector('.footer a');
      return getComputedStyle(link).color;
    });
    const linkParsed = parseRGB(footerLinkColor);
    expect(linkParsed.r + linkParsed.g + linkParsed.b, 'Footer links should be readable').toBeGreaterThan(50);
  });
});
