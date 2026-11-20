// scenes.js — four original procedural scene painters for Solmar Bay Cover Studio.
// Every picture is drawn in code: gradients, paths and silhouettes only. No photos,
// no licensed artwork, no Rockstar assets. Each painter draws inside the rectangle
// (x, y, w, h) and clips to it, so the caller can slice it into a diagonal panel.
//
// Deterministic: a tiny mulberry32 seeded per scene, so the same panel always
// renders the same picture (important for byte-identical dossiers and screenshots).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lgrad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

function clipRect(g, x, y, w, h) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
}

function drawStars(g, x, y, w, h, seed, n) {
  const rnd = mulberry32(seed);
  g.save();
  g.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const sx = x + rnd() * w;
    const sy = y + rnd() * h * 0.55;
    const r = 0.6 + rnd() * 1.4;
    g.globalAlpha = 0.35 + rnd() * 0.6;
    g.beginPath();
    g.arc(sx, sy, r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

function drawPalm(g, x, y, s, color) {
  g.save();
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = Math.max(2, s * 0.06);
  g.lineCap = 'round';
  // Curved trunk.
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.3, y - s * 0.95);
  g.stroke();
  // Fronds fanning from the crown.
  const cx = x + s * 0.3;
  const cy = y - s * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.95) + (i * Math.PI * 0.28);
    const len = s * (0.5 + (i % 2) * 0.14);
    g.beginPath();
    g.moveTo(cx, cy);
    g.quadraticCurveTo(
      cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.45 - s * 0.12,
      cx + Math.cos(a) * len, cy + Math.sin(a) * len + s * 0.18,
    );
    g.stroke();
  }
  g.restore();
}

function drawFigure(g, x, y, s, color) {
  // A lone person seen from behind, standing and looking out. Head, shoulders,
  // coat and legs as one silhouette.
  g.save();
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y - s * 0.86, s * 0.11, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(x - s * 0.16, y);
  g.quadraticCurveTo(x - s * 0.2, y - s * 0.62, x - s * 0.13, y - s * 0.72);
  g.lineTo(x + s * 0.13, y - s * 0.72);
  g.quadraticCurveTo(x + s * 0.2, y - s * 0.62, x + s * 0.17, y);
  g.closePath();
  g.fill();
  g.restore();
}

function drawSkyline(g, x, baseY, w, h, seed, color) {
  const rnd = mulberry32(seed);
  g.save();
  g.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = h * (0.25 + rnd() * 0.6);
    g.fillRect(bx, baseY - bh, bw, bh);
    // A few lit windows.
    g.fillStyle = 'rgba(255, 214, 130, 0.85)';
    const wins = Math.floor(rnd() * 6);
    for (let i = 0; i < wins; i++) {
      g.fillRect(bx + 2 + rnd() * (bw - 6), baseY - bh + 4 + rnd() * (bh - 10), 2.5, 3.5);
    }
    g.fillStyle = color;
    bx += bw + w * 0.012;
  }
  g.restore();
}

function drawSlattedSun(g, cx, cy, r) {
  g.save();
  const sun = lgrad(g, cx, cy - r, cx, cy + r, [
    [0, '#ffe259'], [0.55, '#ffa751'], [1, '#ff5e62'],
  ]);
  g.fillStyle = sun;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  // Horizontal slats cut out of the lower half, widening toward the bottom.
  g.globalCompositeOperation = 'destination-out';
  let yy = cy + r * 0.08;
  let gap = r * 0.045;
  while (yy < cy + r) {
    g.fillRect(cx - r - 2, yy, r * 2 + 4, gap);
    yy += gap + r * 0.16;
    gap *= 1.5;
  }
  g.restore();
}

// ------------------------------------------------------------------ scenes

export function paintSunset(g, x, y, w, h) {
  clipRect(g, x, y, w, h);
  g.fillStyle = lgrad(g, x, y, x, y + h, [
    [0, '#2b1055'], [0.45, '#7597de'], [0.62, '#ff7e5f'], [1, '#feb47b'],
  ]);
  g.fillRect(x, y, w, h);
  drawSlattedSun(g, x + w * 0.62, y + h * 0.42, Math.min(w, h) * 0.26);
  // Distant skyline across the water.
  drawSkyline(g, x, y + h * 0.62, w, h * 0.2, 11, '#3a1c5e');
  // Sea with a sun-reflection streak.
  g.fillStyle = lgrad(g, x, y + h * 0.62, x, y + h, [[0, '#c94b6d'], [1, '#2b1055']]);
  g.fillRect(x, y + h * 0.62, w, h * 0.38);
  g.save();
  g.fillStyle = 'rgba(255, 220, 140, 0.5)';
  const rnd = mulberry32(7);
  for (let i = 0; i < 26; i++) {
    const ry = y + h * 0.64 + rnd() * h * 0.3;
    const rw = w * (0.05 + rnd() * 0.22) * (1 - (ry - (y + h * 0.62)) / (h * 0.38));
    g.fillRect(x + w * 0.62 - rw / 2, ry, rw, 2);
  }
  g.restore();
  // Beach foreground and Dani, back to the viewer, facing the sun.
  g.fillStyle = '#1d0f33';
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y + h * 0.86);
  g.quadraticCurveTo(x + w * 0.5, y + h * 0.82, x + w, y + h * 0.88);
  g.lineTo(x + w, y + h);
  g.closePath();
  g.fill();
  drawFigure(g, x + w * 0.68, y + h * 0.97, h * 0.3, '#12081f');
  drawPalm(g, x + w * 0.08, y + h * 0.98, h * 0.42, '#12081f');
  g.restore();
}

export function paintChase(g, x, y, w, h) {
  clipRect(g, x, y, w, h);
  g.fillStyle = lgrad(g, x, y, x, y + h, [
    [0, '#04060f'], [0.5, '#0b2a4a'], [1, '#123a5e'],
  ]);
  g.fillRect(x, y, w, h);
  drawStars(g, x, y, w, h, 21, 60);
  // Moon glow.
  g.save();
  const glow = g.createRadialGradient(x + w * 0.8, y + h * 0.16, 2, x + w * 0.8, y + h * 0.16, w * 0.16);
  glow.addColorStop(0, 'rgba(230, 240, 255, 0.9)');
  glow.addColorStop(0.25, 'rgba(200, 220, 255, 0.25)');
  glow.addColorStop(1, 'rgba(200, 220, 255, 0)');
  g.fillStyle = glow;
  g.fillRect(x, y, w, h * 0.5);
  g.fillStyle = '#eef3ff';
  g.beginPath();
  g.arc(x + w * 0.8, y + h * 0.16, Math.min(w, h) * 0.05, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // City lights on the horizon.
  const rnd = mulberry32(31);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = ['#ffd76a', '#7ef0ff', '#ff7ad9'][i % 3];
    g.globalAlpha = 0.4 + rnd() * 0.6;
    g.fillRect(x + rnd() * w, y + h * 0.52 + rnd() * h * 0.03, 2.5, 2.5);
  }
  g.globalAlpha = 1;
  // Sea.
  g.fillStyle = lgrad(g, x, y + h * 0.55, x, y + h, [[0, '#0e2f52'], [1, '#04101f']]);
  g.fillRect(x, y + h * 0.55, w, h * 0.45);
  g.strokeStyle = 'rgba(140, 200, 255, 0.25)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const wy = y + h * (0.58 + i * 0.05);
    g.beginPath();
    g.moveTo(x + w * 0.05, wy);
    g.quadraticCurveTo(x + w * 0.5, wy - 4, x + w * 0.95, wy);
    g.stroke();
  }
  // Speedboat with wake, racing left to right — drawn large so it reads
  // even inside a narrow diagonal panel.
  const bx = x + w * 0.32;
  const by = y + h * 0.74;
  g.save();
  // Wake foam trailing behind.
  g.fillStyle = 'rgba(255, 255, 255, 0.8)';
  g.beginPath();
  g.moveTo(bx - w * 0.3, by + h * 0.06);
  g.lineTo(bx + w * 0.02, by - h * 0.005);
  g.lineTo(bx + w * 0.12, by + h * 0.07);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.45)';
  g.beginPath();
  g.moveTo(bx - w * 0.3, by + h * 0.09);
  g.lineTo(bx - w * 0.05, by + h * 0.05);
  g.lineTo(bx + w * 0.08, by + h * 0.1);
  g.closePath();
  g.fill();
  // Hull.
  g.fillStyle = '#e8ecf2';
  g.beginPath();
  g.moveTo(bx - w * 0.02, by - h * 0.01);
  g.lineTo(bx + w * 0.2, by - h * 0.03);
  g.lineTo(bx + w * 0.26, by + h * 0.02);
  g.lineTo(bx + w * 0.02, by + h * 0.05);
  g.closePath();
  g.fill();
  // Hull stripe and windshield.
  g.fillStyle = '#ff2e4d';
  g.fillRect(bx + w * 0.02, by - h * 0.005, w * 0.2, h * 0.012);
  g.fillStyle = 'rgba(20, 40, 70, 0.9)';
  g.beginPath();
  g.moveTo(bx + w * 0.06, by - h * 0.01);
  g.lineTo(bx + w * 0.14, by - h * 0.055);
  g.lineTo(bx + w * 0.18, by - h * 0.01);
  g.closePath();
  g.fill();
  // Driver silhouette and red/blue police glow.
  g.fillStyle = '#05070a';
  g.fillRect(bx + w * 0.11, by - h * 0.075, w * 0.025, h * 0.06);
  g.fillStyle = 'rgba(255, 60, 60, 0.95)';
  g.beginPath(); g.arc(bx + w * 0.12, by - h * 0.08, 3.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(70, 140, 255, 0.95)';
  g.beginPath(); g.arc(bx + w * 0.155, by - h * 0.08, 3.5, 0, Math.PI * 2); g.fill();
  g.restore();
  // Helicopter with a searchlight cone.
  const hx = x + w * 0.74;
  const hy = y + h * 0.2;
  g.save();
  g.fillStyle = 'rgba(255, 250, 200, 0.16)';
  g.beginPath();
  g.moveTo(hx, hy);
  g.lineTo(hx + w * 0.1, by);
  g.lineTo(hx - w * 0.02, by);
  g.closePath();
  g.fill();
  g.fillStyle = '#0a0d12';
  g.beginPath();
  g.ellipse(hx, hy, w * 0.055, h * 0.03, 0, 0, Math.PI * 2);
  g.fill();
  g.fillRect(hx + w * 0.03, hy - h * 0.02, w * 0.03, h * 0.012);
  g.strokeStyle = '#0a0d12';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(hx - w * 0.07, hy - h * 0.01);
  g.lineTo(hx + w * 0.07, hy - h * 0.01);
  g.stroke();
  g.restore();
  g.restore();
}

export function paintLighthouse(g, x, y, w, h) {
  clipRect(g, x, y, w, h);
  g.fillStyle = lgrad(g, x, y, x, y + h, [
    [0, '#3b2d5c'], [0.45, '#c96f4a'], [0.62, '#ff9a5c'], [1, '#7a4a6e'],
  ]);
  g.fillRect(x, y, w, h);
  // Low sun and a few clouds.
  g.fillStyle = 'rgba(255, 214, 140, 0.9)';
  g.beginPath();
  g.arc(x + w * 0.3, y + h * 0.5, Math.min(w, h) * 0.07, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255, 190, 160, 0.35)';
  for (const [cx, cy, cw] of [[0.15, 0.2, 0.3], [0.6, 0.3, 0.26], [0.4, 0.12, 0.2]]) {
    g.beginPath();
    g.ellipse(x + w * cx, y + h * cy, w * cw, h * 0.035, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Gulls.
  g.strokeStyle = 'rgba(30, 16, 40, 0.8)';
  g.lineWidth = 1.5;
  for (const [gx, gy, gs] of [[0.2, 0.18, 0.03], [0.34, 0.24, 0.024], [0.7, 0.15, 0.03]]) {
    g.beginPath();
    g.moveTo(x + w * (gx - gs), y + h * gy);
    g.quadraticCurveTo(x + w * gx, y + h * (gy - 0.02), x + w * (gx + gs), y + h * gy);
    g.stroke();
  }
  // Sea.
  g.fillStyle = lgrad(g, x, y + h * 0.58, x, y + h, [[0, '#8a5570'], [1, '#2c1e44']]);
  g.fillRect(x, y + h * 0.58, w, h * 0.42);
  // Rocky point and lighthouse, right side.
  const lx = x + w * 0.72;
  g.fillStyle = '#241a33';
  g.beginPath();
  g.moveTo(lx - w * 0.16, y + h);
  g.lineTo(lx - w * 0.1, y + h * 0.78);
  g.lineTo(lx + w * 0.14, y + h * 0.74);
  g.lineTo(lx + w * 0.2, y + h);
  g.closePath();
  g.fill();
  const tw = w * 0.075;
  const th = h * 0.42;
  const tx = lx - tw / 2;
  const ty = y + h * 0.74 - th;
  g.fillStyle = '#f4ead8';
  g.fillRect(tx, ty, tw, th);
  g.fillStyle = '#c9403c';
  g.fillRect(tx, ty + th * 0.22, tw, th * 0.2);
  g.fillRect(tx, ty + th * 0.62, tw, th * 0.2);
  g.fillStyle = '#1d1426';
  g.fillRect(tx - 2, ty - h * 0.05, tw + 4, h * 0.05);
  g.beginPath();
  g.moveTo(tx - 2, ty - h * 0.05);
  g.lineTo(tx + tw / 2, ty - h * 0.1);
  g.lineTo(tx + tw + 2, ty - h * 0.05);
  g.closePath();
  g.fill();
  // Rotating beams.
  g.save();
  g.fillStyle = 'rgba(255, 240, 180, 0.35)';
  g.beginPath();
  g.moveTo(tx + tw / 2, ty - h * 0.03);
  g.lineTo(tx - w * 0.4, ty - h * 0.16);
  g.lineTo(tx - w * 0.4, ty + h * 0.02);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(tx + tw / 2, ty - h * 0.03);
  g.lineTo(tx + w * 0.34, ty - h * 0.12);
  g.lineTo(tx + w * 0.34, ty + h * 0.04);
  g.closePath();
  g.fill();
  g.restore();
  // Wooden dock planks, foreground left.
  g.fillStyle = '#3a2418';
  g.save();
  g.translate(x + w * 0.06, y + h * 0.86);
  g.rotate(-0.06);
  for (let i = 0; i < 5; i++) {
    g.fillRect(0, i * h * 0.028, w * 0.34, h * 0.02);
  }
  g.restore();
  // A moored boat.
  g.fillStyle = '#160f24';
  g.beginPath();
  g.moveTo(x + w * 0.42, y + h * 0.82);
  g.lineTo(x + w * 0.58, y + h * 0.82);
  g.lineTo(x + w * 0.54, y + h * 0.87);
  g.lineTo(x + w * 0.46, y + h * 0.87);
  g.closePath();
  g.fill();
  g.fillRect(x + w * 0.495, y + h * 0.7, 2, h * 0.12);
  g.restore();
}

export function paintNeon(g, x, y, w, h) {
  clipRect(g, x, y, w, h);
  g.fillStyle = lgrad(g, x, y, x, y + h, [
    [0, '#0b0620'], [0.55, '#1c0f3d'], [1, '#3d1150'],
  ]);
  g.fillRect(x, y, w, h);
  drawStars(g, x, y, w, h, 41, 40);
  const signs = [
    { x: 0.04, y: 0.16, w: 0.2, h: 0.1, c: '#ff2e88', label: true },
    { x: 0.68, y: 0.1, w: 0.26, h: 0.12, c: '#22e6ff', label: true },
    { x: 0.1, y: 0.4, w: 0.16, h: 0.08, c: '#ffd319', label: false },
    { x: 0.72, y: 0.36, w: 0.18, h: 0.09, c: '#7cff6b', label: false },
  ];
  // Buildings left and right, street vanishing to the centre.
  g.fillStyle = '#120a26';
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w * 0.3, y);
  g.lineTo(x + w * 0.42, y + h * 0.62);
  g.lineTo(x, y + h * 0.62);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(x + w * 0.7, y);
  g.lineTo(x + w, y);
  g.lineTo(x + w, y + h * 0.62);
  g.lineTo(x + w * 0.58, y + h * 0.62);
  g.closePath();
  g.fill();
  // Neon signs: a dark face, a glowing coloured frame, and pale bars that
  // read as lettering — never a flat block of colour.
  for (const s of signs) {
    const sx = x + w * s.x;
    const sy = y + h * s.y;
    const sw = w * s.w;
    const sh = h * s.h;
    g.save();
    g.fillStyle = '#0a0616';
    g.fillRect(sx, sy, sw, sh);
    g.shadowColor = s.c;
    g.shadowBlur = 16;
    g.strokeStyle = s.c;
    g.lineWidth = Math.max(2, h * 0.008);
    g.strokeRect(sx + 2, sy + 2, sw - 4, sh - 4);
    g.shadowBlur = 0;
    g.fillStyle = s.c;
    g.globalAlpha = 0.9;
    const bars = s.label ? 3 : 2;
    for (let i = 0; i < bars; i++) {
      g.fillRect(sx + sw * 0.1, sy + sh * (0.22 + i * 0.26), sw * (0.8 - i * 0.18), sh * 0.12);
    }
    g.restore();
  }
  // Lit windows on the two building faces.
  const wrnd = mulberry32(55);
  g.fillStyle = 'rgba(255, 214, 130, 0.7)';
  for (let i = 0; i < 26; i++) {
    g.fillRect(x + w * (0.03 + wrnd() * 0.24), y + h * (0.06 + wrnd() * 0.5), 3, 4);
  }
  for (let i = 0; i < 26; i++) {
    g.fillRect(x + w * (0.73 + wrnd() * 0.24), y + h * (0.06 + wrnd() * 0.5), 3, 4);
  }
  // Wet road with neon reflections.
  g.fillStyle = lgrad(g, x, y + h * 0.62, x, y + h, [[0, '#241238'], [1, '#0a0616']]);
  g.fillRect(x, y + h * 0.62, w, h * 0.38);
  for (const s of signs) {
    g.save();
    g.globalAlpha = 0.35;
    const refl = lgrad(g, 0, y + h * 0.62, 0, y + h, [[0, s.c], [1, 'rgba(0,0,0,0)']]);
    g.fillStyle = refl;
    g.fillRect(x + w * (s.x + 0.02), y + h * 0.62, w * (s.w - 0.04), h * 0.3);
    g.restore();
  }
  // Centre line dashes converging to the vanishing point.
  g.strokeStyle = 'rgba(255, 220, 120, 0.8)';
  g.lineWidth = 3;
  g.setLineDash([14, 12]);
  g.beginPath();
  g.moveTo(x + w * 0.5, y + h);
  g.lineTo(x + w * 0.5, y + h * 0.64);
  g.stroke();
  g.setLineDash([]);
  // Low sports car silhouette with headlights, drawn large and low so it
  // reads even inside a narrow diagonal panel.
  const cx = x + w * 0.5;
  const cy = y + h * 0.9;
  g.fillStyle = '#050308';
  g.beginPath();
  g.moveTo(cx - w * 0.26, cy);
  g.quadraticCurveTo(cx - w * 0.25, cy - h * 0.06, cx - w * 0.11, cy - h * 0.07);
  g.lineTo(cx - w * 0.05, cy - h * 0.105);
  g.lineTo(cx + w * 0.08, cy - h * 0.105);
  g.lineTo(cx + w * 0.16, cy - h * 0.07);
  g.quadraticCurveTo(cx + w * 0.25, cy - h * 0.055, cx + w * 0.26, cy);
  g.closePath();
  g.fill();
  // Wheels.
  g.fillStyle = '#000000';
  g.beginPath();
  g.arc(cx - w * 0.16, cy, h * 0.022, 0, Math.PI * 2);
  g.arc(cx + w * 0.16, cy, h * 0.022, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255, 244, 180, 0.95)';
  g.beginPath();
  g.arc(cx - w * 0.23, cy - h * 0.015, 4.5, 0, Math.PI * 2);
  g.arc(cx + w * 0.23, cy - h * 0.015, 4.5, 0, Math.PI * 2);
  g.fill();
  // Headlight beams spilling down the wet road.
  g.fillStyle = 'rgba(255, 244, 180, 0.12)';
  g.beginPath();
  g.moveTo(cx - w * 0.23, cy - h * 0.015);
  g.lineTo(cx - w * 0.36, cy + h * 0.08);
  g.lineTo(cx - w * 0.06, cy + h * 0.08);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(cx + w * 0.23, cy - h * 0.015);
  g.lineTo(cx + w * 0.36, cy + h * 0.08);
  g.lineTo(cx + w * 0.06, cy + h * 0.08);
  g.closePath();
  g.fill();
  drawPalm(g, x + w * 0.3, y + h * 0.66, h * 0.2, '#0a0518');
  drawPalm(g, x + w * 0.66, y + h * 0.66, h * 0.17, '#0a0518');
  g.restore();
}

export const SCENES = {
  sunset: { id: 'sunset', name: 'Dani at Sunset', paint: paintSunset },
  chase: { id: 'chase', name: 'Boat Chase', paint: paintChase },
  lighthouse: { id: 'lighthouse', name: 'Lighthouse Docks', paint: paintLighthouse },
  neon: { id: 'neon', name: 'Neon Street', paint: paintNeon },
};

export const SCENE_IDS = Object.keys(SCENES);
