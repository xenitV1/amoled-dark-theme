<div align="center">
  <img src="icons/128.png" width="96" height="96" alt="AMOLED Black">
  <h1>AMOLED Black</h1>
</div>

A Chrome extension (Manifest V3) that applies true AMOLED black (`#000000`) dark theme to every website. Optimized for OLED/AMOLED displays — saves battery, reduces eye strain.

---

Chrome uzantısı (Manifest V3) — tüm sitelere gercek AMOLED siyah (`#000000`) karanlık tema uygular. OLED/AMOLED ekranlar icin optimize edilmistir; pil tasarrufu saglar ve goz yorgunlugunu azaltır.

---

## Features

- **Pure AMOLED Black** — Forces `#000000` backgrounds, not dark gray
- **Smart Dark Detection** — Recognizes already-dark sites and applies text-only overrides instead of aggressive repainting
- **Text Brightness Control** — Adjust text brightness from 10% to 100%
- **Background Modes** — Pure Black (`#000`) or Soft (`#080808`)
- **Contrast Levels** — Low, Normal, or High threshold for background detection
- **Image Filtering** — Optionally dim images with adjustable brightness
- **Custom CSS** — Inject your own CSS rules per-site or globally
- **Site-Specific Overrides** — Tailored theme injection for GitHub, X/Twitter, YouTube, Reddit, LinkedIn, Instagram, and Wikipedia
- **Dynamic Content Support** — MutationObserver handles SPA navigation and lazy-loaded content
- **Element Protection** — Icons, SVGs, small elements, and background images are automatically excluded
- **Opt-Out** — Add `amoled-exclude` class to any element to skip it
- **Settings Sync** — All preferences synced across devices via Chrome Sync

---

## Ozellikler

- **Saf AMOLED Siyah** — Koyu gri degil, `#000000` arka plan uygular
- **Akıllı Koyu Algılama** — Zaten karanlık olan siteleri tanır ve agresif boyama yerine yalnızca metin uzerinde degisiklik yapar
- **Metin Parlaklık Kontrolu** — Metin parlaklıgını %10 ile %100 arasında ayarlayın
- **Arka Plan Modları** — Saf Siyah (`#000`) veya Yumusak (`#080808`)
- **Kontrast Seviyeleri** — Dusuk, Normal veya Yuksek arka plan algılama esigi
- **Gorsel Filtreleme** — Gorsellerin parlaklıgını istege baglı dusurun
- **Ozel CSS** — Site bazlı veya genel gecerli kendi CSS kurallarınızı ekleyin
- **Siteye Ozel Ayarlar** — GitHub, X/Twitter, YouTube, Reddit, LinkedIn, Instagram ve Wikipedia icin ozel tema enjeksiyonu
- **Dinamik Icerik Destegi** — MutationObserver ile SPA sayfa gecisleri ve gec yuklenen icerikler desteklenir
- **Oge Koruması** — Ikonlar, SVG'ler, kucuk oge ve arka plan gorselleri otomatik olarak dıslanır
- **Dıslayın** — Herhangi bir ogeye `amoled-exclude` sınıfını ekleyerek temaya dıslayın
- **Ayar Senkronizasyonu** — Tum tercihler Chrome Sync ile cihazlar arasında senkronize edilir

---

## Installation

### From Source

1. Clone this repo
   ```bash
   git clone https://github.com/<username>/amoled.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `amoled` folder

### Chrome Web Store

*Coming soon.*

---

## Kurulum

### Kaynak Koddan

1. Repoyu klonlayın
   ```bash
   git clone https://github.com/<username>/amoled.git
   ```
2. Chrome'da `chrome://extensions/` adresini acın
3. Sag ustten **Gelistirici modu**nu etkinlestirin
4. **Paketlenmemis oge yukle**ye tıklayın
5. `amoled` klasorunu secin

### Chrome Web Store

*Yakında.*

---

## Usage

Click the extension icon in the toolbar to open the popup:

| Setting | Description |
|---|---|
| **Extension Enabled** | Toggle the extension on/off |
| **Text Brightness** | Text brightness slider (10-100%) |
| **Background Mode** | Pure Black or Soft background |
| **Contrast Level** | Background detection sensitivity (Low / Normal / High) |
| **Image Filtering** | Dim images with adjustable brightness |
| **Custom CSS** | Write custom CSS applied to all sites |

### Exclude Elements

Add the `amoled-exclude` class to any HTML element to prevent AMOLED Black from modifying it:

```html
<div class="amoled-exclude">
  This element won't be themed.
</div>
```

---

## Kullanim

Araç cubugundaki uzantı ikonuna tıklayarak ayarlar penceresini acın:

| Ayar | Aciklama |
|---|---|
| **Eklenti Aktif** | Uzantıyı ac/kapa |
| **Metin Parlaklıgı** | Metin parlaklıgı kaydırıcı (%10-100) |
| **Arka Plan Modu** | Saf Siyah veya Yumusak arka plan |
| **Kontrast Seviyesi** | Arka plan algılama hassasiyeti (Dusuk / Normal / Yuksek) |
| **Gorsel Filtreleme** | Gorsellerin parlaklıgını ayarlanabilir bicimde dusur |
| **Ozel CSS** | Tum sitelere uygulanacak ozel CSS yazın |

### Oge Dıslama

Herhangi bir HTML ogesine `amoled-exclude` sınıfını ekleyerek AMOLED Black'in o ogeyi degistirmesini onleyin:

```html
<div class="amoled-exclude">
  Bu oge temaya dahil edilmeyecek.
</div>
```

---

## Supported Sites

Site-specific CSS variable overrides are included for:

| Site | Override Method |
|---|---|
| GitHub | CSS custom properties (`--color-canvas-*`, `--bgColor-*`) |
| X / Twitter | `data-testid` selectors + CSS overrides |
| YouTube | YouTube CSS variables (`--yt-spec-*`) |
| Reddit | Reddit CSS variables (`--reddit-*`) |
| LinkedIn | CSS variables (`--color-background-*`) |
| Instagram | CSS variables (`--bg-*`, `--text-*`) |
| Wikipedia | CSS variables (`--background-color-*`, `--color-*`) |

All other sites receive universal AMOLED overrides via DOM walking + generic CSS rules.

---

## Desteklenen Siteler

Asagıdaki siteler icin ozel CSS degisken ayarları bulunmaktadır:

| Site | Yontem |
|---|---|
| GitHub | CSS ozel degiskenleri (`--color-canvas-*`, `--bgColor-*`) |
| X / Twitter | `data-testid` secicileri + CSS ayarları |
| YouTube | YouTube CSS degiskenleri (`--yt-spec-*`) |
| Reddit | Reddit CSS degiskenleri (`--reddit-*`) |
| LinkedIn | CSS degiskenleri (`--color-background-*`) |
| Instagram | CSS degiskenleri (`--bg-*`, `--text-*`) |
| Wikipedia | CSS degiskenleri (`--background-color-*`, `--color-*`) |

Diger tum siteler, DOM gezinme ve genel CSS kurallarıyla evrensel AMOLED ayarları alır.

---

## Development

### Prerequisites

- Chrome or Chromium-based browser
- Node.js (for running tests)

### Running Tests

```bash
cd tests
npm install
npx playwright test
```

### Architecture

```
amoled/
├── manifest.json              # Manifest V3 configuration
├── _locales/
│   ├── en/messages.json       # English locale
│   └── tr/messages.json       # Turkish locale
├── background/
│   └── service-worker.js      # Settings sync, tab update handling
├── content/
│   ├── content.js             # Core theme engine: DOM walker, color math, site overrides
│   └── amoled.css             # Base CSS: variables, scrollbar, form styling
├── popup/
│   ├── popup.html             # Settings UI
│   ├── popup.css              # Popup styling
│   └── popup.js               # Settings read/write, segmented controls
├── icons/
│   ├── 16.png
│   ├── 48.png
│   └── 128.png
└── tests/                     # Playwright test suite
    ├── fixtures/              # Mock HTML pages
    ├── helpers/               # Test utilities
    └── specs/                 # Test specifications
```

---

## Gelistirme

### Gereksinimler

- Chrome veya Chromium tabanlı tarayıcı
- Node.js (testleri calıstırmak icin)

### Testleri Calıstırma

```bash
cd tests
npm install
npx playwright test
```

### Mimari

```
amoled/
├── manifest.json              # Manifest V3 yapılandırması
├── _locales/
│   ├── en/messages.json       # Ingilizce dil dosyası
│   └── tr/messages.json       # Turkce dil dosyası
├── background/
│   └── service-worker.js      # Ayar senkronizasyonu, sekme guncelleme
├── content/
│   ├── content.js             # Temel tema motoru: DOM gezici, renk islemleri, site ayarları
│   └── amoled.css             # Temel CSS: degiskenler, kaydırma cubugu, form stilleri
├── popup/
│   ├── popup.html             # Ayarlar arayuzu
│   ├── popup.css              # Popup stilleri
│   └── popup.js               # Ayar okuma/yazma, kontroller
├── icons/
│   ├── 16.png
│   ├── 48.png
│   └── 128.png
└── tests/                     # Playwright test paketi
    ├── fixtures/              # Sahte HTML sayfaları
    ├── helpers/               # Test aracları
    └── specs/                 # Test ozellikleri
```

---

## How It Works

1. **Early Injection** — A minimal CSS rule is injected at `document_start` to prevent white flash
2. **Theme Application** — On `DOMContentLoaded`, the content script reads settings from `chrome.storage.sync` and:
   - Detects if the site is already dark (via `data-color-mode`, `dark` attribute, meta tags)
   - For dark sites: applies text-only CSS overrides
   - For light sites: walks the DOM and rewrites light backgrounds to AMOLED black
3. **Site Overrides** — CSS custom properties are overridden per-site for native-feeling themes
4. **Dynamic Updates** — A `MutationObserver` with `requestAnimationFrame` batching handles new elements without jank
5. **Settings Sync** — The service worker broadcasts setting changes to all open tabs

---

## Calısma Prensibi

1. **Erken Enjeksiyon** — `document_start` anında minimal bir CSS kuralı enjekte edilerek beyaz parıltı onlenir
2. **Tema Uygulaması** — `DOMContentLoaded` uzerinde icerik betigi `chrome.storage.sync`'ten ayarları okur ve:
   - Site zaten karanlık mı tespit eder (`data-color-mode`, `dark` niteligi, meta etiketleri uzerinden)
   - Karanlık siteler icin: yalnızca metin CSS ayarlarını uygular
   - Acık siteler icin: DOM'u gezerek acık arka planları AMOLED siyaha cevirir
3. **Site Ayarları** — Her site icin CSS ozel degiskenleri uzerine yazılarak dogal gorunumlu temalar elde edilir
4. **Dinamik Guncellemeler** — `MutationObserver`, `requestAnimationFrame` ile birlestirilerek yeni oge performans sorunu yaratmadan islenir
5. **Ayar Senkronizasyonu** — Service worker, ayar degisikliklerini tum acık sekmelere yayınlama yapar

---

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
