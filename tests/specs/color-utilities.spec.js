const { test, expect } = require('@playwright/test');
const { launchExtension, openTestPage, waitForThemeApplied } = require('../helpers/extension');

const COLOR_UTILS = `
  function hexToRgb(hex) {
    if (!hex || hex.charAt(0) !== "#") return null;
    hex = hex.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length !== 6) return null;
    var n = parseInt(hex, 16);
    if (isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }

  function parseColor(colorStr) {
    if (!colorStr || colorStr === "transparent" || colorStr === "inherit" || colorStr === "initial" || colorStr === "currentcolor") return null;
    colorStr = colorStr.trim();
    if (colorStr.charAt(0) === "#") return hexToRgb(colorStr);
    var m = colorStr.match(/^rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([0-9.]+))?/i);
    if (m) {
      var a = 1;
      if (m[4] !== undefined) {
        a = parseFloat(m[4].replace(/\\s*\\)?\\s*$/, ""));
        if (isNaN(a)) a = 1;
      }
      return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10), a: a };
    }
    return null;
  }

  function relativeLuminance(r, g, b) {
    var rs = r / 255, gs = g / 255, bs = b / 255;
    rs = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    gs = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    bs = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h, s: s, l: l };
  }

  function calculateTextColor(brightness) {
    var v = Math.round(255 * brightness / 100);
    return "rgb(" + v + ", " + v + ", " + v + ")";
  }

  function getBgColor(settings) {
    if (settings.bgMode === "pure") return "#000000";
    if (settings.bgMode === "soft") return "#080808";
    return "#000000";
  }

  function getSurfaceColor(settings) {
    if (settings.bgMode === "pure") return "#0a0a0a";
    if (settings.bgMode === "soft") return "#121212";
    return "#0a0a0a";
  }
`;

test.describe('Color Utility Functions', () => {
  let context, extensionId, page;

  test.beforeAll(async () => {
    const result = await launchExtension();
    context = result.context;
    extensionId = result.extensionId;
    await new Promise(r => setTimeout(r, 2000));
    page = await openTestPage(context, '/light');
    await waitForThemeApplied(page);
  });

  test.afterAll(async () => {
    if (context) await context.close();
  });

  function evalWithUtils(expr) {
    return page.evaluate(({ utils, expr }) => {
      eval(utils);
      return eval(expr);
    }, { utils: COLOR_UTILS, expr });
  }

  test('hexToRgb with #fff', async () => {
    const result = await evalWithUtils('hexToRgb("#fff")');
    expect(result).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  test('hexToRgb with #000000', async () => {
    const result = await evalWithUtils('hexToRgb("#000000")');
    expect(result).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  test('hexToRgb with #ff0000', async () => {
    const result = await evalWithUtils('hexToRgb("#ff0000")');
    expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  test('hexToRgb with invalid', async () => {
    const result = await evalWithUtils('hexToRgb("not-a-color")');
    expect(result).toBeNull();
  });

  test('parseColor with rgb(128, 64, 32)', async () => {
    const result = await evalWithUtils('parseColor("rgb(128, 64, 32)")');
    expect(result).toEqual({ r: 128, g: 64, b: 32, a: 1 });
  });

  test('parseColor with rgba(255, 0, 0, 0.5)', async () => {
    const result = await evalWithUtils('parseColor("rgba(255, 0, 0, 0.5)")');
    expect(result).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  test('parseColor with rgba(100, 200, 50, 0.75)', async () => {
    const result = await evalWithUtils('parseColor("rgba(100, 200, 50, 0.75)")');
    expect(result).toEqual({ r: 100, g: 200, b: 50, a: 0.75 });
  });

  test('parseColor with transparent', async () => {
    const result = await evalWithUtils('parseColor("transparent")');
    expect(result).toBeNull();
  });

  test('parseColor with inherit', async () => {
    const result = await evalWithUtils('parseColor("inherit")');
    expect(result).toBeNull();
  });

  test('relativeLuminance with white (255,255,255)', async () => {
    const result = await evalWithUtils('relativeLuminance(255, 255, 255)');
    expect(result).toBeCloseTo(1.0, 5);
  });

  test('relativeLuminance with black (0,0,0)', async () => {
    const result = await evalWithUtils('relativeLuminance(0, 0, 0)');
    expect(result).toBeCloseTo(0.0, 5);
  });

  test('relativeLuminance with mid-gray (128,128,128)', async () => {
    const result = await evalWithUtils('relativeLuminance(128, 128, 128)');
    expect(result).toBeCloseTo(0.216, 2);
  });

  test('rgbToHsl with pure red (255,0,0)', async () => {
    const result = await evalWithUtils('rgbToHsl(255, 0, 0)');
    expect(result.h).toBeCloseTo(0, 5);
    expect(result.s).toBeCloseTo(1, 5);
    expect(result.l).toBeCloseTo(0.5, 5);
  });

  test('rgbToHsl with pure green (0,255,0)', async () => {
    const result = await evalWithUtils('rgbToHsl(0, 255, 0)');
    expect(result.h).toBeCloseTo(0.333, 2);
    expect(result.s).toBeCloseTo(1, 5);
    expect(result.l).toBeCloseTo(0.5, 5);
  });

  test('rgbToHsl with gray (128,128,128)', async () => {
    const result = await evalWithUtils('rgbToHsl(128, 128, 128)');
    expect(result.s).toBeCloseTo(0, 5);
    expect(result.l).toBeCloseTo(0.5, 2);
  });

  test('calculateTextColor at 75%', async () => {
    const result = await evalWithUtils('calculateTextColor(75)');
    expect(result).toBe('rgb(191, 191, 191)');
  });

  test('calculateTextColor at 100%', async () => {
    const result = await evalWithUtils('calculateTextColor(100)');
    expect(result).toBe('rgb(255, 255, 255)');
  });

  test('calculateTextColor at 0%', async () => {
    const result = await evalWithUtils('calculateTextColor(0)');
    expect(result).toBe('rgb(0, 0, 0)');
  });

  test('getBgColor pure mode', async () => {
    const result = await evalWithUtils('getBgColor({ bgMode: "pure" })');
    expect(result).toBe('#000000');
  });

  test('getBgColor soft mode', async () => {
    const result = await evalWithUtils('getBgColor({ bgMode: "soft" })');
    expect(result).toBe('#080808');
  });

  test('getSurfaceColor pure mode', async () => {
    const result = await evalWithUtils('getSurfaceColor({ bgMode: "pure" })');
    expect(result).toBe('#0a0a0a');
  });

  test('getSurfaceColor soft mode', async () => {
    const result = await evalWithUtils('getSurfaceColor({ bgMode: "soft" })');
    expect(result).toBe('#121212');
  });
});
