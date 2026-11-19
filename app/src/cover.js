// Solmar Bay cover renderer: lays out the multi-panel poster for a post size,
// fills each panel with a drawn scene or a photo, grades it, and letters the
// slanted title band. Everything is drawn on a 2D canvas; renderCover draws one
// complete cover at any pixel size, so the editor preview and the PNG export
// share the same drawing code.

import { GRADES, SCENES } from './scenes.js';

/** The three post sizes the app exports. */
export const SIZES = {
  square: { name: 'Square', w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  portrait: { name: 'Portrait', w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  wide: { name: 'Wide', w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** A panel's outline as a polygon of fractions of the cover (x, y in 0..1). */
function heroWide() {
  return [
    [0, 0], [0.6, 0], [0.545, 0.82], [0, 0.82],
  ];
}
function sideWideTop() {
  return [
    [0.615, 0], [1, 0], [1, 0.41], [0.56, 0.41],
  ];
}
function sideWideBottom() {
  return [
    [0.56, 0.425], [1, 0.425], [1, 0.82], [0.545, 0.82],
  ];
}
function heroSquare() {
  return [
    [0, 0], [1, 0], [1, 0.5], [0, 0.56],
  ];
}
function lowerSquareLeft() {
  return [
    [0, 0.575], [0.5, 0.515], [0.5, 0.8], [0, 0.8],
  ];
}
function lowerSquareRight() {
  return [
    [0.515, 0.515], [1, 0.515], [1, 0.8], [0.515, 0.8],
  ];
}
function heroPortrait() {
  return [
    [0, 0], [1, 0], [1, 0.42], [0, 0.47],
  ];
}
function midPortraitLeft() {
  return [
    [0, 0.485], [0.5, 0.44], [0.5, 0.7], [0, 0.7],
  ];
}
function midPortraitRight() {
  return [
    [0.515, 0.44], [1, 0.44], [1, 0.7], [0.515, 0.7],
  ];
}

/** Panel polygons per size: [hero, second, third], plus the title band's top. */
export const LAYOUTS = {
  wide: { panels: [heroWide(), sideWideTop(), sideWideBottom()], bandTop: 0.82 },
  square: { panels: [heroSquare(), lowerSquareLeft(), lowerSquareRight()], bandTop: 0.8 },
  portrait: { panels: [heroPortrait(), midPortraitLeft(), midPortraitRight()], bandTop: 0.7 },
};

/** Point-in-polygon test on a fractional polygon, for picking a panel by click. */
export function panelAt(sizeId, fx, fy) {
  const polys = LAYOUTS[sizeId].panels;
  for (let i = 0; i < polys.length; i++) {
    const poly = polys[i];
    let inside = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [ax, ay] = poly[a];
      const [bx, by] = poly[b];
      if (ay > fy !== by > fy && fx < ((bx - ax) * (fy - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return i;
  }
  return -1;
}

/** Draw an image cover-fitting a rectangle, with zoom and pan offsets in fractions. */
function drawPhotoCover(ctx, img, x, y, w, h, fill) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = fill.zoom || 1;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 + (fill.ox || 0) * w;
  const dy = y + (h - dh) / 2 + (fill.oy || 0) * h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Fill one panel: a drawn scene, or a photo the user placed. */
function fillPanel(ctx, poly, fill, pal, images) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.clip();
  if (fill.type === 'photo') {
    const img = images[fill.key];
    if (img) {
      drawPhotoCover(ctx, img, x0, y0, x1 - x0, y1 - y0, fill);
    } else {
      ctx.fillStyle = '#241a4a';
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  } else {
    const scene = SCENES[fill.scene] || SCENES.dani;
    scene.paint(ctx, x0, y0, x1 - x0, y1 - y0, pal);
  }
  ctx.restore();
}

/** A warm or neon wash over the whole art area, plus a vignette. */
function gradeWash(ctx, w, h, bandTop, pal) {
  const artH = h * bandTop;
  const g = ctx.createLinearGradient(0, 0, 0, artH);
  g.addColorStop(0, 'rgba(255,120,80,0)');
  g.addColorStop(1, hexA(pal.accent, 0.12));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, artH);
  ctx.fillStyle = hexA(pal.accent, 0.03);
  ctx.fillRect(0, 0, w, artH);
  const v = ctx.createRadialGradient(w / 2, artH / 2, Math.min(w, artH) * 0.35, w / 2, artH / 2, Math.max(w, artH) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,5,30,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, artH);
}

/** '#rrggbb' plus an alpha, as an rgba() string. */
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Fit a font size so the text fits maxW, starting from startPx. */
function fitFont(ctx, text, startPx, maxW, weight, family) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

/** The slanted white title band: stripe, big title, subtitle, tagline. */
function titleBand(ctx, w, h, bandTop, state, pal) {
  const y0 = h * bandTop;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, y0, w, h - y0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y0, w, h - y0);
  ctx.clip();
  ctx.fillStyle = pal.accent;
  ctx.save();
  ctx.translate(0, y0 + (h - y0) * 0.32);
  ctx.rotate(-0.045);
  ctx.fillRect(-w * 0.05, -h * 0.028, w * 1.1, h * 0.056);
  ctx.restore();
  ctx.restore();
  const cx = w / 2;
  const title = (state.title || 'SOLMAR BAY').toUpperCase();
  const sub = (state.subtitle || '').toUpperCase();
  const tag = state.tagline || '';
  const bandH = h - y0;
  const titlePx = fitFont(ctx, title, bandH * 0.52, w * 0.92, 900, 'Arial Black, Arial, sans-serif');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#160f33';
  ctx.font = `900 ${titlePx}px 'Arial Black', Arial, sans-serif`;
  ctx.fillText(title, cx, y0 + bandH * 0.42);
  if (sub) {
    ctx.fillStyle = pal.accent;
    ctx.font = `800 ${Math.round(bandH * 0.13)}px Arial, sans-serif`;
    ctx.fillText(sub, cx, y0 + bandH * 0.68);
  }
  if (tag) {
    ctx.fillStyle = '#4a3a78';
    ctx.font = `italic 600 ${Math.round(bandH * 0.115)}px Georgia, serif`;
    ctx.fillText(tag, cx, y0 + bandH * 0.87);
  }
}

/**
 * Draw one complete cover onto ctx at pixel size (w, h).
 * state: { size, grade, title, subtitle, tagline, panels: [fill, fill, fill] }
 * images: a map from photo keys ('sample:pier', 'sample:boulevard', 'upload:0'...)
 *   to loaded HTMLImageElements.
 */
export function renderCover(ctx, w, h, state, images) {
  const pal = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.size] || LAYOUTS.wide;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const polys = layout.panels.map((poly) => poly.map(([fx, fy]) => [fx * w, fy * h]));
  for (let i = 0; i < 3; i++) {
    fillPanel(ctx, polys[i], state.panels[i], pal, images);
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, w * 0.006);
  for (const poly of polys) {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
    ctx.stroke();
  }
  gradeWash(ctx, w, h, layout.bandTop, pal);
  titleBand(ctx, w, h, layout.bandTop, state, pal);
  ctx.restore();
}

/** A fresh default state: hero Dani, boat chase, lighthouse, Sunset grade. */
export function defaultState() {
  return {
    size: 'wide',
    grade: 'sunset',
    title: 'SOLMAR BAY',
    subtitle: 'DANI REYES',
    tagline: 'One last drive. One way home.',
    panels: [
      { type: 'scene', scene: 'dani', zoom: 1, ox: 0, oy: 0 },
      { type: 'scene', scene: 'boat', zoom: 1, ox: 0, oy: 0 },
      { type: 'scene', scene: 'lighthouse', zoom: 1, ox: 0, oy: 0 },
    ],
  };
}
