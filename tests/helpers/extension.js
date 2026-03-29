const path = require('path');
const { chromium } = require('@playwright/test');

const EXTENSION_PATH = path.resolve(__dirname, '../..');

async function launchExtension({ headless = false } = {}) {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  const extensionId = await waitForExtension(context);
  
  return { context, extensionId };
}

function getExtensionId(context) {
  for (const page of context.pages()) {
    const url = page.url();
    if (url.startsWith('chrome-extension://')) {
      const match = url.match(/chrome-extension:\/\/([^/]+)/);
      if (match) return match[1];
    }
  }
  const workers = context.serviceWorkers();
  for (const worker of workers) {
    const url = worker.url();
    const match = url.match(/chrome-extension:\/\/([^/]+)/);
    if (match) return match[1];
  }
  return null;
}

async function openPopup(context, extensionId) {
  if (!extensionId) return null;
  const existingPages = context.pages();
  for (const p of existingPages) {
    if (p.url().includes('popup/popup.html') || p.url().includes('popup.html')) {
      try { await p.close(); } catch(e) {}
      await new Promise(r => setTimeout(r, 300));
    }
  }
  try {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    return popup;
  } catch (e) {
    await new Promise(r => setTimeout(r, 500));
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    return popup;
  }
}

async function getBackgroundPage(context, extensionId) {
  const target = await context.waitForEvent('backgroundpage', { timeout: 5000 }).catch(() => null);
  if (target) return target;
  return null;
}

async function openTestPage(context, path = '/light') {
  const page = await context.newPage();
  await page.goto(`http://localhost:3456${path}`, { waitUntil: 'networkidle' });
  return page;
}

async function getExtensionSettings(page) {
  return await page.evaluate(() => {
    if (window.__amoledBlack && window.__amoledBlack.getSettings) {
      return window.__amoledBlack.getSettings();
    }
    return null;
  });
}

async function setPopupSetting(popup, setting, value) {
  switch (setting) {
    case 'enabled': {
      const toggle = popup.locator('#enabled');
      const isChecked = await toggle.isChecked();
      if (isChecked !== value) await toggle.click();
      break;
    }
    case 'brightness': {
      const slider = popup.locator('#brightness');
      await slider.fill(String(value));
      break;
    }
    case 'imageFilter': {
      const toggle = popup.locator('#image-filter');
      const isChecked = await toggle.isChecked();
      if (isChecked !== value) await toggle.evaluate(el => el.click());
      break;
    }
    case 'imageBrightness': {
      const slider = popup.locator('#image-brightness');
      await slider.fill(String(value));
      break;
    }
    case 'bgMode': {
      const btn = popup.locator(`#bg-${value === 'pure' ? 'pure' : 'soft'}`);
      const isActive = await btn.getAttribute('class');
      if (!isActive.includes('active')) await btn.click();
      break;
    }
    case 'contrastLevel': {
      const btn = popup.locator(`#contrast-${value}`);
      const isActive = await btn.getAttribute('class');
      if (!isActive.includes('active')) await btn.click();
      break;
    }
    case 'customCSS': {
      const textarea = popup.locator('#custom-css');
      await textarea.fill(value);
      break;
    }
  }
}

async function waitForExtension(context, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const id = getExtensionId(context);
    if (id) return id;
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

async function resetExtensionSettings(context, extensionId) {
  const DEFAULTS = {
    enabled: true,
    brightness: 75,
    imageFilter: false,
    imageBrightness: 80,
    customCSS: "",
    bgMode: "pure",
    contrastLevel: "normal",
    lang: "tr"
  };
  const popup = await openPopup(context, extensionId);
  if (!popup) return;
  await popup.evaluate((defaults) => {
    return new Promise((resolve) => {
      chrome.storage.sync.set(defaults, resolve);
    });
  }, DEFAULTS);
  await new Promise(r => setTimeout(r, 500));
  await popup.close();
}

async function waitForThemeApplied(page, timeout = 3000) {
  await page.waitForFunction(() => {
    return document.documentElement.classList.contains('amoled-active') &&
           (document.documentElement.style.getPropertyValue('--amoled-text-color') !== '' ||
            document.documentElement.style.getPropertyValue('--amoled-bg') !== '' ||
            document.getElementById('amoled-base') !== null);
  }, { timeout }).catch(() => false);
}

module.exports = {
  launchExtension,
  getExtensionId,
  openPopup,
  getBackgroundPage,
  openTestPage,
  getExtensionSettings,
  setPopupSetting,
  waitForThemeApplied,
  waitForExtension,
  resetExtensionSettings,
  EXTENSION_PATH,
};
