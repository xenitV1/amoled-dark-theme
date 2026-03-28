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

const I18N = {
  en: {
    extensionActive: "Extension Active",
    textBrightness: "Text Brightness",
    bgMode: "Background Mode",
    pureBlack: "Pure Black",
    soft: "Soft",
    contrastLevel: "Contrast Level",
    low: "Low",
    normal: "Normal",
    high: "High",
    imageFiltering: "Image Filtering",
    imageBrightness: "Image Brightness",
    customCSS: "Custom CSS",
    customCSSPlaceholder: "Write your custom CSS here..."
  },
  tr: {
    extensionActive: "Eklenti Aktif",
    textBrightness: "Metin Parlaklığı",
    bgMode: "Arka Plan Modu",
    pureBlack: "Saf Siyah",
    soft: "Yumuşak",
    contrastLevel: "Kontrast Seviyesi",
    low: "Düşük",
    normal: "Normal",
    high: "Yüksek",
    imageFiltering: "Görsel Filtreleme",
    imageBrightness: "Görsel Parlaklığı",
    customCSS: "Özel CSS",
    customCSSPlaceholder: "Kendi CSS kodunuzu buraya yazın..."
  }
};

function applyLang(lang) {
  const messages = I18N[lang] || I18N.tr;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (messages[key]) el.textContent = messages[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (messages[key]) el.placeholder = messages[key];
  });
}

function getSettings() {
  return {
    enabled: document.getElementById("enabled").checked,
    brightness: parseInt(document.getElementById("brightness").value, 10),
    imageFilter: document.getElementById("image-filter").checked,
    imageBrightness: parseInt(document.getElementById("image-brightness").value, 10),
    customCSS: document.getElementById("custom-css").value,
    bgMode: document.querySelector('#bg-mode-section .seg-btn.active')?.dataset.value || 'pure',
    contrastLevel: document.querySelector('#contrast-section .seg-btn.active')?.dataset.value || 'normal',
    lang: document.querySelector('#lang-section .seg-btn.active')?.dataset.value || 'tr'
  };
}

function saveSettings(settings) {
  chrome.storage.sync.set(settings);
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: "settings-update", settings }).catch(() => {});
    });
  });
}

function setupSegmentedControl(sectionId, onChange) {
  const section = document.getElementById(sectionId);
  section.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings(getSettings());
      if (onChange) onChange(btn.dataset.value);
    });
  });
}

function updateUI() {
  const enabled = document.getElementById("enabled").checked;
  const imageFilter = document.getElementById("image-filter").checked;

  const sections = document.querySelectorAll(".section");
  sections.forEach((s) => {
    s.classList.toggle("disabled", !enabled);
  });

  document.getElementById("image-brightness-section").style.display =
    imageFilter && enabled ? "block" : "none";

  document.getElementById("brightness-value").textContent =
    document.getElementById("brightness").value + "%";
  document.getElementById("image-brightness-value").textContent =
    document.getElementById("image-brightness").value + "%";
}

let cssTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(null, (stored) => {
    const s = { ...DEFAULTS, ...stored };

    document.getElementById("enabled").checked = s.enabled;
    document.getElementById("brightness").value = s.brightness;
    document.getElementById("image-filter").checked = s.imageFilter;
    document.getElementById("image-brightness").value = s.imageBrightness;
    document.getElementById("custom-css").value = s.customCSS;

    document.querySelectorAll('#bg-mode-section .seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === s.bgMode);
    });
    document.querySelectorAll('#contrast-section .seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === s.contrastLevel);
    });
    document.querySelectorAll('#lang-section .seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === s.lang);
    });

    setupSegmentedControl('bg-mode-section');
    setupSegmentedControl('contrast-section');
    setupSegmentedControl('lang-section', (lang) => applyLang(lang));

    applyLang(s.lang);
    updateUI();
  });

  document.getElementById("enabled").addEventListener("change", () => {
    saveSettings(getSettings());
    updateUI();
  });

  document.getElementById("brightness").addEventListener("input", () => {
    document.getElementById("brightness-value").textContent =
      document.getElementById("brightness").value + "%";
    saveSettings(getSettings());
  });

  document.getElementById("image-filter").addEventListener("change", () => {
    saveSettings(getSettings());
    updateUI();
  });

  document.getElementById("image-brightness").addEventListener("input", () => {
    document.getElementById("image-brightness-value").textContent =
      document.getElementById("image-brightness").value + "%";
    saveSettings(getSettings());
  });

  document.getElementById("custom-css").addEventListener("input", () => {
    if (cssTimeout) clearTimeout(cssTimeout);
    cssTimeout = setTimeout(() => {
      saveSettings(getSettings());
      cssTimeout = null;
    }, 300);
  });
});
