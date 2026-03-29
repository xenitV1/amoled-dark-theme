const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied } = require('../helpers/extension');
const { parseRGB, luminance } = require('../helpers/color-utils');

test.describe('CSS Grid Layout', () => {
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

  test('body should have dark background', async () => {
    const page = await openTestPage(context, '/grid-layout');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed).not.toBeNull();
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });

  test('grid cards with light backgrounds should be darkened', async () => {
    const page = await openTestPage(context, '/grid-layout');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card:not(.blue):not(.green):not(.yellow)');
      const out = [];
      for (const card of cards) {
        const bg = getComputedStyle(card).backgroundColor;
        out.push(bg);
      }
      return out;
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        const lum = luminance(parsed.r, parsed.g, parsed.b);
        expect(lum, `Card bg ${bg} should be dark`).toBeLessThan(0.3);
      }
    }
  });

  test('brand-colored active sidebar item should preserve saturated color', async () => {
    const page = await openTestPage(context, '/grid-layout');
    await waitForThemeApplied(page);

    const activeItemBg = await page.evaluate(() => {
      const active = document.querySelector('.sidebar-item.active');
      return active ? getComputedStyle(active).backgroundColor : null;
    });

    const parsed = parseRGB(activeItemBg);
    expect(parsed).not.toBeNull();
    expect(parsed.b, 'Active sidebar item (#007bff) should retain blue channel').toBeGreaterThan(200);
    expect(parsed.r, 'Active sidebar item should have low red').toBeLessThan(50);
  });

  test('sidebar should be darkened', async () => {
    const page = await openTestPage(context, '/grid-layout');
    await waitForThemeApplied(page);

    const sidebarBg = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      return getComputedStyle(sidebar).backgroundColor;
    });
    const parsed = parseRGB(sidebarBg);
    expect(luminance(parsed.r, parsed.g, parsed.b)).toBeLessThan(0.2);
  });
});

test.describe('Flexbox SPA Layout', () => {
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

  test('body should be dark', async () => {
    const page = await openTestPage(context, '/flexbox-spa');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });

  test('received chat bubbles with light backgrounds should be themed', async () => {
    const page = await openTestPage(context, '/flexbox-spa');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const messages = document.querySelectorAll('.message.received');
      return Array.from(messages).map(m => getComputedStyle(m).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        expect(luminance(parsed.r, parsed.g, parsed.b), `Received bubble bg ${bg} should be dark`).toBeLessThan(0.35);
      }
    }
  });

  test('sidebar should be dark', async () => {
    const page = await openTestPage(context, '/flexbox-spa');
    await waitForThemeApplied(page);

    const sidebarBg = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      return getComputedStyle(sidebar).backgroundColor;
    });
    const parsed = parseRGB(sidebarBg);
    expect(luminance(parsed.r, parsed.g, parsed.b)).toBeLessThan(0.2);
  });

  test('sent message brand color should be preserved', async () => {
    const page = await openTestPage(context, '/flexbox-spa');
    await waitForThemeApplied(page);

    const sentBg = await page.evaluate(() => {
      const sent = document.querySelector('.message.sent');
      return getComputedStyle(sent).backgroundColor;
    });
    const parsed = parseRGB(sentBg);
    expect(parsed.b, 'Sent bubble should retain blue channel').toBeGreaterThan(100);
  });
});

test.describe('Fixed/Sticky Elements', () => {
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

  test('fixed header should have dark background', async () => {
    const page = await openTestPage(context, '/fixed-overlay');
    await waitForThemeApplied(page);

    const headerBg = await page.evaluate(() => {
      const header = document.querySelector('.fixed-header');
      return getComputedStyle(header).backgroundColor;
    });
    const parsed = parseRGB(headerBg);
    expect(luminance(parsed.r, parsed.g, parsed.b), 'Fixed header should be dark').toBeLessThan(0.2);
  });

  test('modal overlay should still function', async () => {
    const page = await openTestPage(context, '/fixed-overlay');
    await waitForThemeApplied(page);

    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('.modal-overlay');
      const style = getComputedStyle(modal);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    expect(modalVisible, 'Modal overlay should be visible').toBe(true);
  });

  test('toast notifications should be visible', async () => {
    const page = await openTestPage(context, '/fixed-overlay');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const toasts = document.querySelectorAll('.toast');
      return Array.from(toasts).map(t => {
        const style = getComputedStyle(t);
        return {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
        };
      });
    });

    for (const t of results) {
      expect(t.opacity, 'Toast should not be transparent').not.toBe('0');
      expect(t.visibility, 'Toast should not be hidden').not.toBe('hidden');
    }
  });

  test('tooltips should have readable text', async () => {
    const page = await openTestPage(context, '/fixed-overlay');
    await waitForThemeApplied(page);

    const tooltipResults = await page.evaluate(() => {
      const tooltips = document.querySelectorAll('.tooltip');
      return Array.from(tooltips).map(t => {
        const style = getComputedStyle(t);
        return {
          color: style.color,
          bgColor: style.backgroundColor,
          visibility: style.visibility,
        };
      });
    });

    for (const t of tooltipResults) {
      const colorParsed = parseRGB(t.color);
      expect(colorParsed.r + colorParsed.g + colorParsed.b, 'Tooltip text should be readable').toBeGreaterThan(30);
    }
  });
});

test.describe('RTL Layout', () => {
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

  test('body should be dark', async () => {
    const page = await openTestPage(context, '/rtl');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });

  test('text should be readable with sufficient contrast', async () => {
    const page = await openTestPage(context, '/rtl');
    await waitForThemeApplied(page);

    const contrastOk = await page.evaluate(() => {
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
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const bodyColor = getComputedStyle(document.body).color;
      const [br, bg, bb] = parseRGB(bodyBg);
      const [tr, tg, tb] = parseRGB(bodyColor);
      const bgLum = lum(br, bg, bb);
      const textLum = lum(tr, tg, tb);
      const lighter = Math.max(bgLum, textLum);
      const darker = Math.min(bgLum, textLum);
      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(contrastOk, 'RTL body text should have sufficient contrast').toBeGreaterThanOrEqual(3);
  });

  test('RTL direction should be preserved', async () => {
    const page = await openTestPage(context, '/rtl');
    await waitForThemeApplied(page);

    const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    expect(dir, 'dir="rtl" should be preserved').toBe('rtl');
  });

  test('navigation links should be readable', async () => {
    const page = await openTestPage(context, '/rtl');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const links = document.querySelectorAll('nav a');
      return Array.from(links).map(a => ({
        color: getComputedStyle(a).color,
        bg: getComputedStyle(a.closest('nav')).backgroundColor,
      }));
    });

    for (const r of results) {
      const colorParsed = parseRGB(r.color);
      expect(colorParsed.r + colorParsed.g + colorParsed.b, 'Nav link text should be visible').toBeGreaterThan(50);
    }
  });
});

test.describe('Print Media', () => {
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

  test('extension should apply dark theme to print-media page', async () => {
    const page = await openTestPage(context, '/print-media');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });

  test('print stylesheet declarations should still exist in the page', async () => {
    const page = await openTestPage(context, '/print-media');
    await waitForThemeApplied(page);

    const hasPrintMedia = await page.evaluate(() => {
      const styleSheets = document.styleSheets;
      for (const sheet of styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (const rule of rules) {
            if (rule instanceof CSSMediaRule && rule.media.mediaText.includes('print')) {
              return true;
            }
          }
        } catch (e) {
          continue;
        }
      }
      return false;
    });
    expect(hasPrintMedia, 'Page should still contain @media print rules').toBe(true);
  });
});
