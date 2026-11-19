// cover.js — the cover layout: sizes, diagonal panels, photo fit, title band.
// One canvas holds the whole cover. Three panels are split by two slanted
// dividers: vertical slants for landscape and square, horizontal slants
// for portrait. A slanted title band across the bottom carries the caption.

import { paintScene, applyGrade, gradeAccent } from './scenes.js';

export const SIZES = {
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 × 1080' },
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
};

export const DEFAULT_TITLE = 'SOLMAR BAY';
export const DEFAULT_SUBTITLE = 'DANI REYES';
export const DEFAULT_TAGLINE = 'One last drive. One last chance.';

export function defaultPanels() {
  return [
    { kind: 'scene', scene: 'sunset', photo: null, zoom: 1, dx: 0, dy: 0 },
    { kind: 'scene', scene: 'boat', photo: null, zoom: 1, dx: 0, dy: 0 },
    { kind: 'scene', scene: 'lighthouse', photo: null, zoom: 1, dx: 0, dy: 0 },
  ];
}

export function defaultState() {
  return {
    size: 'landscape',
    grade: 'sunset',
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
    tagline: DEFAULT_TAGLINE,
    panels: defaultPanels(),
    selected: 0,
  };
}

// Slant of the dividers, as a fraction of the short side.
const SLANT = 0.045;

// Panel polygons for a size: three clipped regions with slanted dividers.
export function panelPolygons(sizeId) {
  const { w, h } = SIZES[sizeId];
  const s = Math.min(w, h) * SLANT;
  if (sizeId === 'portrait') {
    const y1 = h / 3;
    const y2 = (h * 2) / 3;
    return [
      [[0, 0], [w, 0], [w, y1 - s], [0, y1 + s]],
      [[0, y1 + s], [w, y1 - s], [w, y2 - s], [0, y2 + s]],
      [[0, y2 + s], [w, y2 - s], [w, h], [0, h]],
    ];
  }
  const x1 = w / 3;
  const x2 = (w * 2) / 3;
  return [
    [[0, 0], [x1 + s, 0], [x1 - s, h], [0, h]],
    [[x1 + s, 0], [x2 + s, 0], [x2 - s, h], [x1 - s, h]],
    [[x2 + s, 0], [w, 0], [w, h], [x2 - s, h]],
  ];
}

function polygonBounds(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of poly) {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Which panel a canvas point falls in, or -1.
export function hitPanel(sizeId, px, py) {
  const polys = panelPolygons(sizeId);
  for (let i = 0; i < polys.length; i++) {
    if (pointInPolygon(px, py, polys[i])) return i;
  }
  return -1;
}

// Cover-fit a photo into a panel rect, with user zoom and pan.
export function drawPhotoPanel(ctx, img, rect, panel) {
  const zoom = Math.max(0.5, panel.zoom || 1);
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const x = rect.x + (rect.w - dw) / 2 + (panel.dx || 0);
  const y = rect.y + (rect.h - dh) / 2 + (panel.dy || 0);
  ctx.drawImage(img, x, y, dw, dh);
}

// The two dividers: a dark wide stroke with a thin accent line on top.
// The endpoints are the midpoints of the shared polygon edges, so the
// divider runs exactly down the middle of the slant.
function drawDividers(ctx, sizeId, w, h, accent) {
  const polys = panelPolygons(sizeId);
  const ends = (i) => {
    const a = polys[i];
    const b = polys[i + 1];
    if (sizeId === 'portrait') {
      return [
        [(a[3][0] + b[0][0]) / 2, (a[3][1] + b[0][1]) / 2],
        [(a[2][0] + b[1][0]) / 2, (a[2][1] + b[1][1]) / 2],
      ];
    }
    return [
      [(a[1][0] + b[0][0]) / 2, (a[1][1] + b[0][1]) / 2],
      [(a[2][0] + b[3][0]) / 2, (a[2][1] + b[3][1]) / 2],
    ];
  };
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(8,6,16,0.9)';
  ctx.lineWidth = Math.max(6, Math.min(w, h) * 0.012);
  for (let i = 0; i < polys.length - 1; i++) {
    const [p, q] = ends(i);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
  for (let i = 0; i < polys.length - 1; i++) {
    const [p, q] = ends(i);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }
  ctx.restore();
}

// Slanted title band across the bottom: title, subtitle, tagline.
function drawTitleBand(ctx, state, w, h) {
  const accent = gradeAccent(state.grade);
  const bandH = h * 0.19;
  const y0 = h - bandH;
  const slant = w * 0.03;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, y0 + slant);
  ctx.lineTo(w, y0 - slant);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(8,6,18,0.94)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, y0 + slant);
  ctx.lineTo(w, y0 - slant);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(3, h * 0.006);
  ctx.stroke();
  const pad = w * 0.045;
  const maxTitleW = w - pad * 2;
  let titleSize = Math.min(h * 0.085, w * 0.075);
  const title = (state.title || DEFAULT_TITLE).toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  // Shrink the title until it fits the band.
  for (let tries = 0; tries < 12; tries++) {
    ctx.font = `900 ${titleSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(titleSize * 0.04)}px`; } catch (e) { /* older canvas */ }
    if (ctx.measureText(title).width <= maxTitleW || titleSize < h * 0.03) break;
    titleSize *= 0.92;
  }
  ctx.fillText(title, pad, y0 + bandH * 0.52);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  ctx.font = `700 ${Math.round(h * 0.032)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = accent;
  const sub = (state.subtitle || '').toUpperCase();
  const subW = ctx.measureText(sub).width;
  ctx.fillText(sub, pad, y0 + bandH * 0.82);
  ctx.font = `italic 400 ${Math.round(h * 0.026)}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const tag = state.tagline || '';
  const tagW = ctx.measureText(tag).width;
  // Tagline goes right only when it clears the subtitle; otherwise centre it.
  if (pad + subW + w * 0.04 + tagW < w - pad) {
    ctx.fillText(tag, w - pad - tagW, y0 + bandH * 0.82);
  } else {
    ctx.fillText(tag, (w - tagW) / 2, y0 + bandH * 0.98);
  }
  ctx.restore();
}

// Draw the whole cover into a canvas at its full size. Returns the canvas.
export function drawCover(canvas, state) {
  const { w, h } = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const polys = panelPolygons(state.size);
  for (let i = 0; i < 3; i++) {
    const poly = polys[i];
    const rect = polygonBounds(poly);
    const panel = state.panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0], poly[k][1]);
    ctx.closePath();
    ctx.clip();
    if (panel && panel.kind === 'photo' && panel.photo) {
      drawPhotoPanel(ctx, panel.photo, rect, panel);
      ctx.fillStyle = 'rgba(20,10,30,0.12)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    } else {
      paintScene(ctx, panel ? panel.scene : 'sunset', rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }
  drawDividers(ctx, state.size, w, h, gradeAccent(state.grade));
  applyGrade(ctx, state.grade, w, h);
  drawTitleBand(ctx, state, w, h);
  return canvas;
}
