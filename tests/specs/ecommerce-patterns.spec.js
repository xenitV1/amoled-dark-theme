const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied, openPopup, setPopupSetting } = require('../helpers/extension');
const { parseRGB, luminance, getContrastRatio } = require('../helpers/color-utils');

test.describe('E-Commerce Patterns', () => {
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

  test('product cards should have dark backgrounds', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const cardBgs = await page.evaluate(() => {
      const cards = document.querySelectorAll('.product-card');
      return Array.from(cards).map(card => getComputedStyle(card).backgroundColor);
    });

    expect(cardBgs.length).toBeGreaterThan(0);
    for (const bg of cardBgs) {
      const parsed = parseRGB(bg);
      expect(parsed.r + parsed.g + parsed.b).toBeLessThan(100);
    }
  });

  test('star ratings should be preserved (gold/yellow)', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const starColors = await page.evaluate(() => {
      const stars = document.querySelectorAll('.star:not(.empty)');
      return Array.from(stars).map(s => getComputedStyle(s).color);
    });

    expect(starColors.length).toBeGreaterThan(0);
    for (const color of starColors) {
      const parsed = parseRGB(color);
      expect(parsed.r + parsed.g).toBeGreaterThan(parsed.b + 50);
      expect(parsed.g).toBeGreaterThan(100);
    }
  });

  test('price text should be readable with good contrast', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const contrastResults = await page.evaluate(() => {
      const prices = document.querySelectorAll('.price');
      return Array.from(prices).map(price => {
        const color = getComputedStyle(price).color;
        const parent = price.closest('.product-info') || price.parentElement;
        const bg = getComputedStyle(parent).backgroundColor;
        return { color, bg };
      });
    });

    for (const r of contrastResults) {
      const ratio = getContrastRatio(r.bg, r.color);
      expect(ratio).toBeGreaterThanOrEqual(2);
    }
  });

  test('discount badges preserved (red)', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const badgeColors = await page.evaluate(() => {
      const badges = document.querySelectorAll('.discount-badge');
      return Array.from(badges).map(b => getComputedStyle(b).backgroundColor);
    });

    expect(badgeColors.length).toBeGreaterThan(0);
    for (const bg of badgeColors) {
      const parsed = parseRGB(bg);
      expect(parsed.r).toBeGreaterThan(150);
      expect(parsed.g).toBeLessThan(80);
      expect(parsed.b).toBeLessThan(80);
    }
  });

  test('cart notification badge should still be red', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const badgeBg = await page.evaluate(() => {
      const badge = document.querySelector('.cart-badge');
      return badge ? getComputedStyle(badge).backgroundColor : null;
    });

    expect(badgeBg).not.toBeNull();
    const parsed = parseRGB(badgeBg);
    expect(parsed.r).toBeGreaterThan(150);
    expect(parsed.g).toBeLessThan(80);
  });

  test('category sidebar should have dark background with readable text', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const sidebarResults = await page.evaluate(() => {
      const sidebar = document.querySelector('.category-sidebar');
      if (!sidebar) return null;
      return {
        bg: getComputedStyle(sidebar).backgroundColor,
        textColor: getComputedStyle(sidebar.querySelector('.category-item')).color
      };
    });

    expect(sidebarResults).not.toBeNull();
    const bgParsed = parseRGB(sidebarResults.bg);
    expect(bgParsed.r + bgParsed.g + bgParsed.b).toBeLessThan(100);

    const textParsed = parseRGB(sidebarResults.textColor);
    expect(textParsed.r + textParsed.g + textParsed.b).toBeGreaterThan(100);
  });

  test('breadcrumbs should be visible and readable', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const breadcrumbResults = await page.evaluate(() => {
      const bc = document.querySelector('.breadcrumb');
      if (!bc) return null;
      return {
        color: getComputedStyle(bc).color,
        display: getComputedStyle(bc).display,
        opacity: getComputedStyle(bc).opacity,
        linkColor: getComputedStyle(bc.querySelector('a')).color
      };
    });

    expect(breadcrumbResults).not.toBeNull();
    expect(breadcrumbResults.display).not.toBe('none');
    expect(parseFloat(breadcrumbResults.opacity)).toBeGreaterThan(0.5);

    const textParsed = parseRGB(breadcrumbResults.color);
    expect(textParsed.r + textParsed.g + textParsed.b).toBeGreaterThan(50);

    const linkParsed = parseRGB(breadcrumbResults.linkColor);
    expect(linkParsed.b).toBeGreaterThan(linkParsed.r);
  });

  test('add-to-cart button should keep its brand color', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const btnBg = await page.evaluate(() => {
      const btn = document.querySelector('.add-to-cart');
      return btn ? getComputedStyle(btn).backgroundColor : null;
    });

    expect(btnBg).not.toBeNull();
    const parsed = parseRGB(btnBg);
    expect(parsed.r).toBeGreaterThan(150);
    expect(parsed.g).toBeGreaterThan(50);
    expect(parsed.b).toBeLessThan(30);
  });

  test('image filter on product images: enable at 60% and disable', async () => {
    const page = await openTestPage(context, '/ecommerce');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await setPopupSetting(popup, 'imageFilter', true);
    await popup.waitForTimeout(300);
    await setPopupSetting(popup, 'imageBrightness', 60);
    await popup.waitForTimeout(800);

    const hasFilterOn = await page.evaluate(() => {
      const el = document.getElementById('amoled-images');
      return el && el.textContent.includes('brightness(60%');
    });
    expect(hasFilterOn).toBe(true);

    await setPopupSetting(popup, 'imageFilter', false);
    await popup.waitForTimeout(800);

    const hasFilterOff = await page.evaluate(() => {
      const el = document.getElementById('amoled-images');
      return !el || !el.textContent.includes('brightness');
    });
    expect(hasFilterOff).toBe(true);

    await popup.close();
  });

  test('overall text contrast should be >= 3:1', async () => {
    const page = await openTestPage(context, '/ecommerce');
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
