function parseRGB(colorStr) {
  if (!colorStr) return { r: 0, g: 0, b: 0 };
  const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : { r: 0, g: 0, b: 0 };
}

function luminance(r, g, b) {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getContrastRatio(bgColor, textColor) {
  const bg = parseRGB(bgColor);
  const text = parseRGB(textColor);
  const bgLum = luminance(bg.r, bg.g, bg.b);
  const textLum = luminance(text.r, text.g, text.b);
  return contrastRatio(bgLum, textLum);
}

module.exports = { parseRGB, luminance, contrastRatio, getContrastRatio };
