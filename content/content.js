(function() {
  var DEFAULTS = {
    enabled: true,
    brightness: 75,
    imageFilter: false,
    imageBrightness: 80,
    customCSS: "",
    bgMode: "pure",
    contrastLevel: "normal",
    lang: "tr"
  };

  var currentSettings = {};
  var isDarkSite = false;
  var imageStyleEl = null;
  var customStyleEl = null;
  var baseStyleEl = null;
  var siteStyleEl = null;
  var observer = null;

  var SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "META", "LINK", "HEAD", "SVG", "IMG", "VIDEO", "CANVAS", "PICTURE", "IFRAME", "EMBED", "OBJECT", "MATH", "TEMPLATE"]);
  var SKIP_ROLES = new Set(["img", "button", "checkbox", "radio", "slider", "meter", "progressbar", "switch"]);
  var ICON_CLASS_PREFIXES = ["fa-", "fa ", "icon-", "material-icon", "glyphicon", "bi-", "iconfont", "ti-", "la-", "ri-", "ph-", "tabler-", "lucide-", "heroicon-", "uim-", "devicon-"];

  var SITE_OVERRIDE_PROPS = [
    "--color-canvas-default", "--color-canvas-subtle", "--color-canvas-inset",
    "--color-canvas-muted", "--color-fg-default", "--color-fg-muted",
    "--color-fg-subtle", "--color-border-default", "--color-border-muted",
    "--color-neutral-muted", "--color-header-bg", "--color-header-text",
    "--color-btn-primary-bg", "--color-btn-primary-text", "--color-btn-bg",
    "--color-btn-text", "--color-btn-border", "--color-btn-hover-bg",
    "--color-overlay-bg", "--color-danger-fg", "--color-success-fg",
    "--color-attention-fg", "--bgColor-default", "--bgColor-muted",
    "--bgColor-inset", "--bgColor-canvas-default", "--bgColor-canvas-inset",
    "--bgColor-canvas-subtle", "--fgColor-default", "--fgColor-muted",
    "--fgColor-subtle", "--borderColor-default", "--borderColor-muted",
    "--scale-fg", "--tooltip-fg-color", "--tooltip-bg-color",
    "--yt-spec-base-background", "--yt-spec-raised-background",
    "--yt-spec-menu-background", "--yt-spec-general-background-a",
    "--yt-spec-general-background-b", "--yt-spec-general-background-c",
    "--yt-spec-text-primary", "--yt-spec-text-secondary",
    "--yt-spec-text-disabled", "--yt-spec-brand-link",
    "--yt-spec-brand-link-text", "--yt-spec-explore-background",
    "--yt-spec-badge-chip-background", "--yt-spec-inset",
    "--yt-spec-call-to-action-background", "--yt-spec-hover-overlay",
    "--yt-spec-active-overlay", "--yt-spec-10-percent-layer",
    "--yt-spec-chip-background", "--yt-spec-touch-response",
    "--reddit-background", "--reddit-background-hover",
    "--reddit-secondary-background", "--reddit-foreground",
    "--reddit-secondary-foreground", "--reddit-secondary-foreground-dimmed",
    "--color-background-primary", "--color-background-secondary",
    "--color-background-tertiary", "--color-text-primary",
    "--color-text-secondary", "--color-text-tertiary",
    "--bg-0", "--bg-1", "--bg-2", "--bg-3",
    "--text-0", "--text-1", "--text-2",
    "--background-color-base", "--background-color-neutral-subtle",
    "--background-color-interactive-subtle", "--color-base",
    "--color-subtle", "--color-emphasized", "--border-color-subtle"
];

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
    var m = colorStr.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?/i);
    if (m) {
      var a = 1;
      if (m[4] !== undefined) {
        a = parseFloat(m[4].replace(/\s*\)?\s*$/, ""));
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

  function calculateMuted(brightness, factor) {
    var v = Math.round(255 * brightness / 100 * factor);
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

  function isElementProtected(el) {
    if (!el || el.nodeType !== 1) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.getAttribute && SKIP_ROLES.has(el.getAttribute("role"))) return true;
    if (el.closest && el.closest("svg")) return true;
    if (el.classList) {
      if (el.classList.contains("amoled-exclude")) return true;
      if (el.closest && el.closest(".amoled-exclude")) return true;
    }
    var bgImage = el.style && el.style.backgroundImage;
    if (bgImage && bgImage !== "none" && bgImage !== "") return true;
    if (el.classList) {
      for (var ci = 0; ci < el.classList.length; ci++) {
        var cls = el.classList[ci];
        for (var pi = 0; pi < ICON_CLASS_PREFIXES.length; pi++) {
          if (cls.startsWith(ICON_CLASS_PREFIXES[pi]) || cls.indexOf(ICON_CLASS_PREFIXES[pi].trim()) !== -1) return true;
        }
      }
    }
    var w = el.offsetWidth;
    var h = el.offsetHeight;
    if (w > 0 && w <= 24 && h > 0 && h <= 24) return true;
    return false;
  }

  function processElement(el, settings) {
    if (isElementProtected(el)) return;
    var computed = getComputedStyle(el);
    var bgColor = computed.backgroundColor;
    if (computed.backgroundImage && computed.backgroundImage !== "none") return;
    var parsed = parseColor(bgColor);
    if (!parsed || parsed.a < 0.3) return;
    var lum = relativeLuminance(parsed.r, parsed.g, parsed.b);
    var hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    if (hsl.s > 0.6 && hsl.l > 0.3 && hsl.l < 0.8) return;
    var threshold;
    if (settings.contrastLevel === "high") threshold = 0.08;
    else if (settings.contrastLevel === "low") threshold = 0.4;
    else threshold = 0.25;
    if (lum > threshold) {
      el.style.setProperty("--amoled-orig-bg", bgColor);
      if (settings.bgMode === "pure") {
        el.style.setProperty("background-color", "#000000", "important");
      } else {
        var mapped = Math.min(Math.round(20 * lum), 30);
        el.style.setProperty("background-color", "rgb(" + mapped + "," + mapped + "," + mapped + ")", "important");
      }
    }
  }

  function walkDOM(root, settings, noLimit) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
    var count = 0;
    var limit = noLimit ? Infinity : 5000;
    var node;
    while ((node = walker.nextNode())) {
      processElement(node, settings);
      count++;
      if (count >= limit) break;
    }
  }

  function applyBaseCSS(settings) {
    if (!baseStyleEl) {
      baseStyleEl = document.createElement("style");
      baseStyleEl.id = "amoled-base";
      document.documentElement.appendChild(baseStyleEl);
    }
    var bgColor = getBgColor(settings);
    var surfaceColor = getSurfaceColor(settings);
    var textColor = calculateTextColor(settings.brightness);
    var mutedText = calculateMuted(settings.brightness, 0.7);
    var subtleText = calculateMuted(settings.brightness, 0.5);
    var borderColor = settings.bgMode === "pure" ? "#1a1a1a" : "#222222";

    baseStyleEl.textContent = [
      "html, body {",
      "  background-color: " + bgColor + " !important;",
      "  color: " + textColor + " !important;",
      "  color-scheme: dark !important;",
      "}",
      "html *, body * {",
      "  color-scheme: dark;",
      "}",
      "p, span, div, li, td, th, h1, h2, h3, h4, h5, h6,",
      "label, article, section, nav, header, footer, main,",
      "aside, blockquote, figcaption, summary, details,",
      "dd, dt, small, strong, em, b, i, mark, time,",
      "cite, q, address {",
      "  color: inherit;",
      "}",
      "a { color: var(--amoled-link, #4dabf7) !important; }",
      "a:visited { color: var(--amoled-link-visited, #9775fa) !important; }",
      "input, textarea, select {",
      "  background-color: " + surfaceColor + " !important;",
      "  color: " + textColor + " !important;",
      "  border-color: " + borderColor + " !important;",
      "}",
      "button { color: " + textColor + " !important; }",
      "table { border-color: " + borderColor + " !important; }",
      "th { background-color: " + surfaceColor + " !important; }",
      "pre, code {",
      "  background-color: #080808 !important;",
      "  color: " + textColor + " !important;",
      "}",
      "hr { border-color: " + borderColor + " !important; }",
    ].join("\n");
  }

  function applySiteSpecificCSS(settings) {
    if (!siteStyleEl) {
      siteStyleEl = document.createElement("style");
      siteStyleEl.id = "amoled-site";
      document.documentElement.appendChild(siteStyleEl);
    }
    var host = location.hostname;
    var bgColor = getBgColor(settings);
    var surfaceColor = getSurfaceColor(settings);
    var textColor = calculateTextColor(settings.brightness);
    var mutedText = calculateMuted(settings.brightness, 0.7);
    var subtleText = calculateMuted(settings.brightness, 0.5);
    var borderColor = settings.bgMode === "pure" ? "#1a1a1a" : "#222222";
    var hoverColor = settings.bgMode === "pure" ? "#0a0a0a" : "#151515";
    var css = "";

    if (host.indexOf("github.com") !== -1) {
      var root = document.documentElement;
      root.style.setProperty("--color-canvas-default", bgColor);
      root.style.setProperty("--color-canvas-subtle", surfaceColor);
      root.style.setProperty("--color-canvas-inset", surfaceColor);
      root.style.setProperty("--color-canvas-muted", surfaceColor);
      root.style.setProperty("--color-fg-default", textColor);
      root.style.setProperty("--color-fg-muted", mutedText);
      root.style.setProperty("--color-fg-subtle", subtleText);
      root.style.setProperty("--color-border-default", borderColor);
      root.style.setProperty("--color-border-muted", borderColor);
      root.style.setProperty("--color-neutral-muted", surfaceColor);
      root.style.setProperty("--color-header-bg", bgColor);
      root.style.setProperty("--color-header-text", textColor);
      root.style.setProperty("--color-btn-primary-bg", "#238636");
      root.style.setProperty("--color-btn-primary-text", "#ffffff");
      root.style.setProperty("--color-btn-bg", surfaceColor);
      root.style.setProperty("--color-btn-text", textColor);
      root.style.setProperty("--color-btn-border", borderColor);
      root.style.setProperty("--color-btn-hover-bg", hoverColor);
      root.style.setProperty("--color-overlay-bg", bgColor);
      root.style.setProperty("--color-danger-fg", "#f85149");
      root.style.setProperty("--color-success-fg", "#3fb950");
      root.style.setProperty("--color-attention-fg", "#d29922");
      root.style.setProperty("--bgColor-default", bgColor);
      root.style.setProperty("--bgColor-muted", surfaceColor);
      root.style.setProperty("--bgColor-inset", surfaceColor);
      root.style.setProperty("--bgColor-canvas-default", bgColor);
      root.style.setProperty("--bgColor-canvas-inset", surfaceColor);
      root.style.setProperty("--bgColor-canvas-subtle", surfaceColor);
      root.style.setProperty("--fgColor-default", textColor);
      root.style.setProperty("--fgColor-muted", mutedText);
      root.style.setProperty("--fgColor-subtle", subtleText);
      root.style.setProperty("--borderColor-default", borderColor);
      root.style.setProperty("--borderColor-muted", borderColor);
      root.style.setProperty("--scale-fg", mutedText);
      root.style.setProperty("--tooltip-fg-color", textColor);
      root.style.setProperty("--tooltip-bg-color", surfaceColor);

      css += [
        "body, .application-main { background-color: " + bgColor + " !important; }",
        ".Header, header { background-color: " + bgColor + " !important; }",
        "[data-color-mode][data-dark-theme] { --color-canvas-default: " + bgColor + " !important; --color-canvas-subtle: " + surfaceColor + " !important; --color-fg-default: " + textColor + " !important; }",
        ".markdown-body, .comment-body { color: " + textColor + " !important; background-color: transparent !important; }",
        ".bg-gray, [class*=\"bg-gray\"] { background-color: " + surfaceColor + " !important; }",
      ].join("\n");
    }

    if (host.indexOf("x.com") !== -1 || host.indexOf("twitter.com") !== -1) {
      css += [
        "body { background-color: " + bgColor + " !important; }",
        "[data-testid=\"primaryColumn\"], [data-testid=\"sidebarColumn\"] { background-color: " + bgColor + " !important; }",
        "[data-testid=\"cellInnerDiv\"] { background-color: " + bgColor + " !important; }",
        "[data-testid=\"toolBar\"] { background-color: " + bgColor + " !important; }",
        "header[role=\"banner\"] { background-color: " + bgColor + " !important; }",
        "[data-testid=\"placementTracking\"] { background-color: " + bgColor + " !important; }",
        "[aria-label=\"Timeline\"] > div > div { background-color: " + bgColor + " !important; }",
        "[data-testid=\"DMDrawer\"] { background-color: " + bgColor + " !important; }",
        "[data-testid=\"mediaTile\"] { background-color: " + bgColor + " !important; }",
        "[data-testid=\"UserDescription\"] { color: " + mutedText + " !important; }",
        "[data-testid=\"UserName\"] div span { color: " + textColor + " !important; }",
        "[data-testid=\"UserCell\"] { border-color: " + borderColor + " !important; }",
        "[data-testid=\"SideNav_AccountSwitcher_Button\"] { background-color: " + surfaceColor + " !important; }",
        "div[role=\"dialog\"] > div > div { background-color: " + bgColor + " !important; }",
        "div[data-testid=\"toast\"] { background-color: " + surfaceColor + " !important; }",
        "a { color: " + textColor + " !important; }",
        "a[href] { color: " + textColor + " !important; }",
        "[data-testid=\"tweetText\"] { color: " + textColor + " !important; }",
        "[data-testid=\"tweetText\"] span { color: " + textColor + " !important; }",
        "time { color: " + mutedText + " !important; }",
        "article { color: " + textColor + " !important; }",
        "nav { background-color: " + bgColor + " !important; }",
        "[class*=\"css-\"] { color-scheme: dark; }",
      ].join("\n");
    }

    if (host.indexOf("youtube.com") !== -1 || host.indexOf("youtu.be") !== -1) {
      var root = document.documentElement;
      root.style.setProperty("--yt-spec-base-background", bgColor);
      root.style.setProperty("--yt-spec-raised-background", surfaceColor);
      root.style.setProperty("--yt-spec-menu-background", surfaceColor);
      root.style.setProperty("--yt-spec-general-background-a", bgColor);
      root.style.setProperty("--yt-spec-general-background-b", surfaceColor);
      root.style.setProperty("--yt-spec-general-background-c", "#111111");
      root.style.setProperty("--yt-spec-text-primary", textColor);
      root.style.setProperty("--yt-spec-text-secondary", mutedText);
      root.style.setProperty("--yt-spec-text-disabled", subtleText);
      root.style.setProperty("--yt-spec-brand-link", "#4dabf7");
      root.style.setProperty("--yt-spec-brand-link-text", "#4dabf7");
      root.style.setProperty("--yt-spec-explore-background", surfaceColor);
      root.style.setProperty("--yt-spec-badge-chip-background", "#111111");
      root.style.setProperty("--yt-spec-inset", surfaceColor);
      root.style.setProperty("--yt-spec-call-to-action-background", surfaceColor);
      root.style.setProperty("--yt-spec-hover-overlay", "rgba(255,255,255,0.05)");
      root.style.setProperty("--yt-spec-active-overlay", "rgba(255,255,255,0.08)");
      root.style.setProperty("--yt-spec-10-percent-layer", "rgba(255,255,255,0.1)");
      root.style.setProperty("--yt-spec-chip-background", "#111111");
      root.style.setProperty("--yt-spec-touch-response", "rgba(255,255,255,0.1)");

      css += [
        "#masthead-container, #header { background-color: " + bgColor + " !important; }",
        "#content, #primary, #secondary { background-color: " + bgColor + " !important; }",
        "ytd-rich-item-renderer, ytd-video-renderer { background-color: " + bgColor + " !important; }",
        "ytd-comments #sections { background-color: transparent !important; }",
        "ytd-guide-section-renderer, ytd-guide-entry-renderer { background-color: transparent !important; }",
        "#guide-inner-content { background-color: " + bgColor + " !important; }",
        "ytd-browse { background-color: " + bgColor + " !important; }",
        "ytd-search, ytd-watch-flexy { background-color: " + bgColor + " !important; }",
      ].join("\n");
    }

    if (host.indexOf("reddit.com") !== -1) {
      var root = document.documentElement;
      root.style.setProperty("--reddit-background", bgColor);
      root.style.setProperty("--reddit-background-hover", hoverColor);
      root.style.setProperty("--reddit-secondary-background", surfaceColor);
      root.style.setProperty("--reddit-foreground", textColor);
      root.style.setProperty("--reddit-secondary-foreground", mutedText);
      root.style.setProperty("--reddit-secondary-foreground-dimmed", subtleText);
    }

    if (host.indexOf("linkedin.com") !== -1) {
      var root = document.documentElement;
      root.style.setProperty("--color-background-primary", bgColor);
      root.style.setProperty("--color-background-secondary", surfaceColor);
      root.style.setProperty("--color-background-tertiary", surfaceColor);
      root.style.setProperty("--color-text-primary", textColor);
      root.style.setProperty("--color-text-secondary", mutedText);
      root.style.setProperty("--color-text-tertiary", subtleText);
    }

    if (host.indexOf("instagram.com") !== -1) {
      var root = document.documentElement;
      root.style.setProperty("--bg-0", bgColor);
      root.style.setProperty("--bg-1", surfaceColor);
      root.style.setProperty("--bg-2", "#111111");
      root.style.setProperty("--bg-3", "#1a1a1a");
      root.style.setProperty("--text-0", textColor);
      root.style.setProperty("--text-1", mutedText);
      root.style.setProperty("--text-2", subtleText);
    }

    if (host.indexOf("wikipedia.org") !== -1) {
      var root = document.documentElement;
      root.style.setProperty("--background-color-base", bgColor);
      root.style.setProperty("--background-color-neutral-subtle", surfaceColor);
      root.style.setProperty("--background-color-interactive-subtle", surfaceColor);
      root.style.setProperty("--color-base", textColor);
      root.style.setProperty("--color-subtle", mutedText);
      root.style.setProperty("--color-emphasized", textColor);
      root.style.setProperty("--border-color-subtle", borderColor);
    }

    siteStyleEl.textContent = css;
  }

  function updateImageFilter(settings) {
    if (!imageStyleEl) {
      imageStyleEl = document.createElement("style");
      imageStyleEl.id = "amoled-images";
      document.documentElement.appendChild(imageStyleEl);
    }
    if (settings.imageFilter) {
      imageStyleEl.textContent = [
        "img:not(svg *),",
        "video,",
        "picture,",
        "canvas,",
        "[style*=\"background-image\"]:not(svg *),",
        "[style*=\"backgroundImage\"]:not(svg *) {",
        "  filter: brightness(" + settings.imageBrightness + "%) !important;",
        "}",
        "img:not(svg *) { background-color: transparent !important; }"
      ].join("\n");
    } else {
      imageStyleEl.textContent = "";
    }
  }

  function updateCustomCSS(settings) {
    if (!settings.customCSS) {
      if (customStyleEl) { customStyleEl.remove(); customStyleEl = null; }
      return;
    }
    if (!customStyleEl) {
      customStyleEl = document.createElement("style");
      customStyleEl.id = "amoled-custom-css";
      document.documentElement.appendChild(customStyleEl);
    }
    customStyleEl.textContent = settings.customCSS;
  }

  function detectDarkSite() {
    var html = document.documentElement;
    if (html.hasAttribute("dark")) return true;
    if (html.getAttribute("data-color-mode") === "dark") return true;
    if (html.getAttribute("data-theme") === "dark") return true;
    if (html.getAttribute("data-color-scheme") === "dark") return true;
    if (html.classList.contains("skin-theme-clientpref-night")) return true;
    var metas = document.querySelectorAll('meta[name="color-scheme"]');
    for (var i = 0; i < metas.length; i++) {
      if (metas[i].content && metas[i].content.indexOf("dark") !== -1) return true;
    }
    return false;
  }

  function applyTextOnlyCSS(settings) {
    if (!baseStyleEl) {
      baseStyleEl = document.createElement("style");
      baseStyleEl.id = "amoled-text-only";
      document.documentElement.appendChild(baseStyleEl);
    }
    var textColor = calculateTextColor(settings.brightness);
    baseStyleEl.textContent = [
      "p, span, div:not([style*='background']), li, td, th, h1, h2, h3, h4, h5, h6,",
      "label, article, section, nav, header, footer, main,",
      "aside, blockquote, figcaption, summary, details,",
      "dd, dt, small, strong, em, b, i, mark, time,",
      "cite, q, address {",
      "  color: " + textColor + " !important;",
      "}",
      "a { color: var(--amoled-link, #4dabf7) !important; }",
      "a:visited { color: var(--amoled-link-visited, #9775fa) !important; }",
    ].join("\n");
  }

  function restoreAll() {
    var all = document.querySelectorAll("[style*=\"--amoled-orig-bg\"]");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var orig = el.style.getPropertyValue("--amoled-orig-bg");
      if (orig) {
        el.style.backgroundColor = orig;
        el.style.removeProperty("--amoled-orig-bg");
      }
    }
    if (baseStyleEl) { baseStyleEl.remove(); baseStyleEl = null; }
    if (imageStyleEl) { imageStyleEl.remove(); imageStyleEl = null; }
    if (customStyleEl) { customStyleEl.remove(); customStyleEl = null; }
    if (siteStyleEl) { siteStyleEl.remove(); siteStyleEl = null; }
    var earlyEl = document.getElementById("amoled-early");
    if (earlyEl) earlyEl.remove();
    document.documentElement.classList.remove("amoled-active");
    var root = document.documentElement;
    root.style.removeProperty("--amoled-text-color");
    root.style.removeProperty("--amoled-bg");
    root.style.removeProperty("--amoled-surface");
    var props = SITE_OVERRIDE_PROPS;
    for (var i = 0; i < props.length; i++) {
      root.style.removeProperty(props[i]);
    }
  }

  function applyTheme(settings) {
    currentSettings = {};
    for (var key in DEFAULTS) {
      if (DEFAULTS.hasOwnProperty(key)) {
        currentSettings[key] = settings[key] !== undefined ? settings[key] : DEFAULTS[key];
      }
    }

    if (!currentSettings.enabled) {
      restoreAll();
      return;
    }

    isDarkSite = detectDarkSite();

    document.documentElement.classList.add("amoled-active");
    var root = document.documentElement;
    root.style.setProperty("--amoled-text-color", calculateTextColor(currentSettings.brightness));
    root.style.setProperty("--amoled-bg", getBgColor(currentSettings));
    root.style.setProperty("--amoled-surface", getSurfaceColor(currentSettings));

    if (isDarkSite) {
      applyTextOnlyCSS(currentSettings);
    } else {
      applyBaseCSS(currentSettings);
      applySiteSpecificCSS(currentSettings);
    }

    updateImageFilter(currentSettings);
    updateCustomCSS(currentSettings);

    if (!isDarkSite) {
      var target = document.body || document.documentElement;
      if (target) walkDOM(target, currentSettings);
    }
  }

  function startObserver() {
    var pendingNodes = [];
    var scheduled = false;
    var processCount = 0;

    function processPending() {
      scheduled = false;
      if (!currentSettings.enabled || pendingNodes.length === 0) {
        pendingNodes = [];
        return;
      }
      var batch = pendingNodes.splice(0, 50);
      for (var i = 0; i < batch.length; i++) {
        try {
          if (isDarkSite) {
            applyTextOnlyCSS(currentSettings);
          } else {
            processElement(batch[i], currentSettings);
            walkDOM(batch[i], currentSettings, true);
          }
        } catch (e) {}
      }
      processCount++;
      if (processCount > 100) {
        processCount = 0;
        if (isDarkSite) {
          applyTextOnlyCSS(currentSettings);
        } else {
          applyBaseCSS(currentSettings);
          applySiteSpecificCSS(currentSettings);
        }
      }
      if (pendingNodes.length > 0) {
        scheduled = requestAnimationFrame(processPending);
      }
    }

    observer = new MutationObserver(function(mutations) {
      if (!currentSettings.enabled) return;
      for (var m = 0; m < mutations.length; m++) {
        var mutation = mutations[m];
        if (mutation.type === "attributes") {
          var target = mutation.target;
          if (target.nodeType === 1 && !isElementProtected(target)) {
            pendingNodes.push(target);
          }
        } else {
          var added = mutation.addedNodes;
          for (var n = 0; n < added.length; n++) {
            if (added[n].nodeType === 1) {
              pendingNodes.push(added[n]);
            }
          }
        }
      }
      if (pendingNodes.length > 0 && !scheduled) {
        scheduled = requestAnimationFrame(processPending);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-theme", "data-color-scheme"]
    });
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === "settings-update") {
      restoreAll();
      applyTheme(message.settings);
      sendResponse({ ok: true });
    } else if (message.type === "getSettings") {
      sendResponse(currentSettings);
    }
    return true;
  });

  function injectStyleToHead() {
    if (!document.documentElement) return false;
    var style = document.createElement("style");
    style.id = "amoled-early";
    style.textContent = "html.amoled-active{background:#000!important;color-scheme:dark!important}html.amoled-active body{background:#000!important}";
    (document.head || document.documentElement).appendChild(style);
    return true;
  }

  function init() {
    if (!document.head) {
      document.addEventListener("DOMContentLoaded", function retryInit() { init(); }, { once: true });
      return;
    }
    chrome.storage.sync.get(DEFAULTS, function(stored) {
      applyTheme(stored);
      startObserver();
    });
  }

  if (document.documentElement) {
    injectStyleToHead();
  }
  document.addEventListener("DOMContentLoaded", function() {
    injectStyleToHead();
    init();
  }, { once: true });

  if (document.body || document.head) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  }

  window.__amoledBlack = {
    getSettings: function() { return currentSettings; },
    siteHandled: function() { return true; },
    isDarkSite: function() { return isDarkSite; }
  };
})();
