<div align="center">
  <img src="icons/128.png" width="96" height="96" alt="AMOLED Black">
  <h1>AMOLED Black</h1>
</div>

A Chrome extension (Manifest V3) that applies true AMOLED black (`#000000`) dark theme to every website. Optimized for OLED/AMOLED displays — saves battery, reduces eye strain.

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

## Installation

### From Source

1. Clone this repo
   ```bash
   git clone https://github.com/xenitV1/amoled-dark-theme.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `amoled-dark-theme` folder

### Chrome Web Store

*Coming soon.*

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
| **Language** | Switch between EN / TR |

### Exclude Elements

Add the `amoled-exclude` class to any HTML element to prevent AMOLED Black from modifying it:

```html
<div class="amoled-exclude">
  This element won't be themed.
</div>
```

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
amoled-dark-theme/
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
│   └── popup.js               # Settings read/write, i18n, segmented controls
├── icons/
│   ├── 16.png
│   ├── 48.png
│   └── 128.png
└── tests/                     # Playwright test suite
    ├── fixtures/              # Mock HTML pages
    ├── helpers/               # Test utilities
    └── specs/                 # Test specifications
```

## How It Works

1. **Early Injection** — A minimal CSS rule is injected at `document_start` to prevent white flash
2. **Theme Application** — On `DOMContentLoaded`, the content script reads settings from `chrome.storage.sync` and:
   - Detects if the site is already dark (via `data-color-mode`, `dark` attribute, meta tags)
   - For dark sites: applies text-only CSS overrides
   - For light sites: walks the DOM and rewrites light backgrounds to AMOLED black
3. **Site Overrides** — CSS custom properties are overridden per-site for native-feeling themes
4. **Dynamic Updates** — A `MutationObserver` with `requestAnimationFrame` batching handles new elements without jank
5. **Settings Sync** — The service worker broadcasts setting changes to all open tabs

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

<details>
<summary><strong>Türkçe</strong></summary>

Chrome uzantısı (Manifest V3) — tüm sitelere gerçek AMOLED siyah (`#000000`) karanlık tema uygular. OLED/AMOLED ekranlar için optimize edilmiştir; pil tasarrufu sağlar ve göz yorgunluğunu azaltır.

## Özellikler

- **Saf AMOLED Siyah** — Koyu gri değil, `#000000` arka plan uygular
- **Akıllı Koyu Algılama** — Zaten karanlık olan siteleri tanır ve agresif boyama yerine yalnızca metin üzerinde değişiklik yapar
- **Metin Parlaklık Kontrolü** — Metin parlaklığını %10 ile %100 arasında ayarlayın
- **Arka Plan Modları** — Saf Siyah (`#000`) veya Yumuşak (`#080808`)
- **Kontrast Seviyeleri** — Düşük, Normal veya Yüksek arka plan algılama eşiği
- **Görsel Filtreleme** — Görsellerin parlaklığını isteğe bağlı düşürün
- **Özel CSS** — Site bazlı veya genel geçerli kendi CSS kurallarınızı ekleyin
- **Siteye Özel Ayarlar** — GitHub, X/Twitter, YouTube, Reddit, LinkedIn, Instagram ve Wikipedia için özel tema enjeksiyonu
- **Dinamik İçerik Desteği** — MutationObserver ile SPA sayfa geçişleri ve geç yüklenen içerikler desteklenir
- **Öğe Koruması** — İkonlar, SVG'ler, küçük öğe ve arka plan görselleri otomatik olarak dışlanır
- **Dışlayın** — Herhangi bir öğeye `amoled-exclude` sınıfını ekleyerek temaya dışlayın
- **Ayar Senkronizasyonu** — Tüm tercihler Chrome Sync ile cihazlar arasında senkronize edilir

## Kurulum

### Kaynak Koddan

1. Repoyu klonlayın
   ```bash
   git clone https://github.com/xenitV1/amoled-dark-theme.git
   ```
2. Chrome'da `chrome://extensions/` adresini açın
3. Sağ üstten **Geliştirici modu**nu etkinleştirin
4. **Paketlenmemiş uzantı yükle**ye tıklayın
5. `amoled-dark-theme` klasörünü seçin

### Chrome Web Store

*Yakında.*

## Kullanım

Araç çubuğundaki uzantı ikonuna tıklayarak ayarlar penceresini açın:

| Ayar | Açıklama |
|---|---|
| **Eklenti Aktif** | Uzantıyı aç/kapa |
| **Metin Parlaklığı** | Metin parlaklığı kaydırıcısı (%10-100) |
| **Arka Plan Modu** | Saf Siyah veya Yumuşak arka plan |
| **Kontrast Seviyesi** | Arka plan algılama hassasiyeti (Düşük / Normal / Yüksek) |
| **Görsel Filtreleme** | Görsellerin parlaklığını ayarlanabilir şekilde düşür |
| **Özel CSS** | Tüm sitelere uygulanacak özel CSS yazın |
| **Dil** | TR / EN arasında geçiş yapın |

### Öğe Dışlama

Herhangi bir HTML öğesine `amoled-exclude` sınıfını ekleyerek AMOLED Black'in o öğeyi değiştirmesini önleyin:

```html
<div class="amoled-exclude">
  Bu öğe temaya dahil edilmeyecek.
</div>
```

## Desteklenen Siteler

Aşağıdaki siteler için özel CSS değişken ayarları bulunmaktadır:

| Site | Yöntem |
|---|---|
| GitHub | CSS özel değişkenleri (`--color-canvas-*`, `--bgColor-*`) |
| X / Twitter | `data-testid` seçicileri + CSS ayarları |
| YouTube | YouTube CSS değişkenleri (`--yt-spec-*`) |
| Reddit | Reddit CSS değişkenleri (`--reddit-*`) |
| LinkedIn | CSS değişkenleri (`--color-background-*`) |
| Instagram | CSS değişkenleri (`--bg-*`, `--text-*`) |
| Wikipedia | CSS değişkenleri (`--background-color-*`, `--color-*`) |

Diğer tüm siteler, DOM gezinme ve genel CSS kurallarıyla evrensel AMOLED ayarları alır.

## Geliştirme

### Gereksinimler

- Chrome veya Chromium tabanlı tarayıcı
- Node.js (testleri çalıştırmak için)

### Testleri Çalıştırma

```bash
cd tests
npm install
npx playwright test
```

### Mimari

```
amoled-dark-theme/
├── manifest.json              # Manifest V3 yapılandırması
├── _locales/
│   ├── en/messages.json       # İngilizce dil dosyası
│   └── tr/messages.json       # Türkçe dil dosyası
├── background/
│   └── service-worker.js      # Ayar senkronizasyonu, sekme güncelleme
├── content/
│   ├── content.js             # Temel tema motoru: DOM gezici, renk işlemleri, site ayarları
│   └── amoled.css             # Temel CSS: değişkenler, kaydırma çubuğu, form stilleri
├── popup/
│   ├── popup.html             # Ayarlar arayüzü
│   ├── popup.css              # Popup stilleri
│   └── popup.js               # Ayar okuma/yazma, i18n, kontroller
├── icons/
│   ├── 16.png
│   ├── 48.png
│   └── 128.png
└── tests/                     # Playwright test paketi
    ├── fixtures/              # Sahte HTML sayfaları
    ├── helpers/               # Test araçları
    └── specs/                 # Test özellikleri
```

## Çalışma Prensibi

1. **Erken Enjeksiyon** — `document_start` anında minimal bir CSS kuralı enjekte edilerek beyaz parıltı önlenir
2. **Tema Uygulaması** — `DOMContentLoaded` üzerinde içerik betiği `chrome.storage.sync`'ten ayarları okur ve:
   - Site zaten karanlık mı tespit eder (`data-color-mode`, `dark` niteliği, meta etiketleri üzerinden)
   - Karanlık siteler için: yalnızca metin CSS ayarlarını uygular
   - Açık siteler için: DOM'u gezerek açık arka planları AMOLED siyaha çevirir
3. **Site Ayarları** — Her site için CSS özel değişkenleri üzerine yazılarak doğal görünümlü temalar elde edilir
4. **Dinamik Güncellemeler** — `MutationObserver`, `requestAnimationFrame` ile birleştirilerek yeni öğeler performans sorunu yaratmadan işlenir
5. **Ayar Senkronizasyonu** — Service worker, ayar değişikliklerini tüm açık sekmelere yayınlar

</details>
