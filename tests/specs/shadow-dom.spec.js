const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied } = require('../helpers/extension');
const { parseRGB } = require('../helpers/color-utils');

test.describe('Shadow DOM - Light DOM Elements', () => {
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

  test('light DOM elements with light backgrounds should get dark backgrounds', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const cards = document.querySelectorAll('.light-card');
      return Array.from(cards).map(card => getComputedStyle(card).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        expect(parsed.r + parsed.g + parsed.b, `Light card bg ${bg} should be darkened`).toBeLessThan(200);
      }
    }
  });

  test('light DOM navigation should be themed', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const navBg = await page.evaluate(() => {
      const nav = document.querySelector('.light-nav');
      return getComputedStyle(nav).backgroundColor;
    });
    const parsed = parseRGB(navBg);
    expect(parsed.r + parsed.g + parsed.b, 'Light nav should be darkened').toBeLessThan(150);
  });

  test('light DOM section headings should be readable', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const headingColors = await page.evaluate(() => {
      const headings = document.querySelectorAll('.light-section h2');
      return Array.from(headings).map(h => getComputedStyle(h).color);
    });

    for (const color of headingColors) {
      const parsed = parseRGB(color);
      expect(parsed.r + parsed.g + parsed.b, 'Section heading should be light/readable').toBeGreaterThan(50);
    }
  });
});

test.describe('Shadow DOM - Shadow Root Behavior', () => {
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

  test('open shadow DOM elements should not crash the page', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const pageAlive = await page.evaluate(() => !!document.body);
    expect(pageAlive).toBe(true);
  });

  test('closed shadow DOM elements should not crash the page', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const closedWidgetExists = await page.evaluate(() => {
      return !!document.querySelector('closed-widget');
    });
    expect(closedWidgetExists).toBe(true);
  });

  test('shadow DOM custom elements should render without errors', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const elementCounts = await page.evaluate(() => {
      return {
        userCards: document.querySelectorAll('custom-user-card').length,
        notifPanel: document.querySelectorAll('custom-notification-panel').length,
        closedWidget: document.querySelectorAll('closed-widget').length,
        counter: document.querySelectorAll('custom-counter').length,
      };
    });

    expect(elementCounts.userCards).toBeGreaterThanOrEqual(1);
    expect(elementCounts.notifPanel).toBeGreaterThanOrEqual(1);
    expect(elementCounts.closedWidget).toBeGreaterThanOrEqual(1);
    expect(elementCounts.counter).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Shadow DOM - Page Stability', () => {
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

  test('body background should be dark', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bgColor);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(30);
  });

  test('regular elements outside shadow DOM should be themed', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const results = await page.evaluate(() => {
      const sections = document.querySelectorAll('.light-section');
      return Array.from(sections).map(s => getComputedStyle(s).backgroundColor);
    });

    for (const bg of results) {
      const parsed = parseRGB(bg);
      if (parsed) {
        expect(parsed.r + parsed.g + parsed.b, `Light section bg ${bg} should be darkened`).toBeLessThan(200);
      }
    }
  });

  test('page h1 title should be readable', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const h1Color = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return getComputedStyle(h1).color;
    });
    const parsed = parseRGB(h1Color);
    expect(parsed.r + parsed.g + parsed.b, 'H1 should be readable').toBeGreaterThan(50);
  });
});

test.describe('Shadow DOM - Content Visibility', () => {
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

  test('text inside shadow DOM should remain visible', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const visibility = await page.evaluate(() => {
      const card = document.querySelector('custom-user-card');
      if (!card || !card.shadowRoot) return null;
      const nameEl = card.shadowRoot.querySelector('.name');
      if (!nameEl) return null;
      const style = getComputedStyle(nameEl);
      return {
        color: style.color,
        opacity: style.opacity,
        visibility: style.visibility,
        display: style.display,
      };
    });

    if (visibility) {
      expect(visibility.opacity, 'Shadow text should not be transparent').not.toBe('0');
      expect(visibility.visibility, 'Shadow text should not be hidden').not.toBe('hidden');
    }
  });

  test('shadow DOM notification panel content should be visible', async () => {
    const page = await openTestPage(context, '/shadow-dom');
    await waitForThemeApplied(page);

    const visibility = await page.evaluate(() => {
      const panel = document.querySelector('custom-notification-panel');
      if (!panel || !panel.shadowRoot) return null;
      const notifications = panel.shadowRoot.querySelectorAll('.notification');
      return Array.from(notifications).map(n => {
        const style = getComputedStyle(n);
        return {
          opacity: style.opacity,
          visibility: style.visibility,
          color: style.color,
        };
      });
    });

    if (visibility) {
      for (const v of visibility) {
        expect(v.opacity, 'Notification should not be transparent').not.toBe('0');
        expect(v.visibility, 'Notification should not be hidden').not.toBe('hidden');
      }
    }
  });
});
