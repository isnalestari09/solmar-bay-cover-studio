// Solmar Bay cover renderer: multi-panel GTA-style poster on one canvas.
// Layouts are diagonal-panel collages with white divider slats; the title
// sits in a slanted band across the bottom. Everything is drawn in code.
import { GRADES, SCENES } from './scenes.js';

export const SIZES = {
  square: { name: 'Square · 1080 × 1080', w: 1080, h: 1080, label: 'square' },
  portrait: { name: 'Portrait · 1080 × 1350', w: 1080, h: 1350, label: 'portrait' },
  wide: { name: 'Wide · 1920 × 1080', w: 1920, h: 1080, label: 'wide' },
};

// Panel rects as fractions of the cover, per size. Order: hero, panel 2, panel 3.
export function layoutFor(sizeKey) {
  if (sizeKey === 'wide') {
    return [
      { x: 0, y: 0, w: 0.58, h: 1, slant: 0.03 },
      { x: 0.58, y: 0, w: 0.42, h: 0.52, slant: -0.03 },
      { x: 0.58, y: 0.52, w: 0.42, h: 0.48, slant: -0.03 },
    ];
  }
  if (sizeKey === 'portrait') {
    return [
      { x: 0, y: 0, w: 1, h: 0.56, slant: 0 },
      { x: 0, y: 0.56, w: 0.52, h: 0.44, slant: 0.04 },
      { x: 0.52, y: 0.56, w: 0.48, h: 0.44, slant: -0.04 },
    ];
  }
  return [
    { x: 0, y: 0, w: 1, h: 0.62, slant: 0 },
    { x: 0, y: 0.62, w: 0.52, h: 0.38, slant: 0.05 },
    { x: 0.52, y: 0.62, w: 0.48, h: 0.38, slant: -0.05 },
  ];
}

export function defaultState() {
  return {
    size: 'wide',
    grade: 'sunset',
    title: 'SOLMAR BAY',
    subtitle: 'DANI REYES',
    tagline: 'One last drive. One way home.',
    panels: [
      { kind: 'scene', scene: 'driver', photo: null, px: 0.5, py: 0.5, scale: 1 },
      { kind: 'scene', scene: 'boat', photo: null, px: 0.5, py: 0.5, scale: 1 },
      { kind: 'scene', scene: 'lighthouse', photo: null, px: 0.5, py: 0.5, scale: 1 },
    ],
  };
}

function drawPhotoPanel(ctx, panel, x, y, w, h, g) {
  const img = panel.photo;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * panel.scale;
  const dw = iw * base, dh = ih * base;
  const dx = x + w * panel.px - dw / 2;
  const dy = y + h * panel.py - dh / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  // sunset grade wash so photos sit in the poster's palette
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(x, y, x + w, y + h);
  wash.addColorStop(0, g.skyLow);
  wash.addColorStop(1, g.skyTop);
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawTitleBand(ctx, state, W, H, g) {
  const bandH = H * (state.size === 'portrait' ? 0.17 : 0.2);
  const by = H - bandH;
  // slanted white band
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, by + bandH * 0.28);
  ctx.lineTo(W, by);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  // accent slash
  ctx.fillStyle = g.accent;
  ctx.beginPath();
  ctx.moveTo(0, by + bandH * 0.28);
  ctx.lineTo(W, by);
  ctx.lineTo(W, by + bandH * 0.14);
  ctx.lineTo(0, by + bandH * 0.42);
  ctx.closePath();
  ctx.fill();

  const cx = W * 0.5;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // main title
  const titleSize = Math.min(W * 0.115, bandH * 0.62);
  ctx.font = `900 ${titleSize}px "Arial Black", Arial, sans-serif`;
  try { ctx.letterSpacing = `${titleSize * 0.02}px`; } catch (e) { /* older canvas */ }
  const grad = ctx.createLinearGradient(0, by, 0, H);
  grad.addColorStop(0, '#241239');
  grad.addColorStop(1, '#0b0616');
  ctx.lineWidth = titleSize * 0.09;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText(state.title.toUpperCase(), cx, by + bandH * 0.42);
  ctx.fillStyle = grad;
  ctx.fillText(state.title.toUpperCase(), cx, by + bandH * 0.42);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  // subtitle + tagline
  const subSize = bandH * 0.16;
  ctx.font = `800 ${subSize}px Arial, sans-serif`;
  ctx.fillStyle = g.accent;
  ctx.fillText(state.subtitle.toUpperCase(), cx, by + bandH * 0.74);
  ctx.font = `italic 600 ${subSize * 0.92}px Georgia, serif`;
  ctx.fillStyle = '#5a4a7a';
  ctx.fillText(state.tagline, cx, by + bandH * 0.92);
}

/** Draws the whole cover for `state` onto `canvas` at its export size. */
export function drawCover(canvas, state) {
  const size = SIZES[state.size];
  const W = size.w, H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const g = GRADES[state.grade];
  const panels = layoutFor(state.size);
  // Panels live in the art area above the title band, so no art hides
  // behind it.
  const bandH = H * (state.size === 'portrait' ? 0.17 : 0.2);
  const artH = H - bandH;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  panels.forEach((p, i) => {
    const x = p.x * W, y = p.y * artH, w = p.w * W, h = p.h * artH;
    const slant = (p.slant || 0) * W;
    ctx.save();
    // slanted panel clip
    ctx.beginPath();
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + w + slant, y);
    ctx.lineTo(x + w - slant, y + h);
    ctx.lineTo(x - slant, y + h);
    ctx.closePath();
    ctx.clip();
    const panel = state.panels[i];
    if (panel && panel.kind === 'photo' && panel.photo) {
      drawPhotoPanel(ctx, panel, x, y, w, h, g);
    } else {
      const scene = SCENES[panel?.scene || 'driver'];
      scene.draw(ctx, x, y, w, h, g);
    }
    ctx.restore();
    // white divider slat along the panel's right/bottom edge
    ctx.fillStyle = '#ffffff';
    if (p.w < 1 && p.x + p.w < 1) {
      ctx.save();
      ctx.translate(x + w, y);
      ctx.rotate(Math.atan2(slant * 2, h));
      ctx.fillRect(-W * 0.006, 0, W * 0.012, h * 1.05);
      ctx.restore();
    }
    if (p.h < 1 && p.y + p.h < 1) {
      ctx.fillRect(x, y + h - H * 0.006, w, H * 0.012);
    }
  });

  drawTitleBand(ctx, state, W, H, g);
  return canvas;
}

/** Which panel (index) holds the point (fx, fy) in fractions of the cover. */
export function panelAt(state, fx, fy) {
  const panels = layoutFor(state.size);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) return i;
  }
  return 0;
}
