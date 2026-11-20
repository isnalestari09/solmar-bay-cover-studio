// Procedural scene painters for Solmar Bay Cover Studio.
// Every scene is drawn in code on a canvas — no image files, no
// borrowed artwork. Each painter takes a 2d context and the size of
// the area to fill, and uses a fixed seed so the same scene always
// draws the same way.

export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sky(ctx, w, h, stops, until = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, h * until);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h * until);
}

function stars(ctx, w, h, seed, count, top = 0.55) {
  const rnd = makeRng(seed);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h * top;
    const r = 0.6 + rnd() * 1.6;
    ctx.globalAlpha = 0.25 + rnd() * 0.65;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function palm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.085;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.55, x + s * 0.3, y - s * 0.95);
  ctx.stroke();
  const tx = x + s * 0.3;
  const ty = y - s * 0.95;
  ctx.lineWidth = s * 0.045;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.12 + i * 0.15);
    const ex = tx + Math.cos(a) * s * 0.55;
    const ey = ty + Math.sin(a) * s * 0.4 + s * 0.2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * s * 0.32, ty + Math.sin(a) * s * 0.08 - s * 0.14,
      ex, ey,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function figure(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.72, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.22, y);
  ctx.quadraticCurveTo(x - s * 0.26, y - s * 0.55, x - s * 0.1, y - s * 0.58);
  ctx.lineTo(x + s * 0.1, y - s * 0.58);
  ctx.quadraticCurveTo(x + s * 0.26, y - s * 0.55, x + s * 0.22, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function skyline(ctx, w, baseY, seed, color, lit = true) {
  const rnd = makeRng(seed);
  ctx.save();
  ctx.fillStyle = color;
  let x = -w * 0.02;
  while (x < w * 1.02) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = baseY * (0.25 + rnd() * 0.6);
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (lit) {
      ctx.fillStyle = 'rgba(255, 205, 110, 0.85)';
      const cols = Math.max(1, Math.floor(bw / (w * 0.018)));
      const rows = Math.max(1, Math.floor(bh / (baseY * 0.09)));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rnd() < 0.45) {
            ctx.fillRect(
              x + bw * 0.14 + c * (bw * 0.72 / cols),
              baseY - bh + bh * 0.12 + r * (bh * 0.76 / rows),
              Math.max(1.5, w * 0.006), Math.max(1.5, baseY * 0.03),
            );
          }
        }
      }
      ctx.fillStyle = color;
    }
    x += bw + w * 0.008;
  }
  ctx.restore();
}

// "Dani at Sunset" — synthwave sun over the bay, skyline, a lone
// figure on the shore.
export function paintSunset(ctx, w, h) {
  sky(ctx, w, h, [[0, '#2a1052'], [0.42, '#7b2d6b'], [0.62, '#e85d4a'], [0.72, '#ff9e45']], 0.66);
  const sunX = w * 0.6;
  const sunY = h * 0.36;
  const sunR = Math.min(w, h) * 0.27;
  const sg = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sg.addColorStop(0, '#ffd76a');
  sg.addColorStop(1, '#ff7a2f');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Slats cut across the lower half of the sun.
  ctx.fillStyle = 'rgba(60, 20, 80, 0.5)';
  for (let i = 0; i < 5; i++) {
    const y = sunY + sunR * (0.08 + i * 0.17);
    const half = Math.sqrt(Math.max(0, sunR * sunR - (y - sunY) * (y - sunY)));
    ctx.fillRect(sunX - half, y, half * 2, sunR * (0.035 + i * 0.012));
  }
  skyline(ctx, w, h * 0.66, 11, '#1c0b33');
  // Sea with the sun's reflection.
  const sea = ctx.createLinearGradient(0, h * 0.66, 0, h);
  sea.addColorStop(0, '#ff7a3c');
  sea.addColorStop(1, '#7a1e4d');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.66, w, h * 0.34);
  const rnd = makeRng(23);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.5)';
  for (let i = 0; i < 26; i++) {
    const y = h * (0.68 + rnd() * 0.28);
    const rw = w * (0.02 + rnd() * 0.12) * (1 - (y - h * 0.68) / (h * 0.3));
    ctx.fillRect(sunX - rw / 2 + (rnd() - 0.5) * w * 0.08, y, Math.max(2, rw), Math.max(1.5, h * 0.004));
  }
  palm(ctx, w * 0.06, h * 0.72, h * 0.42, '#160a28');
  figure(ctx, w * 0.56, h * 0.88, h * 0.15, '#160a28');
}

// "Boat Chase" — a speedboat tearing across a night sea under a
// lighthouse beam, city lights on the horizon.
export function paintBoatChase(ctx, w, h) {
  sky(ctx, w, h, [[0, '#04061a'], [0.55, '#0a1e42']], 0.58);
  stars(ctx, w, h, 31, 70, 0.5);
  // Moon with a soft halo.
  const mx = w * 0.8;
  const my = h * 0.16;
  const glow = ctx.createRadialGradient(mx, my, 2, mx, my, Math.min(w, h) * 0.22);
  glow.addColorStop(0, 'rgba(244, 241, 222, 0.5)');
  glow.addColorStop(1, 'rgba(244, 241, 222, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(mx - Math.min(w, h) * 0.22, my - Math.min(w, h) * 0.22, Math.min(w, h) * 0.44, Math.min(w, h) * 0.44);
  ctx.fillStyle = '#f4f1de';
  ctx.beginPath();
  ctx.arc(mx, my, Math.min(w, h) * 0.06, 0, Math.PI * 2);
  ctx.fill();
  // Distant city lights on the horizon.
  const rnd = makeRng(47);
  for (let i = 0; i < 46; i++) {
    ctx.globalAlpha = 0.3 + rnd() * 0.6;
    ctx.fillStyle = ['#ffd27a', '#ff9a5e', '#9fd8ff'][i % 3];
    ctx.fillRect(rnd() * w, h * (0.52 + rnd() * 0.04), Math.max(1.5, w * 0.004), Math.max(1.5, h * 0.005));
  }
  ctx.globalAlpha = 1;
  // Sea.
  const sea = ctx.createLinearGradient(0, h * 0.58, 0, h);
  sea.addColorStop(0, '#0a1e42');
  sea.addColorStop(1, '#020610');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  ctx.strokeStyle = 'rgba(120, 180, 255, 0.12)';
  ctx.lineWidth = Math.max(1, h * 0.002);
  for (let i = 0; i < 9; i++) {
    const y = h * (0.62 + i * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // Lighthouse beam sweeping in from the right.
  ctx.fillStyle = 'rgba(255, 244, 200, 0.10)';
  ctx.beginPath();
  ctx.moveTo(w * 0.97, h * 0.28);
  ctx.lineTo(w * 0.45, h * 0.72);
  ctx.lineTo(w * 0.62, h * 0.78);
  ctx.closePath();
  ctx.fill();
  // Speedboat.
  const bx = w * 0.42;
  const by = h * 0.68;
  const s = Math.min(w, h) * 0.5;
  ctx.save();
  ctx.translate(bx, by);
  // Wake.
  ctx.fillStyle = 'rgba(232, 236, 244, 0.75)';
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, s * 0.1);
  ctx.lineTo(-s * 0.95, s * 0.02);
  ctx.lineTo(-s * 0.95, s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, s * 0.16);
  ctx.lineTo(-s * 0.8, s * 0.3);
  ctx.lineTo(-s * 0.72, s * 0.12);
  ctx.closePath();
  ctx.fill();
  // Hull.
  ctx.fillStyle = '#e8ecf4';
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, 0);
  ctx.lineTo(s * 0.4, -s * 0.02);
  ctx.lineTo(s * 0.48, s * 0.1);
  ctx.lineTo(-s * 0.3, s * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d92038';
  ctx.fillRect(-s * 0.3, s * 0.06, s * 0.72, s * 0.025);
  // Cabin and windshield.
  ctx.fillStyle = '#101828';
  ctx.beginPath();
  ctx.moveTo(-s * 0.05, -s * 0.02);
  ctx.lineTo(s * 0.16, -s * 0.02);
  ctx.lineTo(s * 0.22, -s * 0.16);
  ctx.lineTo(s * 0.02, -s * 0.16);
  ctx.closePath();
  ctx.fill();
  // Driver.
  ctx.fillStyle = '#0b1220';
  ctx.beginPath();
  ctx.arc(s * 0.08, -s * 0.2, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  // Spray.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 12; i++) {
    const a = rnd();
    ctx.beginPath();
    ctx.arc(-s * (0.5 + a * 0.4), -s * (0.05 + rnd() * 0.22), Math.max(1, s * 0.012), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// "Lighthouse Docks" — a striped lighthouse over a wooden dock at dusk.
export function paintLighthouse(ctx, w, h) {
  sky(ctx, w, h, [[0, '#3d1c4d'], [0.5, '#c96a3a'], [0.68, '#ffb347']], 0.62);
  // Low sun.
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.5, Math.min(w, h) * 0.055, 0, Math.PI * 2);
  ctx.fill();
  // Gulls.
  ctx.strokeStyle = 'rgba(30, 10, 40, 0.8)';
  ctx.lineWidth = Math.max(1.5, h * 0.003);
  for (const [gx, gy, gs] of [[0.3, 0.16, 1], [0.42, 0.1, 0.8], [0.55, 0.2, 0.9]]) {
    ctx.beginPath();
    ctx.arc(w * gx - w * 0.012 * gs, h * gy, w * 0.012 * gs, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(w * gx + w * 0.012 * gs, h * gy, w * 0.012 * gs, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  // Sea.
  const sea = ctx.createLinearGradient(0, h * 0.62, 0, h);
  sea.addColorStop(0, '#8a4a5e');
  sea.addColorStop(1, '#2a1230');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.fillStyle = 'rgba(255, 210, 122, 0.35)';
  const rnd = makeRng(59);
  for (let i = 0; i < 18; i++) {
    ctx.fillRect(w * (0.08 + rnd() * 0.5), h * (0.66 + rnd() * 0.26), w * (0.02 + rnd() * 0.08), Math.max(1.5, h * 0.004));
  }
  // Lighthouse tower (tapered, striped).
  const lx = w * 0.62;
  const baseY = h * 0.82;
  const topY = h * 0.18;
  const topW = w * 0.055;
  const botW = w * 0.1;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(lx - topW, topY);
  ctx.lineTo(lx + topW, topY);
  ctx.lineTo(lx + botW, baseY);
  ctx.lineTo(lx - botW, baseY);
  ctx.closePath();
  ctx.clip();
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f3ead8' : '#c22f2f';
    ctx.fillRect(lx - botW - 4, topY + ((baseY - topY) / bands) * i, botW * 2 + 8, (baseY - topY) / bands + 1);
  }
  ctx.restore();
  // Gallery, lamp room and lamp.
  ctx.fillStyle = '#1c0b26';
  ctx.fillRect(lx - w * 0.075, topY - h * 0.035, w * 0.15, h * 0.035);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(lx - w * 0.035, topY - h * 0.075, w * 0.07, h * 0.04);
  ctx.strokeStyle = '#1c0b26';
  ctx.lineWidth = Math.max(1.5, w * 0.004);
  ctx.strokeRect(lx - w * 0.035, topY - h * 0.075, w * 0.07, h * 0.04);
  const lg = ctx.createRadialGradient(lx, topY - h * 0.055, 2, lx, topY - h * 0.055, w * 0.16);
  lg.addColorStop(0, 'rgba(255, 233, 168, 0.55)');
  lg.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = lg;
  ctx.fillRect(lx - w * 0.16, topY - h * 0.055 - w * 0.16, w * 0.32, w * 0.32);
  // Beams.
  ctx.fillStyle = 'rgba(255, 240, 180, 0.14)';
  ctx.beginPath();
  ctx.moveTo(lx - w * 0.03, topY - h * 0.05);
  ctx.lineTo(w * 0.02, h * 0.3);
  ctx.lineTo(w * 0.02, h * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(lx + w * 0.03, topY - h * 0.05);
  ctx.lineTo(w * 0.98, h * 0.24);
  ctx.lineTo(w * 0.98, h * 0.38);
  ctx.closePath();
  ctx.fill();
  // Wooden dock in the foreground.
  ctx.fillStyle = '#241028';
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  ctx.fillStyle = '#3a1e30';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(0, h * (0.83 + i * 0.028), w, Math.max(2, h * 0.012));
  }
  ctx.fillStyle = '#1c0b26';
  for (const px of [0.16, 0.5, 0.84]) {
    ctx.fillRect(w * px - w * 0.012, h * 0.8, w * 0.024, h * 0.2);
  }
  // Moored boat.
  ctx.fillStyle = '#e8ecf4';
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.74);
  ctx.lineTo(w * 0.3, h * 0.74);
  ctx.lineTo(w * 0.26, h * 0.79);
  ctx.lineTo(w * 0.12, h * 0.79);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1c0b26';
  ctx.lineWidth = Math.max(1.5, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(w * 0.19, h * 0.74);
  ctx.lineTo(w * 0.19, h * 0.6);
  ctx.stroke();
}

// "Neon Street" — a wet Vice City street at night, neon signs and palms.
export function paintNeonStreet(ctx, w, h) {
  sky(ctx, w, h, [[0, '#0d0618'], [0.6, '#1d0b33']], 0.7);
  stars(ctx, w, h, 71, 36, 0.3);
  // Buildings left and right.
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, h * 0.2, w * 0.26, h * 0.5);
  ctx.fillRect(w * 0.74, h * 0.12, w * 0.26, h * 0.58);
  ctx.fillStyle = 'rgba(255, 210, 122, 0.5)';
  const rnd = makeRng(83);
  for (let i = 0; i < 22; i++) {
    ctx.fillRect(w * (0.02 + rnd() * 0.2), h * (0.24 + rnd() * 0.4), Math.max(1.5, w * 0.008), Math.max(1.5, h * 0.008));
    ctx.fillRect(w * (0.78 + rnd() * 0.18), h * (0.16 + rnd() * 0.44), Math.max(1.5, w * 0.008), Math.max(1.5, h * 0.008));
  }
  // Neon signs with glowing frames and bar "lettering".
  const signs = [
    { x: 0.08, y: 0.14, sw: 0.2, sh: 0.11, color: '#29e6ff', word: 'VICE' },
    { x: 0.72, y: 0.3, sw: 0.19, sh: 0.1, color: '#ff4da6', word: 'BAY' },
    { x: 0.08, y: 0.42, sw: 0.16, sh: 0.09, color: '#7dff5e', word: '' },
    { x: 0.74, y: 0.08, sw: 0.15, sh: 0.08, color: '#ffd23e', word: '24H' },
  ];
  for (const s of signs) {
    const sx = w * s.x;
    const sy = h * s.y;
    const sw = w * s.sw;
    const sh = h * s.sh;
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = Math.min(w, h) * 0.03;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = Math.max(2, w * 0.005);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.fillStyle = s.color;
    if (s.word) {
      ctx.font = `900 ${Math.round(sh * 0.52)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.word, sx + sw / 2, sy + sh / 2 + sh * 0.04);
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(sx + sw * 0.14, sy + sh * (0.2 + i * 0.26), sw * (0.72 - i * 0.12), Math.max(2, sh * 0.1));
      }
    }
    ctx.restore();
  }
  // Wet street, widening toward the viewer.
  ctx.fillStyle = '#0a0614';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.68);
  ctx.lineTo(w * 0.7, h * 0.68);
  ctx.lineTo(w * 0.98, h);
  ctx.lineTo(w * 0.02, h);
  ctx.closePath();
  ctx.fill();
  // Neon reflections on the wet road.
  ctx.save();
  ctx.globalAlpha = 0.28;
  for (const [rx, color, rw] of [[0.1, '#29e6ff', 0.1], [0.82, '#ff4da6', 0.09], [0.12, '#7dff5e', 0.07], [0.85, '#ffd23e', 0.06]]) {
    ctx.fillStyle = color;
    ctx.fillRect(w * rx, h * 0.72, w * rw, h * 0.26);
  }
  ctx.restore();
  // Dashed centre line.
  ctx.strokeStyle = '#f5b942';
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.setLineDash([h * 0.05, h * 0.04]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.7);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);
  // Car silhouette with headlights.
  const cx = w * 0.62;
  const cy = h * 0.9;
  const cw = w * 0.22;
  ctx.fillStyle = '#05030a';
  ctx.beginPath();
  ctx.moveTo(cx - cw / 2, cy);
  ctx.lineTo(cx - cw * 0.32, cy - h * 0.05);
  ctx.lineTo(cx + cw * 0.28, cy - h * 0.05);
  ctx.lineTo(cx + cw / 2, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 244, 200, 0.16)';
  ctx.beginPath();
  ctx.moveTo(cx + cw * 0.28, cy - h * 0.02);
  ctx.lineTo(cx + cw * 0.62, h * 0.72);
  ctx.lineTo(cx + cw * 0.7, h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(cx + cw * 0.3, cy - h * 0.015, Math.max(2, w * 0.008), 0, Math.PI * 2);
  ctx.fill();
  palm(ctx, w * 0.24, h * 0.72, h * 0.34, '#07030d');
  palm(ctx, w * 0.76, h * 0.7, h * 0.3, '#07030d');
}

export const SCENE_LIST = [
  { key: 'sunset', name: 'Dani at Sunset', paint: paintSunset },
  { key: 'boat', name: 'Boat Chase', paint: paintBoatChase },
  { key: 'lighthouse', name: 'Lighthouse Docks', paint: paintLighthouse },
  { key: 'neon', name: 'Neon Street', paint: paintNeonStreet },
];
