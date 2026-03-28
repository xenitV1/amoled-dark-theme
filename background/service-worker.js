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

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, (existing) => {
    const merged = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS)) {
      if (existing[key] !== undefined) {
        merged[key] = existing[key];
      }
    }
    chrome.storage.sync.set(merged);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "settings-update") {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://") && !tab.url.startsWith("about:")) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        }
      });
    });
    sendResponse({ ok: true });
  }
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://") && !tab.url.startsWith("about:")) {
    chrome.storage.sync.get(null, (settings) => {
      const merged = { ...DEFAULTS, ...settings };
      chrome.tabs.sendMessage(tabId, {
        type: "settings-update",
        settings: merged
      }).catch(() => {});
    });
  }
});
