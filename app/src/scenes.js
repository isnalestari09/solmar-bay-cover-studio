// scenes.js — procedural painters for the Solmar Bay cover art.
// All four scenes are drawn in code on a 2D canvas: no photos, no
// Rockstar artwork, no external assets. A painter gets (ctx, x, y, w, h)
// for its panel rectangle and paints only inside it. Every random value
// comes from a seeded generator, so a scene is identical on every load.

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

// Deterministic PRNG (mulberry32) — same seed, same scene, every time.
function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(a, b, t) { return a + (b - a) * t; }

function verticalGradient(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Soft halo around a bright disc (sun, lamp, beacon).
function halo(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r * 2.8);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
  ctx.fill();
}

// A few thin, translucent cloud streaks across the sky.
function streaks(ctx, x, y, w, h, color, seed) {
  const rand = rng(seed);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const cy = y + h * (0.06 + rand() * 0.32);
    const cw = w * (0.16 + rand() * 0.26);
    const cx = x + rand() * Math.max(1, w - cw);
    ctx.globalAlpha = 0.14 + rand() * 0.16;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw / 2, Math.max(2, h * 0.02), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Two small gulls, drawn as shallow chevrons.
function gulls(ctx, x, y, w, h, seed) {
  const rand = rng(seed);
  ctx.strokeStyle = 'rgba(20,10,30,0.8)';
  ctx.lineWidth = Math.max(1.5, h * 0.006);
  for (let i = 0; i < 2; i++) {
    const gx = x + w * (0.3 + rand() * 0.4);
    const gy = y + h * (0.1 + rand() * 0.2);
    const s = w * 0.022;
    ctx.beginPath();
    ctx.moveTo(gx - s, gy);
    ctx.quadraticCurveTo(gx - s * 0.4, gy - s * 0.6, gx, gy);
    ctx.quadraticCurveTo(gx + s * 0.4, gy - s * 0.6, gx + s, gy);
    ctx.stroke();
  }
}

// Palm silhouette: one curved trunk, seven drooping fronds.
function palmTree(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.5, x + s * 0.26, y - s * 0.92);
  ctx.stroke();
  const tx = x + s * 0.26;
  const ty = y - s * 0.92;
  for (let i = 0; i < 7; i++) {
    const a = (-0.05 - i * 0.24) * Math.PI;
    const len = s * (0.4 + (i % 2) * 0.12);
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.5 + s * 0.2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.5, ty - s * 0.1, ex, ey);
    ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.stroke();
  }
  circle(ctx, tx, ty, s * 0.07, color);
}

// Blocky skyline with a handful of lit windows.
function citySkyline(ctx, x, y, w, h, color, seed) {
  const rand = rng(seed);
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.05 + rand() * 0.11);
    const bh = h * (0.25 + rand() * 0.55);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (rand() > 0.5) ctx.fillRect(bx + bw * 0.3, y + h - bh - h * 0.07, bw * 0.4, h * 0.07);
    bx += bw + w * 0.012;
  }
  ctx.fillStyle = 'rgba(255,214,120,0.85)';
  for (let i = 0; i < 14; i++) {
    const wx = x + rand() * w;
    const wy = y + h * 0.35 + rand() * h * 0.5;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.008), Math.max(2, h * 0.012));
  }
}

// Low-slung getaway car, side view, nose to the right.
function getawayCar(ctx, x, y, w, color) {
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
  // Windshield and side glass.
  ctx.fillStyle = 'rgba(140,220,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y - h * 0.38);
  ctx.lineTo(x + w * 0.36, y - h * 0.68);
  ctx.lineTo(x + w * 0.58, y - h * 0.68);
  ctx.lineTo(x + w * 0.78, y - h * 0.36);
  ctx.closePath();
  ctx.fill();
  // Wheels.
  for (const wx of [0.24, 0.76]) {
    circle(ctx, x + w * wx, y, w * 0.11, '#0a0a12');
    circle(ctx, x + w * wx, y, w * 0.05, '#3a3a4a');
  }
  // Headlight.
  ctx.fillStyle = 'rgba(255,240,170,0.95)';
  ctx.fillRect(x + w * 0.96, y - h * 0.3, w * 0.04, h * 0.12);
}

// A driver leaning on the car: head, torso, one arm down to the door.
function driverFigure(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  circle(ctx, x, y - s * 0.82, s * 0.13, color);
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

// --- Scene 1: Dani at Sunset ---------------------------------------------
function paintSunset(ctx, x, y, w, h) {
  ctx.fillStyle = verticalGradient(ctx, x, y, w, h, [
    [0, '#2b1055'], [0.35, '#c13b78'], [0.62, '#ff7a3c'], [1, '#ffb347'],
  ]);
  ctx.fillRect(x, y, w, h);
  streaks(ctx, x, y, w, h * 0.5, '#ffd9c2', 3);
  halo(ctx, x + w * 0.62, y + h * 0.52, h * 0.16, 'rgba(255,190,90,0.85)');
  circle(ctx, x + w * 0.62, y + h * 0.52, h * 0.13, '#ffd98a');
  // Sea with a glitter path under the sun.
  const seaY = y + h * 0.62;
  ctx.fillStyle = verticalGradient(ctx, x, seaY, w, h * 0.38, [[0, '#ff8c42'], [1, '#5b1a5e']]);
  ctx.fillRect(x, seaY, w, h - (seaY - y));
  const rand = rng(7);
  ctx.fillStyle = 'rgba(255,235,180,0.5)';
  for (let i = 0; i < 9; i++) {
    const ry = seaY + (h - (seaY - y)) * (0.1 + rand() * 0.85);
    const rw = w * (0.06 + rand() * 0.16);
    ctx.fillRect(x + w * 0.62 - rw / 2 + (rand() - 0.5) * w * 0.1, ry, rw, Math.max(2, h * 0.012));
  }
  citySkyline(ctx, x, y + h * 0.18, w, h * 0.44, '#1c0b33', 11);
  palmTree(ctx, x + w * 0.06, y + h * 0.66, h * 0.34, '#14082a');
  palmTree(ctx, x + w * 0.93, y + h * 0.68, h * 0.28, '#14082a');
  // Foreground road, raised so the car sits above the title band.
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(x, y + h * 0.84, w, h * 0.16);
  getawayCar(ctx, x + w * 0.3, y + h * 0.84, w * 0.42, '#0d0718');
  driverFigure(ctx, x + w * 0.24, y + h * 0.84, h * 0.2, '#0d0718');
}

// --- Scene 2: Boat Chase --------------------------------------------------
// A speedboat, drawn as a long hull with a pointed bow: the hull sits low
// on the water, the windshield and driver sit above it, and the wake fans
// out behind — never a flat triangle, which reads as a paper plane.
function paintBoat(ctx, x, y, w, h) {
  ctx.fillStyle = verticalGradient(ctx, x, y, w, h, [
    [0, '#0b3d66'], [0.45, '#1d7a9e'], [0.62, '#2fa8a0'], [1, '#0a2e4d'],
  ]);
  ctx.fillRect(x, y, w, h);
  streaks(ctx, x, y, w, h * 0.45, '#bfe8ef', 17);
  gulls(ctx, x, y, w, h, 29);
  halo(ctx, x + w * 0.2, y + h * 0.2, h * 0.12, 'rgba(255,240,200,0.7)');
  circle(ctx, x + w * 0.2, y + h * 0.2, h * 0.09, '#fff3c4');
  // Sea with swell lines.
  const seaY = y + h * 0.55;
  ctx.fillStyle = verticalGradient(ctx, x, seaY, w, h * 0.45, [[0, '#2fa8a0'], [1, '#062a44']]);
  ctx.fillRect(x, seaY, w, h - (seaY - y));
  const rand = rng(23);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, h * 0.012);
  for (let i = 0; i < 7; i++) {
    const wy = seaY + (h - (seaY - y)) * (0.12 + rand() * 0.8);
    ctx.beginPath();
    ctx.moveTo(x + rand() * w * 0.5, wy);
    ctx.quadraticCurveTo(x + w * 0.4, wy - h * 0.02, x + w * (0.6 + rand() * 0.35), wy);
    ctx.stroke();
  }
  // Wake: a widening V of foam lines trailing left behind the boat.
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
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 8; i++) {
    circle(ctx, x + w * (0.2 + rand() * 0.28), y + h * (0.72 + rand() * 0.1), h * 0.012 + rand() * h * 0.02, 'rgba(255,255,255,0.5)');
  }
  // Speedboat hull: long, low, pointed bow to the right, red stripe along
  // the side, dark windshield, seated driver, outboard motor at the stern.
  const bx = x + w * 0.48;
  const by = y + h * 0.68;
  // Outboard motor at the stern (left end).
  ctx.fillStyle = '#0e2438';
  ctx.fillRect(bx + w * 0.005, by - h * 0.075, w * 0.02, h * 0.1);
  // Hull.
  ctx.fillStyle = '#f2f7fa';
  ctx.beginPath();
  ctx.moveTo(bx, by - h * 0.07);
  ctx.lineTo(bx + w * 0.2, by - h * 0.1);
  ctx.lineTo(bx + w * 0.36, by - h * 0.02);
  ctx.lineTo(bx + w * 0.33, by + h * 0.045);
  ctx.lineTo(bx + w * 0.02, by + h * 0.045);
  ctx.closePath();
  ctx.fill();
  // Red stripe.
  ctx.fillStyle = '#ff5a3c';
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.02, by - h * 0.01);
  ctx.lineTo(bx + w * 0.34, by - h * 0.008);
  ctx.lineTo(bx + w * 0.33, by + h * 0.018);
  ctx.lineTo(bx + w * 0.02, by + h * 0.018);
  ctx.closePath();
  ctx.fill();
  // Windshield and driver.
  ctx.fillStyle = 'rgba(16,42,72,0.9)';
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.09, by - h * 0.075);
  ctx.lineTo(bx + w * 0.16, by - h * 0.13);
  ctx.lineTo(bx + w * 0.21, by - h * 0.075);
  ctx.closePath();
  ctx.fill();
  circle(ctx, bx + w * 0.135, by - h * 0.135, h * 0.02, '#0e2438');
  ctx.fillStyle = '#0e2438';
  ctx.fillRect(bx + w * 0.125, by - h * 0.12, w * 0.02, h * 0.05);
}

// --- Scene 3: Lighthouse Docks --------------------------------------------
function paintLighthouse(ctx, x, y, w, h) {
  ctx.fillStyle = verticalGradient(ctx, x, y, w, h, [
    [0, '#120e2e'], [0.5, '#3c2a63'], [0.75, '#c65f7a'], [1, '#2a1a3e'],
  ]);
  ctx.fillRect(x, y, w, h);
  // Early stars.
  const rand = rng(41);
  for (let i = 0; i < 26; i++) {
    circle(ctx, x + rand() * w, y + rand() * h * 0.5, 1 + rand() * 1.6, 'rgba(255,255,255,0.85)');
  }
  // Dusk sea with a light path from the beacon.
  const seaY = y + h * 0.66;
  ctx.fillStyle = verticalGradient(ctx, x, seaY, w, h * 0.34, [[0, '#7a4a6e'], [1, '#120e2e']]);
  ctx.fillRect(x, seaY, w, h - (seaY - y));
  ctx.fillStyle = 'rgba(255,230,150,0.35)';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x + w * 0.6 - w * 0.03, seaY + (h - (seaY - y)) * (0.12 + i * 0.14), w * 0.06, Math.max(2, h * 0.01));
  }
  // Striped lighthouse tower.
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
    const sy = mix(topY, botY, 0.18 + i * 0.27);
    const sw = mix(tw * 0.62, tw * 0.82, 0.18 + i * 0.27);
    ctx.fillRect(tx - sw / 2, sy, sw, (botY - topY) * 0.09);
  }
  // Lamp room and glowing beacon.
  ctx.fillStyle = '#1a1a26';
  ctx.fillRect(tx - tw * 0.36, topY - h * 0.05, tw * 0.72, h * 0.05);
  circle(ctx, tx, topY - h * 0.05, tw * 0.16, '#ffe9a8');
  halo(ctx, tx, topY - h * 0.05, h * 0.05, 'rgba(255,233,168,0.8)');
  // Beam sweeping right.
  ctx.fillStyle = 'rgba(255,233,168,0.28)';
  ctx.beginPath();
  ctx.moveTo(tx, topY - h * 0.05);
  ctx.lineTo(x + w, topY - h * 0.16);
  ctx.lineTo(x + w, topY + h * 0.1);
  ctx.closePath();
  ctx.fill();
  // Rocks on the left, dock planks on the right.
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

// --- Scene 4: Neon Street --------------------------------------------------
function paintNeon(ctx, x, y, w, h) {
  ctx.fillStyle = verticalGradient(ctx, x, y, w, h, [
    [0, '#05060f'], [0.6, '#0d1030'], [1, '#1b0f38'],
  ]);
  ctx.fillRect(x, y, w, h);
  const rand = rng(67);
  const neons = ['#ff2ea6', '#00e5ff', '#ffe14d', '#7cff4d', '#ff5a3c'];
  // Building blocks with lit windows.
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.14 + rand() * 0.16);
    const bh = h * (0.3 + rand() * 0.45);
    ctx.fillStyle = '#0a0c1e';
    ctx.fillRect(bx, y + h * 0.72 - bh, bw, bh);
    for (let wy = y + h * 0.72 - bh + h * 0.04; wy < y + h * 0.68; wy += h * 0.07) {
      for (let wx = bx + w * 0.02; wx < bx + bw - w * 0.02; wx += w * 0.05) {
        if (rand() > 0.45) {
          ctx.fillStyle = neons[Math.floor(rand() * neons.length)];
          ctx.globalAlpha = 0.75;
          ctx.fillRect(wx, wy, w * 0.028, h * 0.035);
          ctx.globalAlpha = 1;
        }
      }
    }
    bx += bw + w * 0.02;
  }
  // Glowing neon sign bars over the street.
  for (let i = 0; i < 4; i++) {
    const sy = y + h * (0.18 + i * 0.13);
    const sw = w * (0.2 + rand() * 0.25);
    const sx = x + rand() * (w - sw);
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
  // Wet street with neon reflections.
  ctx.fillStyle = verticalGradient(ctx, x, y + h * 0.72, w, h * 0.28, [[0, '#141033'], [1, '#05060f']]);
  ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
  ctx.fillStyle = 'rgba(255,46,166,0.25)';
  ctx.fillRect(x + w * 0.15, y + h * 0.74, w * 0.1, h * 0.24);
  ctx.fillStyle = 'rgba(0,229,255,0.22)';
  ctx.fillRect(x + w * 0.62, y + h * 0.74, w * 0.08, h * 0.24);
  getawayCar(ctx, x + w * 0.28, y + h * 0.9, w * 0.44, '#05060f');
  // A headlight cone cutting through the dark.
  circle(ctx, x + w * 0.72, y + h * 0.86, h * 0.03, 'rgba(255,240,170,0.95)');
  ctx.fillStyle = 'rgba(255,240,170,0.18)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.72, y + h * 0.86);
  ctx.lineTo(x + w * 0.98, y + h * 0.8);
  ctx.lineTo(x + w * 0.98, y + h * 0.92);
  ctx.closePath();
  ctx.fill();
}

const PAINTERS = { sunset: paintSunset, boat: paintBoat, lighthouse: paintLighthouse, neon: paintNeon };

// Paint one scene, clipped to its panel rectangle.
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
  const v = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

export function gradeAccent(gradeId) {
  const grade = GRADES.find((g) => g.id === gradeId) || GRADES[0];
  return grade.accent;
}
