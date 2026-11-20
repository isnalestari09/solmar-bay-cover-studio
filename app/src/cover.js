// Cover renderer for Solmar Bay Cover Studio.
// Draws the three diagonal panels, the lettering and the colour grade
// onto a canvas at the cover's full size. All art is drawn in code.

import { SCENE_LIST } from './scenes.js';

export const SIZES = {
  landscape: { w: 1280, h: 720, label: 'Landscape 16:9' },
  portrait: { w: 1024, h: 1280, label: 'Portrait 4:5' },
  square: { w: 1080, h: 1080, label: 'Square 1:1' },
};

export const GRADES = {
  sunset: { name: 'Sunset' },
  neon: { name: 'Neon Nights' },
  gold: { name: 'Vice Gold' },
};

const SCENE_BY_KEY = Object.fromEntries(SCENE_LIST.map((s) => [s.key, s]));

// Panel polygons for a cover of w x h: the two diagonal dividers lean
// right by `slant` from top to bottom.
export function panelPolygons(w, h) {
  const slant = w * 0.06;
  const x1 = w / 3;
  const x2 = (w * 2) / 3;
  return [
    [[0, 0], [x1, 0], [x1 + slant, h], [0, h]],
    [[x1, 0], [x2, 0], [x2 + slant, h], [x1 + slant, h]],
    [[x2, 0], [w, 0], [w, h], [x2 + slant, h]],
  ];
}

export function panelAt(w, h, x, y) {
  const slant = w * 0.06;
  const b1 = w / 3 + slant * (y / h);
  const b2 = (w * 2) / 3 + slant * (y / h);
  if (x < b1) return 0;
  if (x < b2) return 1;
  return 2;
}

function clipPolygon(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.clip();
}

function drawPhoto(ctx, img, x, y, w, h, zoom, ox, oy) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function applyGrade(ctx, w, h, grade) {
  ctx.save();
  if (grade === 'sunset') {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 110, 40, 0.28)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(70, 60, 255, 0.30)';
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 190, 70, 0.35)';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(10, 0, 20, 0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, weight, family) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 10 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawLettering(ctx, w, h, title, subtitle, tagline) {
  const mx = w * 0.05;
  const unit = Math.min(w, h);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Tagline, top left, italic serif under a gold rule.
  ctx.fillStyle = '#f5b942';
  ctx.fillRect(mx, h * 0.045, w * 0.09, Math.max(3, h * 0.004));
  const tagPx = fitFont(ctx, tagline, w * 0.62, Math.round(unit * 0.038), 'italic 700', 'Georgia, "Times New Roman", serif');
  ctx.font = `italic 700 ${tagPx}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = Math.max(2, h * 0.006);
  ctx.fillText(tagline, mx, h * 0.045 + tagPx * 1.5);
  ctx.shadowBlur = 0;
  // Title block, bottom left.
  const subPx = fitFont(ctx, subtitle, w * 0.9, Math.round(unit * 0.038), '800', 'Arial, sans-serif');
  try { ctx.letterSpacing = `${Math.max(2, Math.round(unit * 0.006))}px`; } catch { /* older canvas */ }
  ctx.font = `800 ${subPx}px Arial, sans-serif`;
  ctx.fillStyle = '#f5b942';
  ctx.fillText(subtitle, mx, h - unit * 0.19);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  const titlePx = fitFont(ctx, title, w * 0.9, Math.round(unit * 0.115), '900', 'Arial, sans-serif');
  ctx.font = `900 ${titlePx}px Arial, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = Math.max(2, titlePx * 0.07);
  ctx.strokeText(title, mx, h - unit * 0.055);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, mx, h - unit * 0.055);
  ctx.restore();
}

// Renders `state` onto `canvas` at the cover's full size.
// state: { size, grade, title, subtitle, tagline,
//          panels: [{ mode: 'scene'|'photo', scene, photo, zoom, ox, oy }] }
export function renderCover(canvas, state) {
  const size = SIZES[state.size] ?? SIZES.landscape;
  const w = size.w;
  const h = size.h;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const polys = panelPolygons(w, h);
  const off = document.createElement('canvas');

  state.panels.forEach((panel, i) => {
    const poly = polys[i];
    const xs = poly.map((p) => p[0]);
    const ys = poly.map((p) => p[1]);
    const bx = Math.min(...xs);
    const by = Math.min(...ys);
    const bw = Math.max(...xs) - bx;
    const bh = Math.max(...ys) - by;
    ctx.save();
    clipPolygon(ctx, poly);
    if (panel.mode === 'photo' && panel.photo) {
      drawPhoto(ctx, panel.photo, bx, by, bw, bh, panel.zoom, panel.ox, panel.oy);
    } else {
      off.width = Math.max(2, Math.ceil(bw));
      off.height = Math.max(2, Math.ceil(bh));
      const octx = off.getContext('2d');
      const painter = SCENE_BY_KEY[panel.scene]?.paint ?? SCENE_BY_KEY.sunset.paint;
      painter(octx, off.width, off.height);
      ctx.drawImage(off, bx, by);
    }
    ctx.restore();
  });

  // Diagonal dividers between the panels.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(2, w * 0.0022);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = Math.max(2, w * 0.004);
  const slant = w * 0.06;
  for (const x of [w / 3, (w * 2) / 3]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + slant, h);
    ctx.stroke();
  }
  ctx.restore();

  applyGrade(ctx, w, h, state.grade);
  // A soft scrim behind the title block keeps the lettering readable
  // over the brightest scenes.
  const scrim = ctx.createLinearGradient(0, h * 0.72, 0, h);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  drawLettering(ctx, w, h, state.title, state.subtitle, state.tagline);
  return canvas;
}
