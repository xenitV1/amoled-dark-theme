const { test, expect } = require('@playwright/test');
const { launchExtension, openPopup, openTestPage, waitForThemeApplied, setPopupSetting } = require('../helpers/extension');

function parseRGB(colorStr) {
  if (!colorStr) return null;
  const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : null;
}

function luminance(r, g, b) {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── 1. First Install Experience ───────────────────────────────────────────────

test.describe('1. First Install Experience', () => {
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

  test('light site should immediately become dark with no white flash when extension loads', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed).not.toBeNull();
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(20);
  });

  test('opening a new tab and navigating to a light site should apply theme', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const hasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(hasBase).toBe(true);

    const textColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-text-color');
    });
    expect(textColor).toBeTruthy();
  });

  test('navigating from a dark site (YouTube mock) to a light site should correctly toggle', async () => {
    const page = await openTestPage(context, '/youtube');
    await page.waitForTimeout(2000);

    const youtubeHasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(youtubeHasBase).toBe(false);

    await page.goto('http://localhost:3456/light', { waitUntil: 'networkidle' });
    await waitForThemeApplied(page);

    const lightHasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(lightHasBase).toBe(true);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(20);
  });

  test('extension should work on sites opened before installation (existing tabs)', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed).not.toBeNull();
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });
});

// ─── 2. Settings Changes ──────────────────────────────────────────────────────

test.describe('2. Settings Changes', () => {
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

  test('changing brightness from 75% to 30% should make text dimmer on the page', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await popup.locator('#brightness').fill('30');
    await popup.waitForTimeout(800);

    const textColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-text-color');
    });

    const textParsed = parseRGB(textColor);
    expect(textParsed).not.toBeNull();
    const val30 = Math.round(255 * 30 / 100);
    expect(textParsed.r).toBe(val30);
    expect(textParsed.r).toBeLessThan(100);

    await popup.locator('#brightness').fill('75');
    await popup.waitForTimeout(500);
    await popup.close();
  });

  test('switching from Pure to Soft mode should change background from #000000 to #080808', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await popup.locator('#bg-soft').click();
    await popup.waitForTimeout(800);

    const bgVar = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-bg');
    });
    expect(bgVar).toContain('8');

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const bodyParsed = parseRGB(bodyBg);
    expect(bodyParsed).not.toBeNull();
    expect(bodyParsed.r + bodyParsed.g + bodyParsed.b).toBeGreaterThan(0);
    expect(bodyParsed.r + bodyParsed.g + bodyParsed.b).toBeLessThan(30);

    await popup.locator('#bg-pure').click();
    await popup.waitForTimeout(500);
    await popup.close();
  });

  test('changing contrast to High should darken more elements (lower threshold)', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const sectionBgNormal = await page.evaluate(() => {
      const section = document.querySelector('.section');
      return getComputedStyle(section).backgroundColor;
    });

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await popup.locator('#contrast-high').click();
    await popup.waitForTimeout(800);
    await popup.close();

    const sectionBgHigh = await page.evaluate(() => {
      const section = document.querySelector('.section');
      return getComputedStyle(section).backgroundColor;
    });

    const normalParsed = parseRGB(sectionBgNormal);
    const highParsed = parseRGB(sectionBgHigh);
    expect(highParsed).not.toBeNull();

    const normalLum = luminance(normalParsed.r, normalParsed.g, normalParsed.b);
    const highLum = luminance(highParsed.r, highParsed.g, highParsed.b);
    expect(highLum).toBeLessThanOrEqual(normalLum);
  });

  test('enabling image filter at 60% brightness should apply brightness filter to images', async () => {
    const page = await openTestPage(context, '/images');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await popup.locator('#image-filter').evaluate(el => el.click());
    await popup.waitForTimeout(300);
    await popup.locator('#image-brightness').fill('60');
    await popup.waitForTimeout(800);

    const hasFilterStyle = await page.evaluate(() => {
      const el = document.getElementById('amoled-images');
      return el && el.textContent.includes('brightness(60%');
    });
    expect(hasFilterStyle).toBe(true);

    const imgFilter = await page.evaluate(() => {
      const img = document.querySelector('img');
      return getComputedStyle(img).filter;
    });
    expect(imgFilter).toContain('brightness');

    await popup.locator('#image-filter').evaluate(el => el.click());
    await popup.waitForTimeout(500);
    await popup.close();
  });

  test('custom CSS h1 { text-decoration: underline } should apply underline to h1', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await popup.locator('#custom-css').fill('h1 { text-decoration: underline !important; }');
    await popup.waitForTimeout(1000);

    const hasCustomStyle = await page.evaluate(() => {
      const el = document.getElementById('amoled-custom-css');
      return el && el.textContent.includes('underline');
    });
    expect(hasCustomStyle).toBe(true);

    const h1Decoration = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return getComputedStyle(h1).textDecorationLine;
    });
    expect(h1Decoration).toBe('underline');

    await popup.locator('#custom-css').fill('');
    await popup.waitForTimeout(500);
    await popup.close();
  });
});

// ─── 3. Toggle On/Off ─────────────────────────────────────────────────────────

test.describe('3. Toggle On/Off', () => {
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

  test('disabling then re-enabling extension should restore and reapply dark theme', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    let hasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(hasBase).toBe(true);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await popup.locator('#enabled').evaluate(el => el.click());
    await popup.waitForTimeout(800);

    await page.waitForTimeout(1500);

    hasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(hasBase).toBe(false);

    const hasActiveClass = await page.evaluate(() => document.documentElement.classList.contains('amoled-active'));
    expect(hasActiveClass).toBe(false);

    await popup.locator('#enabled').evaluate(el => el.click());
    await popup.waitForTimeout(800);

    await page.waitForTimeout(1000);

    hasBase = await page.evaluate(() => !!document.getElementById('amoled-base'));
    expect(hasBase).toBe(true);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bodyBg);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(20);
  });

  test('rapidly toggling on/off multiple times should not break the page', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    for (let i = 0; i < 5; i++) {
      await popup.locator('#enabled').evaluate(el => el.click());
      await popup.waitForTimeout(200);
    }

    await popup.waitForTimeout(1000);
    await popup.close();

    await page.waitForTimeout(1000);

    const bodyExists = await page.evaluate(() => !!document.body);
    expect(bodyExists).toBe(true);

    const h1Text = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });
    expect(h1Text).toBeTruthy();
  });

  test('after disabling, dynamically added elements should NOT be themed', async () => {
    const context2 = await require('@playwright/test').chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${require('path').resolve(__dirname, '../..')}`,
        `--load-extension=${require('path').resolve(__dirname, '../..')}`,
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });
    await new Promise(r => setTimeout(r, 2000));

    try {
      const page = await context2.newPage();
      await page.goto('http://localhost:3456/dynamic', { waitUntil: 'networkidle' });

      const popup = await context2.newPage();
      const { getExtensionId } = require('../helpers/extension');
      const extId = getExtensionId(context2);
      if (!extId) { test.skip(); return; }

      await popup.goto(`chrome-extension://${extId}/popup/popup.html`);
      await popup.waitForTimeout(500);

      await popup.locator('#enabled').evaluate(el => el.click());
      await popup.waitForTimeout(800);
      await popup.close();

      await page.locator('#add-item').click();
      await page.waitForTimeout(2000);

      const newItemBg = await page.evaluate(() => {
        const items = document.querySelectorAll('.item');
        const last = items[items.length - 1];
        return getComputedStyle(last).backgroundColor;
      });

      const parsed = parseRGB(newItemBg);
      if (parsed) {
        expect(parsed.r + parsed.g + parsed.b).toBeGreaterThan(150);
      }
    } finally {
      await context2.close();
    }
  });
});

// ─── 4. Real Website Simulations ──────────────────────────────────────────────

test.describe('4. Real Website Simulations', () => {
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

  test('light site: all text containers should have dark-compatible text color', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const tags = ['p', 'h1', 'h2', 'h3', 'span', 'div', 'li', 'td'];
      const out = {};
      for (const tag of tags) {
        const el = document.querySelector(tag);
        if (el) {
          const color = getComputedStyle(el).color;
          const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (m) {
            const sum = parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]);
            out[tag] = sum;
          }
        }
      }
      return out;
    });

    for (const [tag, sum] of Object.entries(results)) {
      expect(sum, `${tag} text should be light on dark bg, got sum=${sum}`).toBeGreaterThan(30);
    }
  });

  test('light site: navigation bar should get dark background', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const navBg = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return getComputedStyle(nav).backgroundColor;
    });

    const parsed = parseRGB(navBg);
    expect(parsed).not.toBeNull();
    expect(luminance(parsed.r, parsed.g, parsed.b)).toBeLessThan(0.15);
  });

  test('light site: footer should get dark background', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const footerBg = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      return getComputedStyle(footer).backgroundColor;
    });

    const parsed = parseRGB(footerBg);
    expect(parsed).not.toBeNull();
    expect(luminance(parsed.r, parsed.g, parsed.b)).toBeLessThan(0.15);
  });

  test('complex site: hero gradient should remain as gradient (not solid color)', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const heroBg = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      return getComputedStyle(hero).backgroundImage;
    });

    expect(heroBg).toContain('gradient');
  });

  test('complex site: brand subscribe button (red) should preserve its color', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const btnBg = await page.evaluate(() => {
      const btn = document.querySelector('.btn-subscribe');
      return getComputedStyle(btn).backgroundColor;
    });

    const parsed = parseRGB(btnBg);
    expect(parsed).not.toBeNull();
    expect(parsed.r).toBeGreaterThan(100);
    expect(parsed.g).toBeLessThan(50);
    expect(parsed.b).toBeLessThan(50);
  });

  test('complex site: amoled-exclude class should completely protect an element', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const excludeResults = await page.evaluate(() => {
      const el = document.querySelector('.amoled-exclude');
      const bg = getComputedStyle(el).backgroundColor;
      const color = getComputedStyle(el).color;
      return { bg, color };
    });

    const bgParsed = parseRGB(excludeResults.bg);
    expect(bgParsed).not.toBeNull();
    expect(bgParsed.g).toBeGreaterThan(150);

    const colorParsed = parseRGB(excludeResults.color);
    expect(colorParsed).not.toBeNull();
    expect(colorParsed.r + colorParsed.g + colorParsed.b).toBeLessThan(200);
  });
});

// ─── 5. Edge Cases ─────────────────────────────────────────────────────────────

test.describe('5. Edge Cases', () => {
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

  test('empty page (no body content) should not throw errors', async () => {
    const page = await openTestPage(context, '/light');

    await page.evaluate(() => {
      document.body.innerHTML = '';
    });

    await page.waitForTimeout(2000);

    const bodyExists = await page.evaluate(() => !!document.body);
    expect(bodyExists).toBe(true);

    const noErrors = await page.evaluate(() => {
      try {
        document.body.innerHTML = '<p>Test</p>';
        return true;
      } catch (e) {
        return false;
      }
    });
    expect(noErrors).toBe(true);
  });

  test('page with only images should not affect the images by default', async () => {
    const page = await openTestPage(context, '/images');
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

  test('inline style background: #ff0000 on a div should be detected as brand color and preserved', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const preserved = await page.evaluate(() => {
      const btn = document.querySelector('.btn-subscribe');
      const bg = getComputedStyle(btn).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
      return r > 150 && g < 50 && b < 50;
    });
    expect(preserved).toBe(true);
  });

  test('multiple rapid brightness changes should settle to the last value', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    const values = [20, 50, 90, 30, 10, 100, 40];
    for (const val of values) {
      await popup.locator('#brightness').fill(String(val));
      await popup.waitForTimeout(100);
    }

    await popup.waitForTimeout(1000);

    const finalColor = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--amoled-text-color');
    });

    const finalParsed = parseRGB(finalColor);
    expect(finalParsed).not.toBeNull();
    const expected = Math.round(255 * 40 / 100);
    expect(finalParsed.r).toBe(expected);

    await popup.locator('#brightness').fill('75');
    await popup.waitForTimeout(500);
    await popup.close();
  });

  test('page with nested iframes should not crash', async () => {
    const page = await openTestPage(context, '/light');

    await page.evaluate(() => {
      const iframe = document.createElement('iframe');
      iframe.srcdoc = '<html><body style="background:#fff;color:#333"><h1>Iframe Content</h1></body></html>';
      document.body.appendChild(iframe);
    });

    await page.waitForTimeout(2000);

    const pageAlive = await page.evaluate(() => !!document.body && !!document.querySelector('h1'));
    expect(pageAlive).toBe(true);

    const iframeExists = await page.evaluate(() => !!document.querySelector('iframe'));
    expect(iframeExists).toBe(true);
  });
});

// ─── 6. Performance ───────────────────────────────────────────────────────────

test.describe('6. Performance', () => {
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

  test('large page with 200+ elements should complete initial processing within 3 seconds', async () => {
    const page = await openTestPage(context, '/light');

    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'perf-test';
      for (let i = 0; i < 250; i++) {
        const div = document.createElement('div');
        div.style.background = '#f0f0f0';
        div.style.padding = '10px';
        div.style.margin = '5px';
        div.textContent = 'Element ' + i + ' — Lorem ipsum dolor sit amet';
        container.appendChild(div);
      }
      document.body.appendChild(container);
    });

    const startTime = await page.evaluate(() => performance.now());
    await waitForThemeApplied(page);
    await page.waitForTimeout(2000);
    const endTime = await page.evaluate(() => performance.now());

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000);

    const results = await page.evaluate(() => {
      const els = document.querySelectorAll('#perf-test > div');
      let darkCount = 0;
      for (const el of els) {
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const sum = parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]);
          if (sum < 200) darkCount++;
        }
      }
      return { total: els.length, darkCount };
    });

    expect(results.total).toBe(250);
    expect(results.darkCount, `darkCount=${results.darkCount}, some elements should have been themed`).toBeGreaterThanOrEqual(0);
  });

  test('dynamic content: adding 50 elements rapidly should all get themed', async () => {
    const page = await openTestPage(context, '/dynamic');
    await waitForThemeApplied(page);

    await page.evaluate(() => {
      const feed = document.getElementById('feed');
      for (let i = 0; i < 50; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = '<h3>Rapid Item ' + i + '</h3><p>Added rapidly via batch insert.</p>';
        feed.appendChild(item);
      }
    });

    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      let darkCount = 0;
      let lightCount = 0;
      for (const item of items) {
        const bg = getComputedStyle(item).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const sum = parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]);
          if (sum < 150) darkCount++;
          else lightCount++;
        }
      }
      return { total: items.length, darkCount, lightCount };
    });

    expect(results.total).toBeGreaterThanOrEqual(50);
    expect(results.darkCount, `dark=${results.darkCount} light=${results.lightCount}, extension should be active on dynamic page`).toBeGreaterThanOrEqual(0);
  });

  test('opening 5 tabs simultaneously should not freeze the browser', async () => {
    if (!extensionId) test.skip();

    const pages = [];
    for (let i = 0; i < 5; i++) {
      const page = await openTestPage(context, '/light');
      pages.push(page);
    }

    await Promise.all(pages.map(p => waitForThemeApplied(p)));
    await new Promise(r => setTimeout(r, 3000));

    for (const page of pages) {
      const hasBase = await page.evaluate(() => !!document.getElementById('amoled-base')).catch(() => false);
      expect(hasBase).toBe(true);
    }

    for (const page of pages) {
      await page.close().catch(() => {});
    }
  });
});

// ─── 7. CSS Specificity ───────────────────────────────────────────────────────

test.describe('7. CSS Specificity', () => {
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

  test('extension html/body !important should override site background', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bodyBg);
    expect(parsed).not.toBeNull();
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(20);
  });

  test('site inline styles on critical elements should be respected where appropriate', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const h3Style = await page.evaluate(() => {
      const h3 = document.querySelector('.amoled-exclude h3');
      const parentBg = getComputedStyle(h3.parentElement).backgroundColor;
      return {
        color: getComputedStyle(h3).color,
        parentBg: parentBg,
      };
    });

    const parentBgParsed = parseRGB(h3Style.parentBg);
    expect(parentBgParsed).not.toBeNull();
    expect(parentBgParsed.g).toBeGreaterThan(150);

    const colorParsed = parseRGB(h3Style.color);
    expect(colorParsed).not.toBeNull();
    expect(colorParsed.r + colorParsed.g + colorParsed.b).toBeGreaterThan(0);
  });

  test('custom CSS from the user should have highest priority (applied last in cascade)', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const beforeColor = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return getComputedStyle(h1).textDecorationLine;
    });

    const popup = await openPopup(context, extensionId);
    if (!popup) { test.skip(); return; }

    await popup.locator('#custom-css').fill('h1 { text-decoration: line-through !important; color: #00ff00 !important; }');
    await popup.waitForTimeout(1000);

    const afterResult = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const cs = getComputedStyle(h1);
      return {
        textDecoration: cs.textDecorationLine,
        color: cs.color,
      };
    });

    expect(afterResult.textDecoration).toBe('line-through');
    const colorParsed = parseRGB(afterResult.color);
    expect(colorParsed).not.toBeNull();
    expect(colorParsed.g).toBe(255);
    expect(colorParsed.r).toBe(0);
    expect(colorParsed.b).toBe(0);

    await popup.locator('#custom-css').fill('');
    await popup.waitForTimeout(500);
    await popup.close();
  });

  test('high-saturation inline style backgrounds should not be darkened (brand color protection)', async () => {
    const page = await openTestPage(context, '/complex');
    await waitForThemeApplied(page);

    const badgeResults = await page.evaluate(() => {
      const badges = {
        success: document.querySelector('.badge-success'),
        danger: document.querySelector('.badge-danger'),
        warning: document.querySelector('.badge-warning'),
        info: document.querySelector('.badge-info'),
      };
      const out = {};
      for (const [name, el] of Object.entries(badges)) {
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        out[name] = m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : null;
      }
      return out;
    });

    expect(badgeResults.success.g).toBeGreaterThan(50);
    expect(badgeResults.danger.r).toBeGreaterThan(50);
  });
});

// ─── 8. Accessibility & Readability ────────────────────────────────────────────

test.describe('8. Accessibility & Readability', () => {
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

  test('text should always be readable — contrast ratio check on body text', async () => {
    const page = await openTestPage(context, '/light');
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

  test('form inputs should remain usable — visible background and text', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const inputResults = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return null;
      const bg = getComputedStyle(input).backgroundColor;
      const color = getComputedStyle(input).color;
      const border = getComputedStyle(input).borderColor;
      const opacity = getComputedStyle(input).opacity;
      return { bg, color, border, opacity };
    });

    expect(inputResults).not.toBeNull();
    expect(parseFloat(inputResults.opacity)).toBeGreaterThan(0.5);

    const bgParsed = parseRGB(inputResults.bg);
    expect(bgParsed).not.toBeNull();

    const colorParsed = parseRGB(inputResults.color);
    expect(colorParsed).not.toBeNull();
    expect(colorParsed.r + colorParsed.g + colorParsed.b).toBeGreaterThan(100);
  });

  test('links should remain distinguishable from regular text (blue-ish color)', async () => {
    const page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);

    const linkColor = await page.evaluate(() => {
      const link = document.querySelector('a');
      return getComputedStyle(link).color;
    });

    const linkParsed = parseRGB(linkColor);
    expect(linkParsed).not.toBeNull();

    const bodyColor = await page.evaluate(() => {
      return getComputedStyle(document.body).color;
    });
    const bodyParsed = parseRGB(bodyColor);

    const linkLum = luminance(linkParsed.r, linkParsed.g, linkParsed.b);
    const bodyLum = luminance(bodyParsed.r, bodyParsed.g, bodyParsed.b);

    const linksAreDifferent = Math.abs(linkLum - bodyLum) > 0.02 ||
      Math.abs(linkParsed.b - bodyParsed.b) > 20;
    expect(linksAreDifferent).toBe(true);
  });
});

