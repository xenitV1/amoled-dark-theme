const { test, expect, chromium } = require('@playwright/test');
const { launchExtension, openPopup, openTestPage, setPopupSetting, waitForThemeApplied } = require('../helpers/extension');

test.describe('Image Handling', () => {
  let context, extensionId, popup;

  test.describe('Image Protection', () => {
    test.beforeAll(async () => {
      ({ context, extensionId } = await launchExtension());
      popup = await openPopup(context, extensionId);
    }, 30000);

    test.afterAll(async () => {
      if (context) await context.close();
    });

    test('regular <img> elements should not have any CSS filter applied by default', async () => {
      const page = await openTestPage(context, '/images');
      await waitForThemeApplied(page);

      const filters = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          src: img.src.substring(0, 60),
          filter: getComputedStyle(img).filter
        }));
      });

      for (const item of filters) {
        expect(item.filter).toBe('none');
      }
    });

    test('images with data: URIs should not be affected', async () => {
      const page = await openTestPage(context, '/images');
      await waitForThemeApplied(page);

      const dataUriImages = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img[src^="data:"]');
        return Array.from(imgs).map(img => ({
          filter: getComputedStyle(img).filter,
          opacity: getComputedStyle(img).opacity,
          hasBrightnessInStyle: img.style.filter.includes('brightness')
        }));
      });

      expect(dataUriImages.length).toBeGreaterThan(0);
      for (const img of dataUriImages) {
        expect(img.filter).toBe('none');
        expect(img.hasBrightnessInStyle).toBe(false);
      }
    });

    test('SVG elements used as icons (small, inside buttons/nav) should not be modified', async () => {
      const page = await openTestPage(context, '/complex');
      await waitForThemeApplied(page);

      const svgStatus = await page.evaluate(() => {
        const svgs = document.querySelectorAll('svg');
        return Array.from(svgs).map(svg => {
          const computed = getComputedStyle(svg);
          return {
            width: svg.offsetWidth,
            height: svg.offsetHeight,
            filter: computed.filter,
            opacity: computed.opacity
          };
        });
      });

      expect(svgStatus.length).toBeGreaterThan(0);
      for (const svg of svgStatus) {
        expect(svg.filter).toBe('none');
        expect(svg.opacity).not.toBe('0');
      }
    });

    test('large SVG elements (decorative) should not be modified', async () => {
      const page = await openTestPage(context, '/images');
      await waitForThemeApplied(page);

      const svgStatus = await page.evaluate(() => {
        const svgs = document.querySelectorAll('svg.svg-icon');
        return Array.from(svgs).map(svg => {
          const computed = getComputedStyle(svg);
          return {
            filter: computed.filter,
            opacity: computed.opacity,
            display: computed.display
          };
        });
      });

      expect(svgStatus.length).toBeGreaterThan(0);
      for (const svg of svgStatus) {
        expect(svg.filter).toBe('none');
        expect(svg.opacity).not.toBe('0');
      }
    });

    test('avatar images (circular, with border-radius) should not get background color changes', async () => {
      const page = await openTestPage(context, '/images');
      await waitForThemeApplied(page);

      const avatarStatus = await page.evaluate(() => {
        const avatars = document.querySelectorAll('.profile-img, .avatar-small, .avatar-tiny');
        return Array.from(avatars).map(img => ({
          className: img.className,
          borderRadius: getComputedStyle(img).borderRadius,
          filter: getComputedStyle(img).filter,
          inlineBgChanged: img.style.backgroundColor !== ''
        }));
      });

      expect(avatarStatus.length).toBeGreaterThan(0);
      for (const avatar of avatarStatus) {
        expect(avatar.filter).toBe('none');
        expect(avatar.inlineBgChanged).toBe(false);
      }
    });
  });

  test.describe('Image Filter Feature', () => {
    let context2, extensionId2, popup2;

    test.beforeAll(async () => {
      ({ context: context2, extensionId: extensionId2 } = await launchExtension());
      popup2 = await openPopup(context2, extensionId2);
    }, 30000);

    test.afterAll(async () => {
      if (context2) await context2.close();
    });

    test('when image filter is enabled at 80%, all <img> and <video> should have brightness filter', async () => {
      const page = await openTestPage(context2, '/images');
      await waitForThemeApplied(page);

      await setPopupSetting(popup2, 'imageFilter', true);
      await setPopupSetting(popup2, 'imageBrightness', 80);
      await page.waitForTimeout(500);

      const filterStatus = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          filter: getComputedStyle(img).filter
        }));
      });

      expect(filterStatus.length).toBeGreaterThan(0);
      for (const item of filterStatus) {
        expect(item.filter).toMatch(/brightness\(0?\.?80?\)|brightness\(80%\)/);
      }
    });

    test('when image filter is enabled at 50%, images should be noticeably dimmer', async () => {
      await setPopupSetting(popup2, 'imageBrightness', 50);
      const page = await openTestPage(context2, '/images');
      await waitForThemeApplied(page);
      await page.waitForTimeout(500);

      const filterStatus = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          filter: getComputedStyle(img).filter
        }));
      });

      expect(filterStatus.length).toBeGreaterThan(0);
      for (const item of filterStatus) {
        expect(item.filter).toMatch(/brightness\(0?\.?50?\)|brightness\(50%\)/);
      }
    });

    test('when image filter is disabled, the filter style should be removed', async () => {
      await setPopupSetting(popup2, 'imageFilter', false);
      const page = await openTestPage(context2, '/images');
      await waitForThemeApplied(page);
      await page.waitForTimeout(500);

      const filterStatus = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          filter: getComputedStyle(img).filter
        }));
      });

      expect(filterStatus.length).toBeGreaterThan(0);
      for (const item of filterStatus) {
        expect(item.filter).toBe('none');
      }
    });

    test('image filter should NOT apply to SVG elements', async () => {
      await setPopupSetting(popup2, 'imageFilter', true);
      await setPopupSetting(popup2, 'imageBrightness', 80);

      const page = await openTestPage(context2, '/images');
      await waitForThemeApplied(page);
      await page.waitForTimeout(500);

      const svgFilterStatus = await page.evaluate(() => {
        const svgs = document.querySelectorAll('svg');
        return Array.from(svgs).map(svg => ({
          tag: svg.tagName,
          filter: getComputedStyle(svg).filter
        }));
      });

      expect(svgFilterStatus.length).toBeGreaterThan(0);
      for (const item of svgFilterStatus) {
        expect(item.tag.toUpperCase()).toBe('SVG');
        expect(item.filter).toBe('none');
      }
    });
  });

  test.describe('Background Images', () => {
    let context3, extensionId3;

    test.beforeAll(async () => {
      ({ context: context3, extensionId: extensionId3 } = await launchExtension());
    }, 30000);

    test.afterAll(async () => {
      if (context3) await context3.close();
    });

    test('elements with background-image: url(...) should not have their image removed', async () => {
      const page = await openTestPage(context3, '/gradient');
      await waitForThemeApplied(page);

      const bgImageStatus = await page.evaluate(() => {
        const el = document.querySelector('.bg-image');
        if (!el) return null;
        const computed = getComputedStyle(el);
        return {
          backgroundImage: computed.backgroundImage,
          hasBackground: computed.backgroundImage !== 'none'
        };
      });

      expect(bgImageStatus).not.toBeNull();
      expect(bgImageStatus.hasBackground).toBe(true);
      expect(bgImageStatus.backgroundImage).toContain('url');
    });

    test('elements with CSS gradients should preserve the gradient', async () => {
      const page = await openTestPage(context3, '/gradient');
      await waitForThemeApplied(page);

      const gradientStatus = await page.evaluate(() => {
        const elements = [
          document.querySelector('.gradient-1'),
          document.querySelector('.gradient-2'),
          document.querySelector('.gradient-3')
        ];
        return elements.map(el => ({
          className: el.className,
          backgroundImage: getComputedStyle(el).backgroundImage,
          isGradient: getComputedStyle(el).backgroundImage.includes('gradient')
        }));
      });

      expect(gradientStatus.length).toBe(3);
      for (const item of gradientStatus) {
        expect(item.isGradient).toBe(true);
        expect(item.backgroundImage).toContain('gradient');
      }
    });

    test('brand gradients (Instagram-style multi-color) should be completely preserved', async () => {
      const page = await openTestPage(context3, '/gradient');
      await waitForThemeApplied(page);

      const brandGradient = await page.evaluate(() => {
        const el = document.querySelector('.brand-gradient');
        if (!el) return null;
        const computed = getComputedStyle(el);
        return {
          backgroundImage: computed.backgroundImage,
          backgroundColor: computed.backgroundColor,
          hasGradient: computed.backgroundImage.includes('gradient'),
          isBlackened: computed.backgroundColor === 'rgb(0, 0, 0)'
        };
      });

      expect(brandGradient).not.toBeNull();
      expect(brandGradient.hasGradient).toBe(true);
      expect(brandGradient.isBlackened).toBe(false);
    });
  });

  test.describe('Notification Dots & Small Elements', () => {
    let context4, extensionId4;

    test.beforeAll(async () => {
      ({ context: context4, extensionId: extensionId4 } = await launchExtension());
    }, 30000);

    test.afterAll(async () => {
      if (context4) await context4.close();
    });

    test('small colored dots (< 12px, notification badges) should keep their color', async () => {
      const page = await openTestPage(context4, '/complex');
      await waitForThemeApplied(page);

      const dotStatus = await page.evaluate(() => {
        const dots = document.querySelectorAll('.notification-dot, .notification-badge');
        return Array.from(dots).map(dot => {
          const computed = getComputedStyle(dot);
          return {
            className: dot.className,
            width: dot.offsetWidth,
            height: dot.offsetHeight,
            backgroundColor: computed.backgroundColor,
            isBlack: computed.backgroundColor === 'rgb(0, 0, 0)'
          };
        });
      });

      expect(dotStatus.length).toBeGreaterThan(0);
      for (const dot of dotStatus) {
        expect(dot.width).toBeLessThanOrEqual(12);
        expect(dot.isBlack).toBe(false);
      }
    });

    test('progress bar fills should not be affected', async () => {
      const page = await openTestPage(context4, '/complex');
      await waitForThemeApplied(page);

      const progressStatus = await page.evaluate(() => {
        const fill = document.querySelector('.progress-bar-fill');
        if (!fill) return null;
        const computed = getComputedStyle(fill);
        return {
          backgroundColor: computed.backgroundColor,
          width: computed.width,
          isBlack: computed.backgroundColor === 'rgb(0, 0, 0)',
          inlineBgModified: fill.style.backgroundColor !== ''
        };
      });

      expect(progressStatus).not.toBeNull();
      expect(progressStatus.isBlack).toBe(false);
    });

    test('small icons (< 32px) with background colors should be protected', async () => {
      const page = await openTestPage(context4, '/complex');
      await waitForThemeApplied(page);

      const iconStatus = await page.evaluate(() => {
        const smallIcons = document.querySelectorAll('.brand-logo');
        return Array.from(smallIcons).map(icon => {
          const rect = icon.getBoundingClientRect();
          const computed = getComputedStyle(icon);
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            filter: computed.filter,
            opacity: computed.opacity,
            isHidden: computed.display === 'none' || computed.visibility === 'hidden'
          };
        });
      });

      expect(iconStatus.length).toBeGreaterThan(0);
      for (const icon of iconStatus) {
        expect(icon.width).toBeLessThanOrEqual(32);
        expect(icon.isHidden).toBe(false);
        expect(icon.opacity).not.toBe('0');
      }
    });
  });
});

