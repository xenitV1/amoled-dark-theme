const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3456;
const FIXTURES_DIR = path.join(__dirname);

const routes = {
  '/': 'light-site.html',
  '/light': 'light-site.html',
  '/dark': 'dark-site.html',
  '/complex': 'complex-site.html',
  '/youtube': 'youtube-mock.html',
  '/github': 'github-mock.html',
  '/dynamic': 'dynamic-site.html',
  '/gradient': 'gradient-site.html',
  '/images': 'image-heavy-site.html',
  '/grid-layout': 'grid-layout-site.html',
  '/flexbox-spa': 'flexbox-spa.html',
  '/shadow-dom': 'shadow-dom-site.html',
  '/framework': 'framework-mock.html',
  '/inline-styles': 'inline-style-site.html',
  '/css-variables': 'css-variables-site.html',
  '/fixed-overlay': 'fixed-overlay-site.html',
  '/svg-heavy': 'svg-heavy-site.html',
  '/data-table': 'data-table-site.html',
  '/ecommerce': 'ecommerce-mock.html',
  '/infinite-scroll': 'infinite-scroll.html',
  '/dark-toggle': 'dark-toggle-site.html',
  '/rtl': 'rtl-site.html',
  '/print-media': 'print-media-site.html',
  '/canvas': 'canvas-site.html',
};

for (const [route, file] of Object.entries(routes)) {
  app.get(route, (req, res) => {
    const filePath = path.join(FIXTURES_DIR, file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send(`Fixture not found: ${file}`);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});
