# X (Twitter) DOM Structure & CSS Research Report
## For AMOLED Dark Theme Browser Extension
## Based on live site analysis (March 2026) + community userstyle research

---

## 1. CSS Class Naming Convention

X uses **Hashed Utility Classes (Atomic CSS)** — NOT BEM, NOT semantic.

### Two class systems coexist:

#### a) Reset/Base classes — `css-XXXXXXXX` (7-char hash)
These are **stable, human-readable names with a content hash** applied by a custom CSS-in-JS system:
```css
.css-146c3p1  /* Reset: background-color transparent, display inline, etc. */
.css-175oi2r  /* Core flexbox column container — THE most common wrapper class */
.css-1jxf684  /* Inherit-all pass-through element */
.css-9pa8cd   /* Absolute-positioned image overlay (used on ALL avatars/images) */
```

#### b) Atomic utility classes — `r-XXXXXXXX` (7-char hash)
These are **single-property utilities** akin to Tailwind:
```css
/* Layout */
.r-13awgt0    { flex: 1 }
.r-6koalj     { display: flex }
.r-1oszu61    { align-items: stretch }
.r-18u37iz    { flex-direction: row }
.r-eqz5dr     { flex-direction: column }
.r-xoduu5     { display: inline-flex }
.r-13qz1uu    { width: 100% }
.r-q4m81j     { text-align: center }
.r-fdjqy7     { text-align: left }

/* Sizing */
.r-1mwlp6a    { height: 56px }    /* Sidebar nav item height */
.r-18tzken    { width: 56px }     /* Sidebar nav item width */
.r-z80fyv     { height: 20px }    /* Icon size */
.r-lrsllp     { width: 24px }
.r-12ym1je    { width: 18px }

/* Colors */
.r-18jsvk2    { color: rgba(15,20,25,1.00) }     /* --color-text-primary (light mode) */
.r-14j79pv    { color: rgba(83,100,113,1.00) }    /* --color-text-secondary/muted */
.r-1nao33i    { color: rgba(231,233,234,1.00) }   /* --color-text-on-dark */
.r-54znze     { color: rgba(239,243,244,1.00) }   /* --color-text-bright-white */

/* Backgrounds */
.r-kemksi     { background-color: rgba(0,0,0,1.00) }   /* PURE BLACK — main dark bg */
.r-14lw9ot    { background-color: rgba(255,255,255,1.00) } /* PURE WHITE — main light bg */
.r-x572qd     { background-color: rgba(247,249,249,1.00) } /* Near-white, light mode cards */
.r-6026j      { background-color: rgba(255,255,255,0.85) } /* Sticky header light mode */
.r-2tavb8     { background-color: rgba(0,0,0,0.60) }    /* Overlay/dimmed bg */
.r-1to6hqq    { background-color: rgba(255,212,0,1.00) } /* Yellow/gold accent */
.r-1oifz5y    { background-color: rgba(170,17,0,1.00) }  /* Notification badge red */

/* Typography */
.r-1qd0xha    { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ... }
.r-fm7h5w     { font-family: "TwitterChirpExtendedHeavy" }  /* Custom X font */
.r-1inkyih    { font-size: 17px }
.r-1b43r93    { font-size: 14px }
.r-b88u0q     { font-weight: 700 }
.r-1vr29t4    { font-weight: 800 }
.r-16dba41    { font-weight: 400 }
.r-rjixqe     { line-height: 20px }
.r-135wba7    { line-height: 24px }
.r-ueyrd6     { line-height: 36px }

/* Border radius */
.r-sdzlij     { border-radius: 9999px }  /* Pill / circle */
.r-1jkafct    { border-radius: 2px }
.r-z2wwpe     { border-radius: 4px }
.r-1phboty    { border-style: solid }
.r-rs99b7     { border-width: 1px }
.r-4iw3lz     { border-width: 0 }
.r-vqxq0j     { border: 0 solid black }  /* Reset */

/* Interactions */
.r-1loqt21    { cursor: pointer }
.r-lrvibr     { user-select: none }
.r-1xnzce8    { user-select: text }
.r-1otgn73    { touch-action: manipulation }

/* Visibility / Opacity */
.r-hvic4v     { display: none }
.r-orgf3d     { opacity: 0 }
.r-icoktb     { opacity: 0.5 }
.r-yyyyoo     { fill: currentcolor }  /* SVG inherit color */

/* Transitions */
.r-6416eg     { transition: background-color, box-shadow }
.r-o7ynqc     { transition-duration: 0.2s }

/* Filters */
.r-xigjrr     { filter: blur(4px) }
.r-gf0ln      { filter: brightness(1) }
```

### KEY INSIGHT:
The hashes are **STABLE per deployment** (they change when X deploys new code), but they're **NOT random per user**. They're deterministic hashes of the CSS rule content. This means you CANNOT rely on class names alone — they WILL break on X updates.

---

## 2. Dark/Light Mode Implementation

### How X toggles themes:

X uses **a combination of approaches**:

#### a) `<body>` inline style (PRIMARY mechanism):
```html
<body style="background-color: #000000;">    <!-- Dark mode -->
<body style="background-color: #FFFFFF;">    <!-- Light mode -->
```
This is the **most reliable signal** of the current theme.

#### b) `data-theme` attribute on `<html>` or `<:root>`:
```css
:root[data-theme="dark"] { ... }
```
The "X Grey Theme" userstyle confirms this exists.

#### c) `data-color-scheme` on body:
```html
<body data-color-scheme="dark">
```

#### d) CSS custom properties (used internally by X's newer components):
```css
:root {
  --background: ...;       /* HSL value */
  --foreground: ...;       /* HSL value */
  --color-gray-0: 225 9.3% 16.9%;    /* Darkest gray */
  --color-gray-50: 0 0% 19.2%;       /* Dark separator */
  --color-gray-200: 210 6% 21%;      /* Mid gray */
  --jbgo: 1;                            /* Background opacity */
  --z-grok-grey: 240, 4.3%, 9%;       /* Grok panel grey */
  --z-x-grey: 220 5% 12%;             /* X panel grey */
  --foreground: 200 7% 91%;
  --border: 210 7% 18%;
}
```
These are **HSL values without the `hsl()` wrapper** — used like:
```css
background-color: hsl(var(--background));
```

#### e) `<meta name="theme-color">`:
```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
```

#### f) SVG color inheritance:
```css
.r-yyyyoo { fill: currentcolor; }
```
ALL X SVG icons use `fill: currentcolor` — they inherit text color.

### Theme Detection for Extension:
```javascript
// Most reliable theme detection:
function isDarkMode() {
  const bodyBg = document.body.style.backgroundColor;
  const dataTheme = document.documentElement.getAttribute('data-theme');
  const dataScheme = document.body.getAttribute('data-color-scheme');
  
  if (bodyBg.includes('0, 0, 0')) return true;
  if (bodyBg.includes('255, 255, 255')) return false;
  if (dataTheme === 'dark') return true;
  if (dataScheme === 'dark') return true;
  
  // Fallback
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
```

---

## 3. What Breaks with `background-color: #000` / `color` Overrides

### Elements that WILL break if you naively force `background: #000`:

| Element | Problem | Class/Selector |
|---------|---------|----------------|
| **Avatar images** | `img.css-9pa8cd` has `opacity: 0` — it's behind a container with the real background. Forcing bg on the img parent breaks avatar display | `.css-9pa8cd` |
| **Notification badges** | Red dots use `background-color: rgba(170,17,0,1.00)` (`.r-1oifz5y`). Forcing parent bg black hides them | `.r-1oifz5y` |
| **Media overlays** | Video/image dim overlays use `rgba(0,0,0,0.60)` (`.r-2tavb8`). Making parent black makes these invisible | `.r-2tavb8` |
| **Modal/dialog backdrops** | Use semi-transparent black. Pure black parent makes them indistinguishable | `.r-2tavb8`, `.r-633pao` |
| **Tooltip backgrounds** | Some tooltips use `.r-6026j` (white with 0.85 opacity) | `.r-6026j` |
| **Compose box focus ring** | Box-shadow inset for focus states | `.r-12181gd` |
| **Card link previews** | Cards have their own bg, need to be handled separately | `.r-18jsvk2` |
| **Quote tweet borders** | Visual separation lost with black bg | `.r-1phboty` |
| **Separator lines** | Used between tweets, become invisible | border-related `.r-*` classes |
| **Verified/Org badges** | SVG with `fill: currentcolor` — inherits wrong color if text color changed | `.r-yyyyoo` |
| **Gradient text** | Premium/verified labels use `background-clip: text` | Various inline styles |
| **Grok panel** | Uses `hsla(var(--background) / 0.65)` for semi-transparent bg | `.r-5zmot` |
| **Loading skeletons** | Use opacity and transitions — become invisible on black | `.r-orgf3d`, `.r-clrlgt` |
| **Blur effects** | `.r-xigjrr` applies blur — looks wrong on solid black bg | `.r-xigjrr` |
| **Hover states** | Transitions on `.r-6416eg` (bg, box-shadow) — need to be preserved |

### Elements that are SAFE to force black:
- `body` (already black in dark mode)
- `.r-kemksi` (main background containers)
- `header[role="banner"]` (sidebar)
- `.css-175oi2r` top-level layout containers

---

## 4. DOM Structure per Component

### A) Main Feed/Timeline
```
[data-testid="primaryColumn"]
  └── main
       └── div.css-175oi2r
            ├── section[aria-label="Timeline"]
            │    └── div
            │         └── [data-testid="cellInnerDiv"]    ← EACH TWEET
            │              ├── time (timestamp)
            │              ├── article (tweet content)
            │              └── div.css-175oi2r (actions bar)
            └── [data-testid="toolBar"]                    ← Tab bar (For You / Following)
```

**Key selectors:**
- `[data-testid="primaryColumn"]` — Main column
- `[data-testid="cellInnerDiv"]` — Individual tweet wrapper
- `[aria-label="Timeline: *"]` — Timeline section
- `[data-testid="toolBar"]` — Tab navigation bar

### B) Profile Pictures / Avatars
```
a[href*="/"] > div.css-175oi2r > div.css-1dbjc4n > div.css-1dbjc4n.r-1mi0q7o
  └── div.css-175oi2r.r-1kihuf0.r-1udh08x.r-13awgt0.r-417010  (container with border-radius)
       ├── div.css-175oi2r.r-1niwhzg.r-1pi2tsx (bg layer)
       └── img.css-9pa8cd (actual image, opacity: 0, absolute positioned)
            src="https://pbs.twimg.com/profile_images/..."
```

**KEY INSIGHT:** The image uses `opacity: 0` with the visible version shown through a background container. The `.css-9pa8cd` img is a full-cover overlay for sizing, NOT the visible image.

**Selectors to target:**
- `img.css-9pa8cd` — Profile image (invisible, for sizing)
- `.r-417010` — Avatar container
- `[src*="pbs.twimg.com/profile_images"]` — Profile image by URL

### C) Verified Badges
Verified badges are **SVG elements** using `fill: currentcolor`:
```
svg.r-4qtqp9.r-yyyyoo.r-1xvli5t.r-dnmrzs.r-bnwqim.r-1plcrui.r-lrvibr.r-1hdv0qi
  └── g > path (the badge shape)
```

**Badge types identified by parent context:**
- Blue verified: inside tweet user info
- Gold verified: `.r-1to6hqq` yellow bg container
- Grey check: Organization verified
- X Premium badge: `.r-uaa2di` class

**Selectors:**
- `svg[aria-label="Verified account"]` — Blue checkmark
- `[href*="/i/premium_sign_up"]` — Premium upsell
- `[href*="/i/verified-choose"]` — Verification upsell
- `div[data-testid="super-upsell-UpsellCardRenderProperties"]` — Premium promo card

### D) Like / Retweet / Reply Buttons
```
div.css-175oi2r.r-1awozwy.r-18u37iz.r-1wvnqe0
  ├── div[role="group"] > div.css-175oi2r    ← Reply button container
  │    └── div.r-18u37iz > button[data-testid="reply"]
  │         ├── div.css-175oi2r.r-1niwhzg.r-1pi2tsx
  │         │    └── div.r-1kihuf0 > svg (reply icon)
  │         └── span.css-175oi2r (count)
  ├── div[role="group"] > div.css-175oi2r    ← Retweet button container
  │    └── button[data-testid="retweet"]
  │         ├── svg (retweet icon)
  │         └── span (count)
  └── div[role="group"] > div.css-175oi2r    ← Like button container
       └── button[data-testid="like"]
            ├── svg (heart icon, fill: currentcolor)
            └── span (count)
```

**Interactive selectors:**
- `button[data-testid="reply"]`
- `button[data-testid="retweet"]`
- `button[data-testid="like"]`
- `button[data-testid="bookmark"]`
- `button[data-testid="share"]`

**COLOR STATES:**
- Default: Uses text color (`.r-yyyyoo` fill: currentcolor)
- Liked (blue heart): The SVG `path` fill changes to `#1d9bf0` (X blue) via inline style
- Retweeted (green): The SVG `path` fill changes to `#00ba7c` via inline style

### E) Sidebar Navigation
```
header[role="banner"]
  └── div.css-175oi2r
       ├── a[href="/home"] > div.css-175oi2r.r-1oifz5y (notification dot)
       │    └── svg (home icon)
       ├── a[href="/explore"] > div > svg
       ├── a[href="/notifications"] > div > svg
       ├── a[href="/messages"] > div > svg
       ├── a[href="/grok"] > div > svg
       ├── a[href="/lists"] > div > svg
       ├── a[href="/bookmarks"] > div > svg
       ├── a[href="/communities"] > div > svg
       ├── a[href="/i/premium_sign_up"] > div > svg
       ├── a[href="/i/verified-choose"] > div > svg
       ├── a[href="/"] > div > svg (profile/compose)
       └── button > div > svg (more)
```

**Selectors:**
- `header[role="banner"]` — Sidebar container
- `[aria-label="Home"]`, `[aria-label="Notifications"]`, etc. — Nav items by aria-label
- `a[href="/home"]`, `a[href="/explore"]`, etc. — Nav items by href

### F) Modal Dialogs
```
div[role="dialog"]                                           ← Modal wrapper
  ├── div.css-175oi2r.r-1niwhzg.r-1pi2tsx (backdrop)        ← `.r-2tavb8` semi-transparent
  └── div.css-175oi2r (dialog content)
       ├── h2[role="heading"] (title)
       └── div.css-175oi2r (content area)
```

**Selectors:**
- `div[role="dialog"]` — Any modal
- `[aria-modal="true"]` — Explicit modal marker
- `.r-633pao` — `pointer-events: none!important` on overlay parent
- `.r-12vffkv` — `pointer-events: none!important` container

### G) Media Elements (Images, Videos, Cards)
```
[data-testid="cellInnerDiv"]
  └── article
       └── div.css-175oi2r.r-9aw3ui (media container)
            ├── div.css-175oi2r.r-1adg3ll.r-1udh08x  (image/video wrapper)
            │    └── a[href*="pbs.twimg.com/media/"]
            │         └── div.css-175oi2r.r-1niwhzg
            │              └── img.css-9pa8cd  (media image)
            └── [data-testid="card.wrapper"]  (link card preview)
                 ├── a[href] (link)
                 └── div (card content: title, description, image)
```

**Selectors:**
- `img.css-9pa8cd` — All images (profile, media, emoji)
- `[data-testid="card.wrapper"]` — URL preview cards
- `[data-testid="videoPlayer"]` — Video players
- `a[href*="pbs.twimg.com/media/"]` — Media image links
- `.r-9aw3ui` — Media container within tweets
- `.r-1adg3ll.r-1udh08x` — Media wrapper (overflow hidden)

### H) Compose Box
```
[data-testid="tweetTextarea_0"]    ← Main compose text input
  └── div[contenteditable="true"] (rich text editor)

[data-testid="tweetButtonInline"]  ← Post button
[data-testid="tweetButton"]        ← Post button (modal)

[data-testid="attachmentButtons"]  ← Media attachment bar
  └── button[data-testid="photoUploadButton"]
  └── button[data-testid="gifButton"]
  └── button[data-testid="pollButton"]
  └── button[data-testid="emojiButton"]
  └── button[data-testid="scheduleButton"]
```

### I) Notification Badges (Red Dots)
```
a[href="/notifications"]
  └── div.css-175oi2r
       ├── svg (bell icon)
       └── div.css-175oi2r.r-1oifz5y.r-1niwhzg.r-1pi2tsx  ← RED DOT
            style="width: ...; height: ...; background-color: rgb(239, 68, 68)"
```

**Selectors:**
- `.r-1oifz5y` — The red badge background class
- `[style*="rgb(239, 68, 68)"]` — By inline color
- `.r-8jfcpp` — `top: -2px` positioning
- `.r-1q6cnnd` — `right: -2px` positioning
- `.r-5f1w11` — `left: -2px` positioning

---

## 5. Interactive Elements vs Content

### Identifying INTERACTIVE elements:

| Type | Selector Pattern |
|------|-----------------|
| **Buttons** | `button[data-testid="*"]` |
| **Links** | `a[href]` inside `.css-175oi2r` |
| **Clickable divs** | `div.r-1loqt21` (has `cursor: pointer`) |
| **Selectable** | `div.r-1xnzce8` (has `user-select: text`) |
| **Non-selectable (UI)** | `div.r-lrvibr` (has `user-select: none`) |
| **Pointer-events pass-through** | `.r-12vffkv` (children have `pointer-events: auto`) |
| **Pointer-events: auto (interactive)** | `.r-105ug2t` (forced pointer-events) |
| **Touch target** | `.r-1otgn73` (has `touch-action: manipulation`) |
| **Input fields** | `input`, `textarea`, `div[contenteditable="true"]`, `[data-testid="tweetTextarea*"]` |
| **Role-based** | `[role="button"]`, `[role="link"]`, `[role="tab"]`, `[role="switch"]` |
| **Hover transitions** | `.r-6416eg` (transitions on bg, box-shadow) |
| **Min touch size (44px)** | `.r-peo1c`, `.r-1ps3wis`, `.r-vkv6oe` |

### Identifying CONTENT elements:

| Type | Selector Pattern |
|------|-----------------|
| **Tweet text** | `div[lang]` inside `[data-testid="cellInnerDiv"]` |
| **Username** | `div.css-175oi2r` containing `span.css-175oi2r.r-bcqeeo` with `a[href^="/"]` |
| **Timestamp** | `time` element inside `[data-testid="cellInnerDiv"]` |
| **Display name** | `span.css-175oi2r.r-b88u0q` (font-weight: 700) inside tweet header |
| **Images** | `img.css-9pa8cd[src*="pbs.twimg.com"]` |
| **Videos** | `[data-testid="videoPlayer"]`, `video` element |
| **Hashtags/mentions** | `a[href^="/hashtag/"]`, `a[href^="/search?q="]` |

### `<main>` and `<section>` structure:
```
#react-root
  └── div.css-175oi2r (root layout)
       ├── header[role="banner"]               ← LEFT SIDEBAR
       ├── main
       │    └── [data-testid="primaryColumn"]  ← MAIN FEED
       └── [data-testid="sidebarColumn"]       ← RIGHT SIDEBAR (trending, who to follow)
```

---

## 6. Recommended Selector Strategy for AMOLED Extension

### USE THESE (stable, semantic):
```css
/* Layout */
body
header[role="banner"]
[data-testid="primaryColumn"]
[data-testid="sidebarColumn"]
[data-testid="cellInnerDiv"]
[data-testid="toolBar"]
[data-testid="ScrollSnap-List"]

/* Components */
button[data-testid="reply"]
button[data-testid="retweet"]
button[data-testid="like"]
button[data-testid="bookmark"]
button[data-testid="share"]
button[data-testid="tweetButtonInline"]
[data-testid="tweetTextarea_0"]
[data-testid="card.wrapper"]
[data-testid="videoPlayer"]
div[role="dialog"]
[aria-label="Timeline: *"]
[aria-label="Primary Column"]
```

### USE WITH CAUTION (atomic, may change):
```css
/* Backgrounds - these change with X deployments */
.r-kemksi         /* Main dark bg (already black) */
.r-14lw9ot        /* Main light bg */
.r-x572qd         /* Light mode card bg */
.r-6026j          /* Sticky header light mode */
.r-2tavb8         /* Overlay/dim */
.r-1oifz5y        /* Red notification badge */

/* Layout - relatively stable */
.css-175oi2r      /* THE universal flex container */
.css-9pa8cd       /* Image overlay (opacity: 0) */
.css-1dbjc4n      /* Another common wrapper */

/* Text colors */
.r-18jsvk2        /* Primary text (light mode) */
.r-1nao33i        /* Text on dark */
.r-14j79pv        /* Muted/secondary text */
.r-54znze         /* Bright white text */
```

### AVOID targeting directly:
- Inline `style` attributes (X changes them frequently)
- Purely hashed class names without semantic meaning
- SVG internal `path` attributes
- `[stylesheet-group="*"]` rules (internal only)

---

## 7. MutationObserver Strategy

X is a **React SPA** — content loads dynamically. You MUST use MutationObserver:

```javascript
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      applyAmoledTheme(mutation.target);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
```

Also observe **`<body>` style changes** for theme switching:
```javascript
const bodyObserver = new MutationObserver(() => {
  const bg = document.body.style.backgroundColor;
  if (bg.includes('255, 255, 255')) {
    // Switched to light mode — apply amoled overrides
  }
});
bodyObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['style', 'data-color-scheme']
});
```

---

## 8. Grok Panel (New in 2025-2026)

The Grok AI chat panel uses **Tailwind-like CSS variables** that differ from the rest of X:

```css
/* Grok-specific variables */
--z-grok-grey: 240, 4.3%, 9%;
--z-x-grey: 220 5% 12%;
--color-gray-0: 225 9.3% 16.9%;
--color-gray-50: 0 0% 19.2%;
--color-gray-200: 210 6% 21%;
--jbgo: 1;  /* background opacity */
```

**Grok selectors:**
- `[aria-label*="Grok"]` — Grok-related elements
- `[data-testid*="Grok"]` — Grok components
- `.r-5zmot` — Grok floating panel/button background
- `[data-testid="chat-drawer-root"]` — Grok chat drawer
- `.r-1qeg2u0` — Grok suggested action buttons
- `.jf-element .j-vdda9x11` — Grok internal containers

---

## 9. Complete Color Palette Reference

### Light Mode:
| Role | CSS Class | Value |
|------|-----------|-------|
| Primary text | `.r-18jsvk2` | `rgba(15,20,25,1.00)` (#0F1419) |
| Secondary text | `.r-14j79pv` | `rgba(83,100,113,1.00)` (#536471) |
| Background | `.r-14lw9ot` | `rgba(255,255,255,1.00)` |
| Card/section bg | `.r-x572qd` | `rgba(247,249,249,1.00)` (#F7F9F9) |
| Sticky header | `.r-6026j` | `rgba(255,255,255,0.85)` |
| Border | Various | `rgba(0,0,0,0.00)` → `rgba(239,243,244,0.20)` |

### Dark Mode (default X dark — NOT AMOLED):
| Role | CSS Class | Value |
|------|-----------|-------|
| Primary text | `.r-1nao33i` | `rgba(231,233,234,1.00)` (#E7E9EA) |
| Secondary text | `.r-14j79pv` | `rgba(113,118,123,1.00)` (#71767B) |
| Bright text | `.r-54znze` | `rgba(239,243,244,1.00)` (#EFF3F4) |
| Background | `.r-kemksi` | `rgba(0,0,0,1.00)` (#000000) |
| Card/section bg | `.r-x572qd` → overridden | `rgba(21,32,43,1.00)` (#15202B) or `rgba(0,0,0,1.00)` |
| Overlay | `.r-2tavb8` | `rgba(0,0,0,0.60)` |
| Notification red | `.r-1oifz5y` | `rgba(170,17,0,1.00)` or `rgb(239, 68, 68)` |
| Yellow accent | `.r-1to6hqq` | `rgba(255,212,0,1.00)` |

### AMOLED target overrides needed:
| Element | Current dark | Target AMOLED |
|---------|-------------|---------------|
| Body bg | #000000 | #000000 (already good) |
| Card/section bg | #15202B or #000000 | #000000 |
| Sidebar bg | #000000 | #000000 |
| Sticky header | rgba(0,0,0,0.65) | #000000 |
| Hover states | rgba(255,255,255,0.07) | #0a0a0a or #111 |
| Active tab underline | #1d9bf0 | #1d9bf0 (preserve) |
| Modal backdrop | rgba(91,112,131,0.4) | #000000 |
| Separator lines | rgba(255,255,255,0.1) | #111111 |
| Input bg | #000000 | #000000 (already good) |
| Grok panel bg | #0d1117 or similar | #000000 |

---

## 10. Summary: Extension Architecture Recommendations

1. **Target `data-testid` attributes** — these are the most stable selectors
2. **Target `role` and `aria-label` attributes** — semantically meaningful, rarely change
3. **Avoid hashed class names as sole selectors** — they break on X deployments
4. **Watch `body[style]` and `data-color-scheme` for theme changes**
5. **Use MutationObserver** — SPA, content loads dynamically
6. **Preserve notification badge colors** — explicitly exempt `.r-1oifz5y` and `[style*="rgb(239, 68, 68)"]`
7. **Preserve SVG `fill: currentcolor`** — don't override, let inherited color work
8. **Handle hover/focus states** — maintain `.r-6416eg` transitions
9. **Handle modals separately** — `div[role="dialog"]` and backdrops
10. **Test Grok panel** — uses different CSS variable system
