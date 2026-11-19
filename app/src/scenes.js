// Solmar Bay scene painters: four original procedural scenes drawn with canvas
// primitives only. No image is loaded here; every skyline, palm, boat and figure is
// drawn in code. Each painter fills the rectangle (x, y, w, h) and takes a palette
// so the same scene can be re-graded in Sunset, Neon Nights or Vice Gold.

export const GRADES = {
  sunset: {
    name: 'Sunset',
    skyTop: '#241a5e', skyMid: '#7b3fa0', skyLow: '#ff7e3d',
    sun: '#ffd166', sunStripe: '#ff6b4a',
    sea: '#1d3a5f', seaDark: '#0e1e33', seaLine: '#e8a04c',
    accent: '#ff5a7a', glow: '#ff9e57', neon: '#ff5a7a', neon2: '#00e5ff',
  },
  neon: {
    name: 'Neon Nights',
    skyTop: '#12063a', skyMid: '#5b1a8a', skyLow: '#ff2e88',
    sun: '#ff4d9d', sunStripe: '#ff2e63',
    sea: '#12233f', seaDark: '#0a1226', seaLine: '#ff4d9d',
    accent: '#00e5ff', glow: '#ff2e88', neon: '#ff2e88', neon2: '#00e5ff',
  },
  gold: {
    name: 'Vice Gold',
    skyTop: '#2b1d05', skyMid: '#8a5a10', skyLow: '#ffb830',
    sun: '#ffe9a8', sunStripe: '#ff8a00',
    sea: '#24382e', seaDark: '#101f18', seaLine: '#ffcf5e',
    accent: '#ff8a00', glow: '#ffd166', neon: '#ffb830', neon2: '#7dffd4',
  },
};

/** Vertical sky gradient across a panel. */
function skyFill(ctx, x, y, w, h, pal) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(0.55, pal.skyMid);
  g.addColorStop(1, pal.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** A big low sun with horizontal slats cut through it, synthwave style. */
function stripedSun(ctx, cx, cy, r, pal) {
  ctx.save();
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur = r * 0.45;
  ctx.fillStyle = pal.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = pal.sunStripe;
  const stripes = [0.05, 0.22, 0.42];
  for (const t of stripes) {
    const yy = cy + r * t;
    const half = Math.sqrt(Math.max(0, r * r - (yy - cy) * (yy - cy)));
    const th = Math.max(2, r * 0.055);
    ctx.fillRect(cx - half, yy - th / 2, half * 2, th);
  }
  ctx.restore();
}

/** A dark skyline of blocks with a few lit windows. */
function skyline(ctx, x, baseY, w, h, pal, seed) {
  let bx = x;
  let i = 0;
  ctx.fillStyle = '#160f33';
  while (bx < x + w) {
    const bw = w * (0.07 + ((seed * 37 + i * 53) % 10) / 130);
    const bh = h * (0.35 + ((seed * 11 + i * 29) % 10) / 18);
    ctx.fillRect(bx, baseY - bh, bw, bh);
    ctx.fillStyle = '#ffe9a8';
    const rows = Math.floor(bh / (h * 0.09));
    const cols = Math.floor(bw / (w * 0.035));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((seed + i * 7 + r * 3 + c * 5) % 4 === 0) {
          ctx.fillRect(bx + w * 0.012 + c * w * 0.035, baseY - bh + h * 0.03 + r * h * 0.09, w * 0.014, h * 0.035);
        }
      }
    }
    ctx.fillStyle = '#160f33';
    bx += bw + w * 0.012;
    i++;
  }
}

/** A leaning palm silhouette. */
function palmTree(ctx, x, y, s, lean, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = '#160f33';
  ctx.lineWidth = Math.max(2, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.06, -s * 0.5, s * 0.02, -s);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s * 0.016);
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * (0.08 + k * 0.13);
    ctx.beginPath();
    ctx.moveTo(s * 0.02, -s);
    ctx.quadraticCurveTo(Math.cos(a) * s * 0.42, -s + Math.sin(a) * s * 0.42, Math.cos(a) * s * 0.72, -s + Math.sin(a) * s * 0.72 + s * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

/** Horizontal light streaks on dark water. */
function seaStreaks(ctx, x, y, w, h, pal, seed) {
  ctx.fillStyle = pal.sea;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pal.seaLine;
  for (let k = 0; k < 7; k++) {
    const yy = y + h * (0.12 + k * 0.13);
    const ww = w * (0.25 + ((seed + k * 31) % 10) / 22);
    const xx = x + w * (((seed * 13 + k * 47) % 60) / 100);
    ctx.globalAlpha = 0.25 + (k % 3) * 0.2;
    ctx.fillRect(xx, yy, ww, Math.max(1.5, h * 0.02));
  }
  ctx.globalAlpha = 1;
}

/** Dani Reyes from behind: short hair, jacket, standing at the water's edge. */
function daniFigure(ctx, x, y, s, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0d0a24';
  ctx.beginPath();
  ctx.arc(0, -s * 0.78, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.26, -s * 0.55, -s * 0.13, -s * 0.62);
  ctx.lineTo(s * 0.13, -s * 0.62);
  ctx.quadraticCurveTo(s * 0.26, -s * 0.55, s * 0.2, s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = pal.accent;
  ctx.fillRect(-s * 0.2, -s * 0.28, s * 0.4, s * 0.05);
  ctx.fillStyle = pal.sun;
  ctx.fillRect(s * 0.2, -s * 0.5, s * 0.03, s * 0.62);
  ctx.restore();
}

/** A low wedge sports car silhouette with one headlight. */
function wedgeCar(ctx, x, y, s, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0d0a24';
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.lineTo(-s * 0.55, -s * 0.34);
  ctx.lineTo(s * 0.25, -s * 0.4);
  ctx.lineTo(s, -s * 0.1);
  ctx.lineTo(s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = pal.sun;
  ctx.beginPath();
  ctx.arc(-s * 0.62, s * 0.02, s * 0.09, 0, Math.PI * 2);
  ctx.arc(s * 0.55, s * 0.02, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pal.sun;
  ctx.lineWidth = Math.max(1.5, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.34);
  ctx.lineTo(s * 0.25, -s * 0.4);
  ctx.stroke();
  ctx.restore();
}

/** A speedboat with a white wake and red/blue police glow behind it. */
function speedBoat(ctx, x, y, s, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4ead8';
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.1);
  ctx.lineTo(s, -s * 0.1);
  ctx.lineTo(s * 0.7, s * 0.22);
  ctx.lineTo(-s * 0.7, s * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#160f33';
  ctx.fillRect(-s * 0.25, -s * 0.55, s * 0.5, s * 0.45);
  ctx.fillStyle = pal.accent;
  ctx.fillRect(-s * 0.25, -s * 0.2, s * 0.5, s * 0.1);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, s * 0.28);
  ctx.lineTo(-s * 1.9, s * 0.55);
  ctx.moveTo(-s * 0.95, s * 0.42);
  ctx.lineTo(-s * 1.8, s * 0.72);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let k = 0; k < 8; k++) {
    ctx.beginPath();
    ctx.arc(-s * (1.1 + k * 0.12), s * (0.3 + (k % 3) * 0.14), s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A striped lighthouse with a sweeping beam. */
function lighthouse(ctx, x, y, s, pal) {
  ctx.save();
  ctx.translate(x, y);
  const beam = ctx.createLinearGradient(0, -s * 0.95, s * 1.6, -s * 0.7);
  beam.addColorStop(0, 'rgba(255,233,168,0.85)');
  beam.addColorStop(1, 'rgba(255,233,168,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.95);
  ctx.lineTo(s * 1.7, -s * 1.15);
  ctx.lineTo(s * 1.7, -s * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4ead8';
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, 0);
  ctx.lineTo(-s * 0.09, -s);
  ctx.lineTo(s * 0.09, -s);
  ctx.lineTo(s * 0.16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.moveTo(-s * 0.13, -s * 0.42);
  ctx.lineTo(-s * 0.1, -s * 0.66);
  ctx.lineTo(s * 0.1, -s * 0.66);
  ctx.lineTo(s * 0.13, -s * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#160f33';
  ctx.fillRect(-s * 0.12, -s * 1.08, s * 0.24, s * 0.1);
  ctx.fillStyle = pal.sun;
  ctx.beginPath();
  ctx.arc(0, -s * 0.99, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Dani at Sunset: big striped sun, skyline, Dani and his car at the water. */
export function paintDaniSunset(ctx, x, y, w, h, pal) {
  skyFill(ctx, x, y, w, h, pal);
  stripedSun(ctx, x + w * 0.62, y + h * 0.34, Math.min(w, h) * 0.26, pal);
  const horizon = y + h * 0.52;
  skyline(ctx, x, horizon, w, h * 0.2, pal, 3);
  palmTree(ctx, x + w * 0.07, horizon + h * 0.02, h * 0.3, -0.12, pal);
  palmTree(ctx, x + w * 0.93, horizon + h * 0.02, h * 0.26, 0.14, pal);
  seaStreaks(ctx, x, horizon, w, y + h - horizon, pal, 5);
  wedgeCar(ctx, x + w * 0.58, y + h * 0.8, Math.min(w, h) * 0.24, pal);
  daniFigure(ctx, x + w * 0.16, y + h * 0.82, Math.min(w, h) * 0.3, pal);
}

/** Boat Chase: a speedboat tearing across dusk water under a low sun. */
export function paintBoatChase(ctx, x, y, w, h, pal) {
  skyFill(ctx, x, y, w, h, pal);
  stripedSun(ctx, x + w * 0.78, y + h * 0.26, Math.min(w, h) * 0.17, pal);
  const horizon = y + h * 0.48;
  seaStreaks(ctx, x, horizon, w, y + h - horizon, pal, 9);
  ctx.save();
  ctx.shadowColor = '#ff2e63';
  ctx.shadowBlur = h * 0.12;
  ctx.fillStyle = '#ff2e63';
  ctx.beginPath();
  ctx.arc(x + w * 0.14, horizon + h * 0.05, h * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#2e7dff';
  ctx.fillStyle = '#2e7dff';
  ctx.beginPath();
  ctx.arc(x + w * 0.22, horizon + h * 0.06, h * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  speedBoat(ctx, x + w * 0.58, y + h * 0.72, Math.min(w, h) * 0.2, pal);
}

/** Lighthouse Docks: striped lighthouse, beam, a small boat on calm water. */
export function paintLighthouseDocks(ctx, x, y, w, h, pal) {
  skyFill(ctx, x, y, w, h, pal);
  stripedSun(ctx, x + w * 0.3, y + h * 0.3, Math.min(w, h) * 0.18, pal);
  const horizon = y + h * 0.58;
  seaStreaks(ctx, x, horizon, w, y + h - horizon, pal, 2);
  ctx.fillStyle = '#160f33';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.55, y + h * 0.86);
  ctx.lineTo(x + w, y + h * 0.94);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0d0a24';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.78);
  ctx.lineTo(x + w * 0.42, y + h * 0.78);
  ctx.lineTo(x + w * 0.36, y + h * 0.84);
  ctx.lineTo(x + w * 0.24, y + h * 0.84);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x + w * 0.29, y + h * 0.66, w * 0.012, h * 0.12);
  lighthouse(ctx, x + w * 0.78, y + h * 0.92, Math.min(w, h) * 0.42, pal);
}

/** Neon Street: dark boulevard, glowing signs, a car under pink and cyan light. */
export function paintNeonStreet(ctx, x, y, w, h, pal) {
  ctx.fillStyle = '#12082e';
  ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#1c0b45');
  g.addColorStop(0.6, '#3d1157');
  g.addColorStop(1, '#12082e');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h * 0.62);
  const signs = [
    { label: 'BAR', cx: 0.18, cy: 0.24, color: pal.neon },
    { label: 'HOTEL', cx: 0.78, cy: 0.2, color: pal.neon2 },
    { label: 'TACOS', cx: 0.5, cy: 0.36, color: pal.sun },
  ];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const s of signs) {
    const sw = w * 0.2;
    const sh = h * 0.11;
    const sx = x + w * s.cx - sw / 2;
    const sy = y + h * s.cy - sh / 2;
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = h * 0.06;
    ctx.fillStyle = s.color;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#12082e';
    ctx.font = `900 ${Math.round(h * 0.075)}px Arial, sans-serif`;
    ctx.fillText(s.label, x + w * s.cx, y + h * s.cy + 1);
    ctx.restore();
  }
  ctx.fillStyle = '#0a0618';
  ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = pal.neon;
  ctx.fillRect(x + w * 0.08, y + h * 0.62, w * 0.2, h * 0.38);
  ctx.fillStyle = pal.neon2;
  ctx.fillRect(x + w * 0.68, y + h * 0.62, w * 0.2, h * 0.38);
  ctx.globalAlpha = 1;
  wedgeCar(ctx, x + w * 0.5, y + h * 0.82, Math.min(w, h) * 0.26, pal);
  palmTree(ctx, x + w * 0.06, y + h * 0.64, h * 0.3, -0.1, pal);
}

/** All four scene painters by id, in panel-picker order. */
export const SCENES = {
  dani: { name: 'Dani at Sunset', paint: paintDaniSunset },
  boat: { name: 'Boat Chase', paint: paintBoatChase },
  lighthouse: { name: 'Lighthouse Docks', paint: paintLighthouseDocks },
  neon: { name: 'Neon Street', paint: paintNeonStreet },
};
