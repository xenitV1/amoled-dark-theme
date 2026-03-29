const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied } = require('../helpers/extension');
const { parseRGB } = require('../helpers/color-utils');

test.describe('SVG Heavy Pages', () => {
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

  test('SVG icons should not have filters applied', async () => {
    const page = await openTestPage(context, '/svg-heavy');
    await waitForThemeApplied(page);

    const svgFilters = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.icon-item svg');
      const results = [];
      for (const svg of svgs) {
        const filter = getComputedStyle(svg).filter;
        results.push(filter);
      }
      return results;
    });

    for (const f of svgFilters) {
      expect(f).toBe('none');
    }
  });

  test('SVG chart bars should keep their colors', async () => {
    const page = await openTestPage(context, '/svg-heavy');
    await waitForThemeApplied(page);

    const barColors = await page.evaluate(() => {
      const containers = document.querySelectorAll('.chart-container');
      const chartContainer = containers[0];
      const rects = chartContainer.querySelectorAll('svg rect[fill="#3b82f6"], svg rect[fill="#22c55e"]');
      return Array.from(rects).map(r => r.getAttribute('fill'));
    });

    expect(barColors.length).toBeGreaterThan(0);
    for (const color of barColors) {
      expect(color).toMatch(/#3b82f6|#22c55e/);
    }
  });

  test('SVG donut chart segments preserved', async () => {
    const page = await openTestPage(context, '/svg-heavy');
    await waitForThemeApplied(page);

    const segmentColors = await page.evaluate(() => {
      const containers = document.querySelectorAll('.chart-container');
      const donutContainer = containers[1];
      const circles = donutContainer.querySelectorAll('svg circle[stroke="#3b82f6"], svg circle[stroke="#22c55e"], svg circle[stroke="#facc15"], svg circle[stroke="#a855f7"]');
      return Array.from(circles).map(c => c.getAttribute('stroke'));
    });

    expect(segmentColors.length).toBe(4);
    expect(segmentColors).toContain('#3b82f6');
    expect(segmentColors).toContain('#22c55e');
    expect(segmentColors).toContain('#facc15');
    expect(segmentColors).toContain('#a855f7');
  });

  test('SVG illustrations not hidden', async () => {
    const page = await openTestPage(context, '/svg-heavy');
    await waitForThemeApplied(page);

    const svgVisibility = await page.evaluate(() => {
      const svgs = document.querySelectorAll('.illustration svg');
      return Array.from(svgs).map(svg => ({
        opacity: getComputedStyle(svg).opacity,
        display: getComputedStyle(svg).display,
        visibility: getComputedStyle(svg).visibility
      }));
    });

    expect(svgVisibility.length).toBeGreaterThan(0);
    for (const v of svgVisibility) {
      expect(parseFloat(v.opacity)).not.toBe(0);
      expect(v.display).not.toBe('none');
      expect(v.visibility).not.toBe('hidden');
    }
  });

  test('surrounding HTML elements themed with dark backgrounds', async () => {
    const page = await openTestPage(context, '/svg-heavy');
    await waitForThemeApplied(page);

    const backgrounds = await page.evaluate(() => {
      const selectors = ['.section', '.chart-container', '.illustration'];
      return selectors.map(sel => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).backgroundColor : null;
      });
    });

    for (const bg of backgrounds) {
      expect(bg).not.toBeNull();
      const parsed = parseRGB(bg);
      expect(parsed.r + parsed.g + parsed.b).toBeLessThan(100);
    }
  });

  test('SVG text labels readable', async () => {
    const page = await openTestPage(context, '/svg-heavy');
    await waitForThemeApplied(page);

    const textVisible = await page.evaluate(() => {
      const texts = document.querySelectorAll('.chart-container svg text, .illustration svg text');
      return Array.from(texts).map(t => {
        const fill = t.getAttribute('fill');
        const cs = getComputedStyle(t);
        return {
          fill,
          opacity: cs.opacity,
          display: cs.display
        };
      });
    });

    expect(textVisible.length).toBeGreaterThan(0);
    for (const t of textVisible) {
      expect(parseFloat(t.opacity)).toBeGreaterThan(0.5);
      expect(t.display).not.toBe('none');
    }
  });

  test('body background is dark', async () => {
    const page = await openTestPage(context, '/svg-heavy');
    await waitForThemeApplied(page);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const parsed = parseRGB(bodyBg);
    expect(parsed.r + parsed.g + parsed.b).toBeLessThan(20);
  });
});
