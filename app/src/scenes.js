// scenes.js — procedural Solmar Bay scene painters.
// Every scene is drawn in code on a 2D canvas: no photos, no Rockstar art.
// Each painter receives (ctx, x, y, w, h) for its panel rectangle and paints
// only inside it. All randomness is seeded, so a scene is deterministic.

export const SCENES = [
  { id: 'sunset', name: 'Dani at Sunset', hint: 'Driver at golden hour' },
  { id: 'boat', name: 'Boat Chase', hint: 'Speedboat on open water' },
  { id: 'lighthouse', name: 'Lighthouse Docks', hint: 'Dusk at the pier' },
  { id: 'neon', name: 'Neon Street', hint: 'Vice City nights' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', top: 'rgba(255,122,26,0.20)', bottom: 'rgba(255,45,120,0.14)', accent: '#ff7a1a' },
  { id: 'neon', name: 'Neon Nights', top: 'rgba(255,0,168,0.16)', bottom: 'rgba(0,214,255,0.16)', accent: '#ff00a8' },
  { id: 'gold', name: 'Vice Gold', top: 'rgba(255,190,60,0.18)', bottom: 'rgba(0,140,140,0.10)', accent: '#ffc23c' },
];

// Small seeded PRNG so scenes look the same on every load.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function vgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function sunGlow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();
}

// A palm silhouette: curved trunk and six drooping fronds.
function palm(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.3, y - s * 0.95);
  ctx.stroke();
  const topX = x + s * 0.3;
  const topY = y - s * 0.95;
  for (let i = 0; i < 6; i++) {
    const a = (-0.15 - i * 0.28) * Math.PI;
    const len = s * (0.42 + (i % 2) * 0.1);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + s * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY - s * 0.08, ex, ey);
    ctx.lineWidth = Math.max(2, s * 0.045);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

// Blocky skyline silhouette with a few lit windows.
function skyline(ctx, x, y, w, h, color, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.06 + rnd() * 0.1);
    const bh = h * (0.25 + rnd() * 0.55);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (rnd() > 0.5) ctx.fillRect(bx + bw * 0.3, y + h - bh - h * 0.08, bw * 0.4, h * 0.08);
    bx += bw + w * 0.012;
  }
  ctx.fillStyle = 'rgba(255,214,120,0.85)';
  for (let i = 0; i < 14; i++) {
    const wx = x + rnd() * w;
    const wy = y + h * 0.35 + rnd() * h * 0.5;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.008), Math.max(2, h * 0.012));
  }
}

// A low-slung getaway car silhouette, side view, facing right.
function carSide(ctx, x, y, w, color) {
  const h = w * 0.26;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.08, y - h * 0.42);
  ctx.lineTo(x + w * 0.34, y - h * 0.78);
  ctx.lineTo(x + w * 0.62, y - h * 0.78);
  ctx.lineTo(x + w * 0.86, y - h * 0.38);
  ctx.lineTo(x + w, y - h * 0.18);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(140,220,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y - h * 0.38);
  ctx.lineTo(x + w * 0.36, y - h * 0.68);
  ctx.lineTo(x + w * 0.58, y - h * 0.68);
  ctx.lineTo(x + w * 0.78, y - h * 0.36);
  ctx.closePath();
  ctx.fill();
  for (const wx of [0.24, 0.76]) {
    disc(ctx, x + w * wx, y, w * 0.11, '#0a0a12');
    disc(ctx, x + w * wx, y, w * 0.05, '#3a3a4a');
  }
  ctx.fillStyle = 'rgba(255,240,170,0.95)';
  ctx.fillRect(x + w * 0.97, y - h * 0.3, w * 0.03, h * 0.12);
}

// A person leaning on the car: head, shoulders, one arm down.
function driver(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  disc(ctx, x, y - s * 0.82, s * 0.13, color);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.16, y);
  ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.62, x, y - s * 0.66);
  ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.62, x + s * 0.16, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.14, y - s * 0.5);
  ctx.lineTo(x + s * 0.3, y - s * 0.08);
  ctx.stroke();
}

function paintSunset(ctx, x, y, w, h) {
  ctx.fillStyle = vgrad(ctx, x, y, w, h, [[0, '#2b1055'], [0.35, '#c13b78'], [0.62, '#ff7a3c'], [1, '#ffb347']]);
  ctx.fillRect(x, y, w, h);
  clouds(ctx, x, y, w, h * 0.5, '#ffd9c2', 3);
  sunGlow(ctx, x + w * 0.62, y + h * 0.52, h * 0.16, 'rgba(255,190,90,0.85)');
  disc(ctx, x + w * 0.62, y + h * 0.52, h * 0.13, '#ffd98a');
  const seaY = y + h * 0.62;
  ctx.fillStyle = vgrad(ctx, x, seaY, w, h * 0.38, [[0, '#ff8c42'], [1, '#5b1a5e']]);
  ctx.fillRect(x, seaY, w, h - (seaY - y));
  const rnd = mulberry32(7);
  ctx.fillStyle = 'rgba(255,235,180,0.5)';
  for (let i = 0; i < 9; i++) {
    const ry = seaY + (h - (seaY - y)) * (0.1 + rnd() * 0.85);
    const rw = w * (0.06 + rnd() * 0.16);
    ctx.fillRect(x + w * 0.62 - rw / 2 + (rnd() - 0.5) * w * 0.1, ry, rw, Math.max(2, h * 0.012));
  }
  skyline(ctx, x, y + h * 0.18, w, h * 0.44, '#1c0b33', 11);
  palm(ctx, x + w * 0.06, y + h * 0.66, h * 0.34, '#14082a');
  palm(ctx, x + w * 0.93, y + h * 0.68, h * 0.28, '#14082a');
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(x, y + h * 0.86, w, h * 0.14);
  carSide(ctx, x + w * 0.3, y + h * 0.88, w * 0.42, '#0d0718');
  driver(ctx, x + w * 0.24, y + h * 0.88, h * 0.2, '#0d0718');
}

function paintBoat(ctx, x, y, w, h) {
  ctx.fillStyle = vgrad(ctx, x, y, w, h, [[0, '#0b3d66'], [0.45, '#1d7a9e'], [0.62, '#2fa8a0'], [1, '#0a2e4d']]);
  ctx.fillRect(x, y, w, h);
  clouds(ctx, x, y, w, h * 0.45, '#bfe8ef', 17);
  gulls(ctx, x, y, w, h, 29);
  sunGlow(ctx, x + w * 0.2, y + h * 0.2, h * 0.12, 'rgba(255,240,200,0.7)');
  disc(ctx, x + w * 0.2, y + h * 0.2, h * 0.09, '#fff3c4');
  const seaY = y + h * 0.55;
  ctx.fillStyle = vgrad(ctx, x, seaY, w, h * 0.45, [[0, '#2fa8a0'], [1, '#062a44']]);
  ctx.fillRect(x, seaY, w, h - (seaY - y));
  const rnd = mulberry32(23);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, h * 0.012);
  for (let i = 0; i < 7; i++) {
    const wy = seaY + (h - (seaY - y)) * (0.12 + rnd() * 0.8);
    ctx.beginPath();
    ctx.moveTo(x + rnd() * w * 0.5, wy);
    ctx.quadraticCurveTo(x + w * 0.4, wy - h * 0.02, x + w * (0.6 + rnd() * 0.35), wy);
    ctx.stroke();
  }
  // Wake trailing behind the boat: a widening V of foam lines, not a solid shape.
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = Math.max(2, h * 0.014);
  for (let i = 0; i < 3; i++) {
    const wy = y + h * (0.7 + i * 0.03);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.7);
    ctx.lineTo(x + w * 0.16, wy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.7);
    ctx.lineTo(x + w * 0.16, y + h * (0.78 + i * 0.02));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 8; i++) {
    disc(ctx, x + w * (0.2 + rnd() * 0.28), y + h * (0.72 + rnd() * 0.1), h * 0.012 + rnd() * h * 0.02, 'rgba(255,255,255,0.5)');
  }
  // Speedboat: long sleek hull with a pointed bow, dark windshield,
  // a seated driver and an outboard motor at the stern.
  const bx = x + w * 0.48;
  const by = y + h * 0.68;
  ctx.fillStyle = '#0e2438';
  ctx.fillRect(bx + w * 0.005, by - h * 0.075, w * 0.02, h * 0.1);
  ctx.fillStyle = '#f2f7fa';
  ctx.beginPath();
  ctx.moveTo(bx, by - h * 0.07);
  ctx.lineTo(bx + w * 0.2, by - h * 0.1);
  ctx.lineTo(bx + w * 0.36, by - h * 0.02);
  ctx.lineTo(bx + w * 0.33, by + h * 0.045);
  ctx.lineTo(bx + w * 0.02, by + h * 0.045);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5a3c';
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.02, by - h * 0.01);
  ctx.lineTo(bx + w * 0.34, by - h * 0.008);
  ctx.lineTo(bx + w * 0.33, by + h * 0.018);
  ctx.lineTo(bx + w * 0.02, by + h * 0.018);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(16,42,72,0.9)';
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.09, by - h * 0.075);
  ctx.lineTo(bx + w * 0.16, by - h * 0.13);
  ctx.lineTo(bx + w * 0.21, by - h * 0.075);
  ctx.closePath();
  ctx.fill();
  disc(ctx, bx + w * 0.135, by - h * 0.135, h * 0.02, '#0e2438');
  ctx.fillStyle = '#0e2438';
  ctx.fillRect(bx + w * 0.125, by - h * 0.12, w * 0.02, h * 0.05);
}

function paintLighthouse(ctx, x, y, w, h) {
  ctx.fillStyle = vgrad(ctx, x, y, w, h, [[0, '#120e2e'], [0.5, '#3c2a63'], [0.75, '#c65f7a'], [1, '#2a1a3e']]);
  ctx.fillRect(x, y, w, h);
  const rnd = mulberry32(41);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 26; i++) disc(ctx, x + rnd() * w, y + rnd() * h * 0.5, 1 + rnd() * 1.6, 'rgba(255,255,255,0.85)');
  const seaY = y + h * 0.66;
  ctx.fillStyle = vgrad(ctx, x, seaY, w, h * 0.34, [[0, '#7a4a6e'], [1, '#120e2e']]);
  ctx.fillRect(x, seaY, w, h - (seaY - y));
  ctx.fillStyle = 'rgba(255,230,150,0.35)';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x + w * 0.6 - w * 0.03, seaY + (h - (seaY - y)) * (0.12 + i * 0.14), w * 0.06, Math.max(2, h * 0.01));
  }
  // Lighthouse tower with stripes.
  const tx = x + w * 0.6;
  const tw = w * 0.11;
  const topY = y + h * 0.16;
  const botY = seaY + h * 0.04;
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.moveTo(tx - tw * 0.42, botY);
  ctx.lineTo(tx - tw * 0.3, topY);
  ctx.lineTo(tx + tw * 0.3, topY);
  ctx.lineTo(tx + tw * 0.42, botY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  for (let i = 0; i < 3; i++) {
    const sy = lerp(topY, botY, 0.18 + i * 0.27);
    const sw = lerp(tw * 0.62, tw * 0.82, 0.18 + i * 0.27);
    ctx.fillRect(tx - sw / 2, sy, sw, (botY - topY) * 0.09);
  }
  ctx.fillStyle = '#1a1a26';
  ctx.fillRect(tx - tw * 0.36, topY - h * 0.05, tw * 0.72, h * 0.05);
  disc(ctx, tx, topY - h * 0.05, tw * 0.16, '#ffe9a8');
  sunGlow(ctx, tx, topY - h * 0.05, h * 0.05, 'rgba(255,233,168,0.8)');
  // Light beam sweeping right.
  ctx.fillStyle = 'rgba(255,233,168,0.28)';
  ctx.beginPath();
  ctx.moveTo(tx, topY - h * 0.05);
  ctx.lineTo(x + w, topY - h * 0.16);
  ctx.lineTo(x + w, topY + h * 0.1);
  ctx.closePath();
  ctx.fill();
  // Rocks and dock planks.
  ctx.fillStyle = '#0e0a1e';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.9);
  ctx.lineTo(x + w * 0.3, y + h * 0.86);
  ctx.lineTo(x + w * 0.42, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(x + w * 0.68, y + h * 0.9, w * 0.32, h * 0.1);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + w * (0.68 + i * 0.08), y + h * 0.9, 2, h * 0.1);
}

function paintNeon(ctx, x, y, w, h) {
  ctx.fillStyle = vgrad(ctx, x, y, w, h, [[0, '#05060f'], [0.6, '#0d1030'], [1, '#1b0f38']]);
  ctx.fillRect(x, y, w, h);
  const rnd = mulberry32(67);
  const neons = ['#ff2ea6', '#00e5ff', '#ffe14d', '#7cff4d', '#ff5a3c'];
  // Building blocks with lit windows.
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.14 + rnd() * 0.16);
    const bh = h * (0.3 + rnd() * 0.45);
    ctx.fillStyle = '#0a0c1e';
    ctx.fillRect(bx, y + h * 0.72 - bh, bw, bh);
    for (let wy = y + h * 0.72 - bh + h * 0.04; wy < y + h * 0.68; wy += h * 0.07) {
      for (let wx = bx + w * 0.02; wx < bx + bw - w * 0.02; wx += w * 0.05) {
        if (rnd() > 0.45) {
          ctx.fillStyle = neons[Math.floor(rnd() * neons.length)];
          ctx.globalAlpha = 0.75;
          ctx.fillRect(wx, wy, w * 0.028, h * 0.035);
          ctx.globalAlpha = 1;
        }
      }
    }
    bx += bw + w * 0.02;
  }
  // Neon sign bars glowing over the street.
  for (let i = 0; i < 4; i++) {
    const sy = y + h * (0.18 + i * 0.13);
    const sw = w * (0.2 + rnd() * 0.25);
    const sx = x + rnd() * (w - sw);
    const c = neons[i % neons.length];
    ctx.save();
    ctx.shadowColor = c;
    ctx.shadowBlur = h * 0.06;
    ctx.fillStyle = c;
    ctx.fillRect(sx, sy, sw, h * 0.028);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(sx + sw * 0.1, sy + h * 0.006, sw * 0.5, h * 0.014);
  }
  // Wet street with reflections.
  ctx.fillStyle = vgrad(ctx, x, y + h * 0.72, w, h * 0.28, [[0, '#141033'], [1, '#05060f']]);
  ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
  ctx.fillStyle = 'rgba(255,46,166,0.25)';
  ctx.fillRect(x + w * 0.15, y + h * 0.74, w * 0.1, h * 0.24);
  ctx.fillStyle = 'rgba(0,229,255,0.22)';
  ctx.fillRect(x + w * 0.62, y + h * 0.74, w * 0.08, h * 0.24);
  carSide(ctx, x + w * 0.28, y + h * 0.9, w * 0.44, '#05060f');
  disc(ctx, x + w * 0.72, y + h * 0.86, h * 0.03, 'rgba(255,240,170,0.95)');
  ctx.fillStyle = 'rgba(255,240,170,0.18)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.72, y + h * 0.86);
  ctx.lineTo(x + w * 0.98, y + h * 0.8);
  ctx.lineTo(x + w * 0.98, y + h * 0.92);
  ctx.closePath();
  ctx.fill();
}

const PAINTERS = { sunset: paintSunset, boat: paintBoat, lighthouse: paintLighthouse, neon: paintNeon };

export function paintScene(ctx, sceneId, x, y, w, h) {
  const paint = PAINTERS[sceneId] || PAINTERS.sunset;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  paint(ctx, x, y, w, h);
  ctx.restore();
}

// Colour grade wash over the whole cover, plus a soft vignette.
export function applyGrade(ctx, gradeId, w, h) {
  const grade = GRADES.find((g) => g.id === gradeId) || GRADES[0];
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, grade.top);
  g.addColorStop(1, grade.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

export function gradeAccent(gradeId) {
  const grade = GRADES.find((g) => g.id === gradeId) || GRADES[0];
  return grade.accent;
}

// Thin cloud streaks, tinted by the sky around them.
function clouds(ctx, x, y, w, h, color, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const cy = y + h * (0.08 + rnd() * 0.3);
    const cw = w * (0.15 + rnd() * 0.25);
    const cx = x + rnd() * (w - cw);
    ctx.globalAlpha = 0.16 + rnd() * 0.14;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw / 2, h * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Two tiny gulls in the sky.
function gulls(ctx, x, y, w, h, seed) {
  const rnd = mulberry32(seed);
  ctx.strokeStyle = 'rgba(20,10,30,0.8)';
  ctx.lineWidth = Math.max(1.5, h * 0.006);
  for (let i = 0; i < 2; i++) {
    const gx = x + w * (0.3 + rnd() * 0.4);
    const gy = y + h * (0.12 + rnd() * 0.18);
    const s = w * 0.02;
    ctx.beginPath();
    ctx.moveTo(gx - s, gy);
    ctx.quadraticCurveTo(gx - s * 0.4, gy - s * 0.6, gx, gy);
    ctx.quadraticCurveTo(gx + s * 0.4, gy - s * 0.6, gx + s, gy);
    ctx.stroke();
  }
}
