const DEFAULTS = {
  enabled: true,
  brightness: 75,
  imageFilter: false,
  imageBrightness: 80,
  customCSS: "",
  bgMode: "pure",
  contrastLevel: "normal"
};

function getSettings() {
  return {
    enabled: document.getElementById("enabled").checked,
    brightness: parseInt(document.getElementById("brightness").value, 10),
    imageFilter: document.getElementById("image-filter").checked,
    imageBrightness: parseInt(document.getElementById("image-brightness").value, 10),
    customCSS: document.getElementById("custom-css").value,
    bgMode: document.querySelector('#bg-mode-section .seg-btn.active')?.dataset.value || 'pure',
    contrastLevel: document.querySelector('#contrast-section .seg-btn.active')?.dataset.value || 'normal'
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

function setupSegmentedControl(sectionId) {
  const section = document.getElementById(sectionId);
  section.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings(getSettings());
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

    setupSegmentedControl('bg-mode-section');
    setupSegmentedControl('contrast-section');

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
