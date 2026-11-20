// cover.js — the cover renderer for Solmar Bay Cover Studio.
//
// A cover is three diagonal panels (each a drawn scene or the user's photo),
// a colour grade over the whole picture, and bold cover lettering on top.
// Everything is drawn on one canvas, so export is just that canvas as a PNG.

import { SCENES } from './scenes.js';

export const SIZES = {
  landscape: { id: 'landscape', name: 'Landscape', width: 1280, height: 720, ratio: '16:9' },
  portrait: { id: 'portrait', name: 'Portrait', width: 1024, height: 1280, ratio: '4:5' },
  square: { id: 'square', name: 'Square', width: 1080, height: 1080, ratio: '1:1' },
};

export const GRADES = {
  sunset: { id: 'sunset', name: 'Sunset', hint: 'Warm dusk glow' },
  neon: { id: 'neon', name: 'Neon Nights', hint: 'Magenta / cyan nights' },
  vice: { id: 'vice', name: 'Vice Gold', hint: 'Gold and teal' },
};

export function defaultState() {
  return {
    size: 'landscape',
    grade: 'sunset',
    title: 'SOLMAR BAY',
    subtitle: 'A DANI REYES STORY',
    tagline: 'Every sunset has a price.',
    panels: [
      { kind: 'scene', scene: 'sunset', photo: null },
      { kind: 'scene', scene: 'chase', photo: null },
      { kind: 'scene', scene: 'neon', photo: null },
    ],
  };
}

// Three diagonal bands. The cut lines lean right as they fall, so each panel
// is a parallelogram; the slant scales with the cover width.
export function panelPolygons(width, height) {
  const slant = Math.round(width * 0.14);
  const b1 = Math.round(width / 3);
  const b2 = Math.round((width * 2) / 3);
  return [
    [[0, 0], [b1, 0], [b1 + slant, height], [slant, height]],
    [[b1, 0], [b2, 0], [b2 + slant, height], [b1 + slant, height]],
    [[b2, 0], [width, 0], [width, height], [b2 + slant, height]],
  ];
}

export function panelBounds(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

export function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function clipPolygon(g, poly) {
  g.beginPath();
  g.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) g.lineTo(poly[i][0], poly[i][1]);
  g.closePath();
  g.clip();
}

function drawPhoto(g, photo, bx, by, bw, bh) {
  const img = photo.img;
  if (!img || !img.naturalWidth) return;
  const base = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
  const scale = base * (photo.scale || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = bx + (bw - dw) / 2 + (photo.ox || 0) * bw;
  const dy = by + (bh - dh) / 2 + (photo.oy || 0) * bh;
  g.drawImage(img, dx, dy, dw, dh);
}

function applyGrade(g, width, height, grade) {
  g.save();
  if (grade === 'sunset') {
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = '#ff7a2a';
    g.fillRect(0, 0, width, height);
    g.globalCompositeOperation = 'overlay';
    const warm = g.createLinearGradient(0, 0, 0, height);
    warm.addColorStop(0, 'rgba(255, 170, 80, 0.35)');
    warm.addColorStop(0.6, 'rgba(255, 120, 60, 0.08)');
    warm.addColorStop(1, 'rgba(80, 20, 90, 0.18)');
    g.fillStyle = warm;
    g.fillRect(0, 0, width, height);
  } else if (grade === 'neon') {
    g.globalCompositeOperation = 'overlay';
    const mag = g.createLinearGradient(0, 0, width, height);
    mag.addColorStop(0, 'rgba(255, 46, 136, 0.4)');
    mag.addColorStop(0.5, 'rgba(120, 40, 200, 0.12)');
    mag.addColorStop(1, 'rgba(34, 230, 255, 0.35)');
    g.fillStyle = mag;
    g.fillRect(0, 0, width, height);
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = '#1a0533';
    g.fillRect(0, 0, width, height);
  } else {
    // Vice Gold: gold highlights, teal shadows.
    g.globalCompositeOperation = 'overlay';
    const gold = g.createLinearGradient(0, 0, width, 0);
    gold.addColorStop(0, 'rgba(255, 211, 25, 0.3)');
    gold.addColorStop(0.5, 'rgba(255, 190, 90, 0.1)');
    gold.addColorStop(1, 'rgba(20, 180, 170, 0.28)');
    g.fillStyle = gold;
    g.fillRect(0, 0, width, height);
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = '#3a2a00';
    g.fillRect(0, 0, width, height);
  }
  g.restore();
}

function applyVignette(g, width, height) {
  g.save();
  const v = g.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  g.fillStyle = v;
  g.fillRect(0, 0, width, height);
  g.restore();
}

function drawCoverText(g, width, height, state) {
  const m = Math.round(width * 0.045);
  g.save();
  g.textBaseline = 'alphabetic';
  // Tagline, top left, with a short gold rule above it.
  g.fillStyle = '#ffd76a';
  g.fillRect(m, Math.round(height * 0.045), Math.round(width * 0.09), Math.max(2, Math.round(height * 0.006)));
  g.font = `italic 600 ${Math.max(13, Math.round(height * 0.026))}px Georgia, 'Times New Roman', serif`;
  g.fillStyle = 'rgba(255, 255, 255, 0.92)';
  g.shadowColor = 'rgba(0, 0, 0, 0.6)';
  g.shadowBlur = 6;
  g.fillText(state.tagline || '', m, Math.round(height * 0.095));
  g.shadowBlur = 0;
  // Subtitle, small caps above the title.
  const titleY = height - Math.round(height * 0.055);
  const subSize = Math.max(12, Math.round(height * 0.032));
  // A dark strip keeps the lettering readable over any panel.
  const strip = g.createLinearGradient(0, titleY - height * 0.19, 0, titleY + height * 0.03);
  strip.addColorStop(0, 'rgba(0, 0, 0, 0)');
  strip.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  g.fillStyle = strip;
  g.fillRect(0, titleY - height * 0.19, width, height * 0.22);
  g.font = `700 ${subSize}px Arial, Helvetica, sans-serif`;
  try { g.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch (e) { /* older canvas */ }
  g.fillStyle = '#ffd76a';
  g.fillText((state.subtitle || '').toUpperCase(), m, titleY - Math.round(height * 0.115) * 0.95);
  try { g.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  // Title: heavy, sheared, white with a black outline. Shrunk to fit when
  // the words are long, so it never runs off the cover's edge.
  const title = (state.title || '').toUpperCase();
  let titleSize = Math.round(height * 0.115);
  g.font = `900 ${titleSize}px 'Arial Black', Arial, Helvetica, sans-serif`;
  const maxTitleW = width - m * 2;
  const measured = g.measureText(title).width;
  if (measured > maxTitleW) {
    titleSize = Math.max(10, Math.floor(titleSize * maxTitleW / measured));
    g.font = `900 ${titleSize}px 'Arial Black', Arial, Helvetica, sans-serif`;
  }
  g.save();
  g.translate(m, titleY);
  g.transform(1, 0, -0.07, 1, 0, 0);
  g.lineJoin = 'round';
  g.lineWidth = Math.max(3, Math.round(height * 0.009));
  g.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  g.fillStyle = '#ffffff';
  g.strokeText(title, 0, 0);
  g.fillText(title, 0, 0);
  g.restore();
  g.restore();
}

// Render the whole cover onto `canvas` (resized to the state's size).
export function renderCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.landscape;
  canvas.width = size.width;
  canvas.height = size.height;
  const g = canvas.getContext('2d');
  const W = size.width;
  const H = size.height;
  g.fillStyle = '#0a0616';
  g.fillRect(0, 0, W, H);
  const polys = panelPolygons(W, H);
  state.panels.forEach((panel, i) => {
    const poly = polys[i];
    const b = panelBounds(poly);
    g.save();
    clipPolygon(g, poly);
    if (panel.kind === 'photo' && panel.photo && panel.photo.img) {
      drawPhoto(g, panel.photo, b.x, b.y, b.w, b.h);
    } else {
      const scene = SCENES[panel.scene] || SCENES.sunset;
      scene.paint(g, b.x, b.y, b.w, b.h);
    }
    g.restore();
  });
  // Crisp white dividers along the diagonal cuts.
  g.save();
  g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  g.lineWidth = Math.max(2, Math.round(W * 0.003));
  for (let i = 1; i < polys.length; i++) {
    g.beginPath();
    g.moveTo(polys[i][0][0], polys[i][0][1]);
    g.lineTo(polys[i][3][0], polys[i][3][1]);
    g.stroke();
  }
  g.restore();
  applyGrade(g, W, H, state.grade);
  applyVignette(g, W, H);
  drawCoverText(g, W, H, state);
  return canvas;
}

// A procedural stand-in photo, generated in code so the photo flow (upload,
// zoom, drag, export) can be tried without any binary asset. Two flavours:
// a sunset boulevard and a dusk pier.
export function makeSamplePhoto(kind, width = 800, height = 600) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  if (kind === 'pier') {
    g.fillStyle = '#2c1e44';
    g.fillRect(0, 0, width, height);
    const sky = g.createLinearGradient(0, 0, 0, height * 0.6);
    sky.addColorStop(0, '#ff9a5c');
    sky.addColorStop(1, '#7a4a6e');
    g.fillStyle = sky;
    g.fillRect(0, 0, width, height * 0.6);
    g.fillStyle = '#ffe6a0';
    g.beginPath();
    g.arc(width * 0.7, height * 0.3, 46, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#241a33';
    g.fillRect(0, height * 0.6, width, height * 0.4);
    g.fillStyle = '#3a2418';
    for (let i = 0; i < 6; i++) g.fillRect(width * 0.1, height * (0.66 + i * 0.05), width * 0.8, 8);
    g.fillStyle = '#f4ead8';
    g.fillRect(width * 0.62, height * 0.2, 26, height * 0.42);
    g.fillStyle = '#c9403c';
    g.fillRect(width * 0.62, height * 0.3, 26, 22);
  } else {
    g.fillStyle = '#1c0f3d';
    g.fillRect(0, 0, width, height);
    const sky = g.createLinearGradient(0, 0, 0, height * 0.55);
    sky.addColorStop(0, '#2b1055');
    sky.addColorStop(1, '#ff7e5f');
    g.fillStyle = sky;
    g.fillRect(0, 0, width, height * 0.55);
    g.fillStyle = '#ffe259';
    g.beginPath();
    g.arc(width * 0.5, height * 0.34, 60, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#12081f';
    g.fillRect(0, height * 0.55, width, height * 0.45);
    g.strokeStyle = 'rgba(255,220,120,0.8)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(width * 0.5, height);
    g.lineTo(width * 0.5, height * 0.58);
    g.stroke();
    g.shadowColor = '#ff2e88';
    g.shadowBlur = 24;
    g.fillStyle = '#ff2e88';
    g.fillRect(width * 0.08, height * 0.2, 110, 54);
    g.fillStyle = '#22e6ff';
    g.fillRect(width * 0.72, height * 0.14, 120, 54);
    g.shadowBlur = 0;
  }
  return c;
}

export function photoFromCanvas(canvas) {
  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  return { img, scale: 1, ox: 0, oy: 0, name: 'sample photo' };
}
