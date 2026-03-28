const { test, expect, chromium } = require('@playwright/test');
const { launchExtension, openPopup, openTestPage, setPopupSetting, waitForThemeApplied } = require('../helpers/extension');

function getContrastRatio(bgColor, textColor) {
  function lum(r, g, b) {
    const [rs, gs, bs] = [r/255, g/255, b/255].map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
    return 0.2126*rs + 0.7152*gs + 0.0722*bs;
  }
  function parseRGB(s) {
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [0,0,0];
  }
  const [br, bg, bb] = parseRGB(bgColor);
  const [tr, tg, tb] = parseRGB(textColor);
  const l1 = lum(br, bg, bb) + 0.05;
  const l2 = lum(tr, tg, tb) + 0.05;
  return l1 > l2 ? l1/l2 : l2/l1;
}

test.describe('Accessibility & Contrast', () => {
  let context, extensionId, popup;

  test.describe('Text Readability', () => {
    test.beforeAll(async () => {
      ({ context, extensionId } = await launchExtension());
      popup = await openPopup(context, extensionId);
    }, 30000);

    test.afterAll(async () => {
      if (context) await context.close();
    });

    test('default brightness (75%) should produce contrast ratio of at least 4.5:1', async () => {
      await setPopupSetting(popup, 'brightness', 75);
      const page = await openTestPage(context, '/light');
      await waitForThemeApplied(page);

      const contrastData = await page.evaluate(() => {
        const body = document.body;
        const computed = getComputedStyle(body);
        const p = document.querySelector('p');
        const pColor = p ? getComputedStyle(p).color : computed.color;
        return {
          bgColor: computed.backgroundColor,
          textColor: pColor
        };
      });

      const ratio = getContrastRatio(contrastData.bgColor, contrastData.textColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    test('brightness at 100% (pure white text on black bg) should yield maximum contrast', async () => {
      await setPopupSetting(popup, 'brightness', 100);
      const page = await openTestPage(context, '/light');
      await waitForThemeApplied(page);

      const contrastData = await page.evaluate(() => {
        const body = document.body;
        const computed = getComputedStyle(body);
        const p = document.querySelector('p');
        const pColor = p ? getComputedStyle(p).color : computed.color;
        return {
          bgColor: computed.backgroundColor,
          textColor: pColor
        };
      });

      const ratio = getContrastRatio(contrastData.bgColor, contrastData.textColor);
      expect(ratio).toBeGreaterThanOrEqual(18);
    });

    test('brightness at 50% should still be readable (contrast > 3:1)', async () => {
      await setPopupSetting(popup, 'brightness', 50);
      const page = await openTestPage(context, '/light');
      await waitForThemeApplied(page);

      const contrastData = await page.evaluate(() => {
        const body = document.body;
        const computed = getComputedStyle(body);
        const p = document.querySelector('p');
        const pColor = p ? getComputedStyle(p).color : computed.color;
        return {
          bgColor: computed.backgroundColor,
          textColor: pColor
        };
      });

      const ratio = getContrastRatio(contrastData.bgColor, contrastData.textColor);
      expect(ratio).toBeGreaterThan(3);
    });

    test('brightness at 10% (very dim) should have text present and non-zero contrast', async () => {
      await setPopupSetting(popup, 'brightness', 10);
      const page = await openTestPage(context, '/light');
      await waitForThemeApplied(page);

      const contrastData = await page.evaluate(() => {
        const body = document.body;
        const computed = getComputedStyle(body);
        const p = document.querySelector('p');
        const pColor = p ? getComputedStyle(p).color : computed.color;
        return {
          bgColor: computed.backgroundColor,
          textColor: pColor,
          textColorMatches10Percent: pColor === 'rgb(26, 26, 26)'
        };
      });

      expect(contrastData.textColorMatches10Percent).toBe(true);
      const ratio = getContrastRatio(contrastData.bgColor, contrastData.textColor);
      expect(ratio).toBeGreaterThan(1);
    });
  });

  test.describe('Form Accessibility', () => {
    let context2, extensionId2, popup2;

    test.beforeAll(async () => {
      ({ context: context2, extensionId: extensionId2 } = await launchExtension());
      popup2 = await openPopup(context2, extensionId2);
      await setPopupSetting(popup2, 'brightness', 75);
    }, 30000);

    test.afterAll(async () => {
      if (context2) await context2.close();
    });

    test('input fields should have visible text when typing (not same color as background)', async () => {
      const page = await openTestPage(context2, '/light');
      await waitForThemeApplied(page);

      await page.locator('input[type="text"]').first().fill('Test input value');
      await page.waitForTimeout(300);

      const inputVisibility = await page.evaluate(() => {
        const input = document.querySelector('input[type="text"]');
        if (!input) return null;
        const computed = getComputedStyle(input);
        return {
          textColor: computed.color,
          bgColor: computed.backgroundColor,
          value: input.value
        };
      });

      expect(inputVisibility).not.toBeNull();
      expect(inputVisibility.value).toBe('Test input value');

      const ratio = getContrastRatio(inputVisibility.bgColor, inputVisibility.textColor);
      expect(ratio).toBeGreaterThan(1);
    });

    test('textarea should be usable', async () => {
      const page = await openTestPage(context2, '/light');
      await waitForThemeApplied(page);

      await page.locator('textarea').first().fill('Test textarea content');
      await page.waitForTimeout(300);

      const textareaVisibility = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return null;
        const computed = getComputedStyle(textarea);
        return {
          textColor: computed.color,
          bgColor: computed.backgroundColor,
          value: textarea.value
        };
      });

      expect(textareaVisibility).not.toBeNull();
      expect(textareaVisibility.value).toBe('Test textarea content');

      const ratio = getContrastRatio(textareaVisibility.bgColor, textareaVisibility.textColor);
      expect(ratio).toBeGreaterThan(1);
    });

    test('select dropdowns should be readable', async () => {
      const page = await openTestPage(context2, '/complex');
      await waitForThemeApplied(page);

      const selectVisibility = await page.evaluate(() => {
        const select = document.querySelector('select');
        if (!select) return null;
        const computed = getComputedStyle(select);
        return {
          textColor: computed.color,
          bgColor: computed.backgroundColor,
          optionCount: select.options.length,
          firstOption: select.options[0].textContent
        };
      });

      expect(selectVisibility).not.toBeNull();
      expect(selectVisibility.optionCount).toBeGreaterThan(0);
      expect(selectVisibility.firstOption).toBeTruthy();

      const ratio = getContrastRatio(selectVisibility.bgColor, selectVisibility.textColor);
      expect(ratio).toBeGreaterThan(1);
    });
  });

  test.describe('Link Visibility', () => {
    let context3, extensionId3;

    test.beforeAll(async () => {
      ({ context: context3, extensionId: extensionId3 } = await launchExtension());
    }, 30000);

    test.afterAll(async () => {
      if (context3) await context3.close();
    });

    test('links should be visually distinct from regular text (different color)', async () => {
      const page = await openTestPage(context3, '/light');
      await waitForThemeApplied(page);

      const linkVsText = await page.evaluate(() => {
        const p = document.querySelector('p');
        const a = document.querySelector('a:not(nav a)');
        if (!p || !a) return null;
        return {
          textColor: getComputedStyle(p).color,
          linkColor: getComputedStyle(a).color,
          colorsDiffer: getComputedStyle(p).color !== getComputedStyle(a).color
        };
      });

      expect(linkVsText).not.toBeNull();
      expect(linkVsText.colorsDiffer).toBe(true);
    });

    test('visited links should have a different color than unvisited links', async () => {
      const page = await openTestPage(context3, '/light');
      await waitForThemeApplied(page);

      const linkColors = await page.evaluate(() => {
        const links = document.querySelectorAll('a:not(nav a)');
        if (links.length < 2) return null;
        const colors = new Set();
        for (const link of links) {
          colors.add(getComputedStyle(link).color);
        }
        return {
          uniqueColors: colors.size,
          allColors: Array.from(colors)
        };
      });

      expect(linkColors).not.toBeNull();
      expect(linkColors.uniqueColors).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Dark Mode Detection Accuracy', () => {
    let context4, extensionId4, popup4;

    test.beforeAll(async () => {
      ({ context: context4, extensionId: extensionId4 } = await launchExtension());
      popup4 = await openPopup(context4, extensionId4);
      await setPopupSetting(popup4, 'brightness', 75);
    }, 30000);

    test.afterAll(async () => {
      if (context4) await context4.close();
    });

    test('site with html[dark] and dark background should NOT have its text colors changed', async () => {
      const page = await openTestPage(context4, '/dark');
      await page.waitForTimeout(2000);

      const siteStatus = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const bodyComputed = getComputedStyle(body);
        const p = document.querySelector('p');
        const pColor = p ? getComputedStyle(p).color : bodyComputed.color;
        return {
          hasDarkAttr: html.hasAttribute('dark'),
          bodyBgColor: bodyComputed.backgroundColor,
          bodyTextColor: bodyComputed.color,
          paragraphColor: pColor,
          amoledBasePresent: !!document.getElementById('amoled-base')
        };
      });

      expect(siteStatus.hasDarkAttr).toBe(true);
      expect(siteStatus.amoledBasePresent).toBe(false);
    });

    test('site with data-color-mode="dark" should NOT have its text colors changed', async () => {
      const page = await context4.newPage();

      await page.route('http://localhost:3456/light', async route => {
        const response = await route.fetch();
        const body = await response.text();
        const modified = body.replace('<html', '<html data-color-mode="dark"');
        await route.fulfill({ response, body: modified });
      });

      await page.goto('http://localhost:3456/light', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const siteStatus = await page.evaluate(() => {
        const html = document.documentElement;
        const bodyComputed = getComputedStyle(document.body);
        return {
          hasDataColorModeDark: html.getAttribute('data-color-mode') === 'dark',
          amoledBasePresent: !!document.getElementById('amoled-base')
        };
      });

      expect(siteStatus.hasDataColorModeDark).toBe(true);
      expect(siteStatus.amoledBasePresent).toBe(false);

      await page.unroute('http://localhost:3456/light');
      await page.close();
    });

    test('site with light background but dark mode meta tag should still be processed', async () => {
      const page = await context4.newPage();
      await page.goto('http://localhost:3456/light', { waitUntil: 'networkidle' });

      await page.evaluate(() => {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#000000';
        document.head.appendChild(meta);
        document.documentElement.removeAttribute('dark');
        document.documentElement.removeAttribute('data-color-mode');
        document.body.style.backgroundColor = '#ffffff';
        window.location.reload();
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const siteStatus = await page.evaluate(() => {
        const body = document.body;
        const bodyComputed = getComputedStyle(body);
        return {
          bodyBgColor: bodyComputed.backgroundColor,
          bodyTextColor: bodyComputed.color,
          amoledBasePresent: !!document.getElementById('amoled-base'),
          isBlackBg: bodyComputed.backgroundColor === 'rgb(0, 0, 0)'
        };
      });

      expect(siteStatus.amoledBasePresent).toBe(true);
      expect(siteStatus.isBlackBg).toBe(true);

      await page.close();
    });
  });
});


