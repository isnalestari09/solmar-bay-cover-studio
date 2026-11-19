// Solmar Bay scene painters: every scene is drawn from scratch on canvas —
// no Rockstar artwork, no photo, no copied image. Each painter fills the
// rectangle (x, y, w, h) with one original Solmar Bay moment.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    skyTop: '#2b1055', skyMid: '#7597de', skyLow: '#ff7e5f', sun: '#ffd76a',
    sunGlow: 'rgba(255,183,77,0.55)', sea: '#1d3a5f', seaLight: '#ff9a5c',
    silhouette: '#160a2e', accent: '#ff5e78', light: '#ffe9a8',
  },
  neon: {
    name: 'Neon Nights',
    skyTop: '#05010f', skyMid: '#1b0f3b', skyLow: '#3b0f54', sun: '#ff2e88',
    sunGlow: 'rgba(255,46,136,0.5)', sea: '#0a1030', seaLight: '#ff2e88',
    silhouette: '#070213', accent: '#00e5ff', light: '#ff9de2',
  },
  gold: {
    name: 'Vice Gold',
    skyTop: '#3a1c00', skyMid: '#b25a1b', skyLow: '#ffc46b', sun: '#fff3c4',
    sunGlow: 'rgba(255,196,107,0.6)', sea: '#233246', seaLight: '#ffc46b',
    silhouette: '#1c1005', accent: '#ff8c1a', light: '#fff3c4',
  },
};

function sky(ctx, x, y, w, h, g) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, g.skyTop);
  grad.addColorStop(0.55, g.skyMid);
  grad.addColorStop(1, g.skyLow);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function sunDisc(ctx, cx, cy, r, g) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6);
  glow.addColorStop(0, g.sunGlow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
  ctx.fillStyle = g.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // retro sun slats
  ctx.fillStyle = g.skyLow;
  for (let i = 0; i < 3; i++) {
    const sy = cy + r * (0.15 + i * 0.28);
    ctx.fillRect(cx - r, sy, r * 2, r * 0.09);
  }
}

function seaBand(ctx, x, y, w, h, g) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, g.seaLight);
  grad.addColorStop(0.25, g.sea);
  grad.addColorStop(1, '#060a18');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // sun reflection streaks
  ctx.fillStyle = g.sun;
  for (let i = 0; i < 9; i++) {
    const ry = y + h * (0.12 + i * 0.1);
    const rw = w * (0.34 - i * 0.028);
    ctx.globalAlpha = 0.5 - i * 0.045;
    ctx.fillRect(x + (w - rw) / 2 + (i % 2 ? w * 0.02 : -w * 0.02), ry, rw, h * 0.02);
  }
  ctx.globalAlpha = 1;
}

function skyline(ctx, x, baseY, w, h, g) {
  ctx.fillStyle = g.silhouette;
  let px = x;
  while (px < x + w) {
    const bw = w * (0.05 + Math.random() * 0.07);
    const bh = h * (0.25 + Math.random() * 0.55);
    ctx.fillRect(px, baseY - bh, bw, bh);
    // lit windows
    ctx.fillStyle = g.light;
    for (let wy = baseY - bh + h * 0.04; wy < baseY - h * 0.03; wy += h * 0.09) {
      for (let wx = px + bw * 0.2; wx < px + bw * 0.8; wx += bw * 0.3) {
        if (Math.random() < 0.4) ctx.fillRect(wx, wy, bw * 0.1, h * 0.035);
      }
    }
    ctx.fillStyle = g.silhouette;
    px += bw + w * 0.012;
  }
}

function palm(ctx, x, baseY, s, g) {
  ctx.strokeStyle = g.silhouette;
  ctx.lineWidth = s * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + s * 0.08, baseY - s * 0.55, x + s * 0.22, baseY - s * 0.95);
  ctx.stroke();
  ctx.fillStyle = g.silhouette;
  const tx = x + s * 0.22, ty = baseY - s * 0.95;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.08 + i * 0.16);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * s * 0.42, ty + Math.sin(a) * s * 0.3 + s * 0.12,
      tx + Math.cos(a) * s * 0.62, ty + Math.sin(a) * s * 0.55 + s * 0.3);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * s * 0.3, ty + Math.sin(a) * s * 0.28 + s * 0.08,
      tx, ty);
    ctx.fill();
  }
  // coconuts
  ctx.beginPath(); ctx.arc(tx - s * 0.04, ty + s * 0.06, s * 0.045, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(tx + s * 0.05, ty + s * 0.07, s * 0.04, 0, Math.PI * 2); ctx.fill();
}

/** Hero panel: Dani Reyes, getaway driver, back to camera, sunset coast. */
export function drawDriver(ctx, x, y, w, h, g) {
  sky(ctx, x, y, w, h, g);
  sunDisc(ctx, x + w * 0.62, y + h * 0.34, Math.min(w, h) * 0.2, g);
  skyline(ctx, x, y + h * 0.62, w, h * 0.3, g);
  seaBand(ctx, x, y + h * 0.62, w, h * 0.38, g);
  palm(ctx, x + w * 0.08, y + h * 0.66, h * 0.34, g);
  palm(ctx, x + w * 0.9, y + h * 0.64, h * 0.28, g);
  // getaway car silhouette, low and wide
  const cx = x + w * 0.52, cy = y + h * 0.86, cw = w * 0.52, ch = h * 0.1;
  ctx.fillStyle = '#0b0616';
  ctx.beginPath();
  ctx.moveTo(cx - cw / 2, cy);
  ctx.lineTo(cx - cw * 0.42, cy - ch * 0.55);
  ctx.lineTo(cx - cw * 0.18, cy - ch * 1.15);
  ctx.lineTo(cx + cw * 0.16, cy - ch * 1.2);
  ctx.lineTo(cx + cw * 0.4, cy - ch * 0.5);
  ctx.lineTo(cx + cw / 2, cy);
  ctx.closePath(); ctx.fill();
  // wheels + headlight glow
  ctx.beginPath(); ctx.arc(cx - cw * 0.3, cy, ch * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + cw * 0.3, cy, ch * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = g.sun;
  ctx.beginPath(); ctx.arc(cx + cw * 0.47, cy - ch * 0.42, ch * 0.16, 0, Math.PI * 2); ctx.fill();
  // sun rim along the roofline so the car reads against the dark sea
  ctx.strokeStyle = g.sun;
  ctx.lineWidth = ch * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx - cw * 0.42, cy - ch * 0.55);
  ctx.lineTo(cx - cw * 0.18, cy - ch * 1.15);
  ctx.lineTo(cx + cw * 0.16, cy - ch * 1.2);
  ctx.stroke();
  // Dani, back view, jacket, hands in pockets
  const dx = x + w * 0.2, dy = y + h * 0.98, s = h * 0.42;
  ctx.fillStyle = '#0b0616';
  ctx.beginPath(); ctx.arc(dx, dy - s * 0.86, s * 0.11, 0, Math.PI * 2); ctx.fill(); // head
  ctx.beginPath(); // jacket
  ctx.moveTo(dx - s * 0.16, dy);
  ctx.lineTo(dx - s * 0.19, dy - s * 0.62);
  ctx.quadraticCurveTo(dx - s * 0.2, dy - s * 0.78, dx, dy - s * 0.78);
  ctx.quadraticCurveTo(dx + s * 0.2, dy - s * 0.78, dx + s * 0.19, dy - s * 0.62);
  ctx.lineTo(dx + s * 0.16, dy);
  ctx.closePath(); ctx.fill();
  // jacket collar + red accent stripe
  ctx.fillStyle = g.accent;
  ctx.fillRect(dx - s * 0.19, dy - s * 0.6, s * 0.38, s * 0.045);
  ctx.fillStyle = '#0b0616';
  ctx.fillRect(dx - s * 0.07, dy - s * 0.08, s * 0.06, s * 0.08);
  ctx.fillRect(dx + s * 0.01, dy - s * 0.08, s * 0.06, s * 0.08);
  // sun rim on Dani's sun side so the silhouette reads
  ctx.strokeStyle = g.sun;
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.arc(dx, dy - s * 0.86, s * 0.11, -Math.PI * 0.45, Math.PI * 0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(dx + s * 0.19, dy - s * 0.62);
  ctx.lineTo(dx + s * 0.16, dy - s * 0.05);
  ctx.stroke();
}

/** Lighthouse at the docks, dusk beam sweeping the bay. */
export function drawLighthouse(ctx, x, y, w, h, g) {
  sky(ctx, x, y, w, h, g);
  sunDisc(ctx, x + w * 0.24, y + h * 0.3, Math.min(w, h) * 0.13, g);
  seaBand(ctx, x, y + h * 0.66, w, h * 0.34, g);
  const lx = x + w * 0.62, bw = w * 0.16;
  // rocks
  ctx.fillStyle = g.silhouette;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.4, y + h * 0.86);
  ctx.lineTo(x + w * 0.85, y + h * 0.9);
  ctx.lineTo(x + w, y + h * 0.82);
  ctx.lineTo(x + w, y + h);
  ctx.closePath(); ctx.fill();
  // tower
  const top = y + h * 0.18, base = y + h * 0.92;
  ctx.fillStyle = '#f5ead6';
  ctx.beginPath();
  ctx.moveTo(lx - bw * 0.32, base);
  ctx.lineTo(lx - bw * 0.18, top);
  ctx.lineTo(lx + bw * 0.18, top);
  ctx.lineTo(lx + bw * 0.32, base);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = g.accent;
  ctx.beginPath();
  ctx.moveTo(lx - bw * 0.27, base - (base - top) * 0.28);
  ctx.lineTo(lx - bw * 0.22, base - (base - top) * 0.52);
  ctx.lineTo(lx + bw * 0.22, base - (base - top) * 0.52);
  ctx.lineTo(lx + bw * 0.27, base - (base - top) * 0.28);
  ctx.closePath(); ctx.fill();
  // lamp room + beam
  ctx.fillStyle = '#140a24';
  ctx.fillRect(lx - bw * 0.26, top - h * 0.07, bw * 0.52, h * 0.07);
  ctx.fillStyle = g.sun;
  ctx.beginPath(); ctx.arc(lx, top - h * 0.035, h * 0.028, 0, Math.PI * 2); ctx.fill();
  const beam = ctx.createLinearGradient(lx, top, x + w, top + h * 0.1);
  beam.addColorStop(0, 'rgba(255,231,150,0.75)');
  beam.addColorStop(1, 'rgba(255,231,150,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(lx, top - h * 0.03);
  ctx.lineTo(x + w, top - h * 0.12);
  ctx.lineTo(x + w, top + h * 0.22);
  ctx.lineTo(lx, top + h * 0.03);
  ctx.closePath(); ctx.fill();
  // moored boat
  ctx.fillStyle = g.silhouette;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.78);
  ctx.lineTo(x + w * 0.3, y + h * 0.78);
  ctx.lineTo(x + w * 0.26, y + h * 0.84);
  ctx.lineTo(x + w * 0.12, y + h * 0.84);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(x + w * 0.17, y + h * 0.62, w * 0.012, h * 0.16);
}

/** Boat chase: speedboat cutting the bay, patrol boat behind, red/blue glow. */
export function drawBoatChase(ctx, x, y, w, h, g) {
  sky(ctx, x, y, w, h, g);
  sunDisc(ctx, x + w * 0.78, y + h * 0.26, Math.min(w, h) * 0.11, g);
  seaBand(ctx, x, y + h * 0.55, w, h * 0.45, g);
  // speedboat
  const bx = x + w * 0.42, by = y + h * 0.72;
  ctx.fillStyle = '#f5ead6';
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.2, by);
  ctx.lineTo(bx + w * 0.22, by);
  ctx.lineTo(bx + w * 0.16, by + h * 0.07);
  ctx.lineTo(bx - w * 0.14, by + h * 0.07);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0b0616';
  ctx.fillRect(bx - w * 0.05, by - h * 0.1, w * 0.1, h * 0.1);
  ctx.fillStyle = g.accent;
  ctx.fillRect(bx - w * 0.05, by - h * 0.02, w * 0.1, h * 0.02);
  ctx.fillStyle = '#0b0616';
  ctx.fillRect(bx - w * 0.02, by - h * 0.16, w * 0.015, h * 0.07);
  // wake
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = h * 0.012;
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.2, by + h * 0.06);
  ctx.lineTo(bx - w * 0.42, by + h * 0.16);
  ctx.moveTo(bx - w * 0.2, by + h * 0.06);
  ctx.lineTo(bx - w * 0.4, by - h * 0.02);
  ctx.stroke();
  // patrol boat with flashing lights
  const px = x + w * 0.08, py = y + h * 0.66;
  ctx.fillStyle = '#101c33';
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + w * 0.14, py);
  ctx.lineTo(px + w * 0.11, py + h * 0.05);
  ctx.lineTo(px + w * 0.02, py + h * 0.05);
  ctx.closePath(); ctx.fill();
  const flash = (c, dx) => {
    const fg = ctx.createRadialGradient(px + dx, py - h * 0.02, 1, px + dx, py - h * 0.02, h * 0.12);
    fg.addColorStop(0, c); fg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(px + dx - h * 0.12, py - h * 0.14, h * 0.24, h * 0.24);
  };
  flash('#ff2e4d', w * 0.03);
  flash('#2e7bff', w * 0.09);
  // spray dots
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.arc(bx - w * 0.22 - Math.random() * w * 0.2, by + h * (0.04 + Math.random() * 0.1), h * 0.008 + Math.random() * h * 0.01, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Neon street: wet boulevard, glowing signs, car headlights. */
export function drawNeonStreet(ctx, x, y, w, h, g) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#0a0218');
  grad.addColorStop(0.6, '#2a0a4a');
  grad.addColorStop(1, '#12041f');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // buildings
  ctx.fillStyle = '#0d031f';
  ctx.fillRect(x, y + h * 0.1, w * 0.3, h * 0.55);
  ctx.fillRect(x + w * 0.68, y + h * 0.05, w * 0.32, h * 0.6);
  // neon signs
  const sign = (sx, sy, sw, sh, color, text) => {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = h * 0.06;
    ctx.fillStyle = color;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(h * 0.07)}px Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, sx + sw / 2, sy + sh / 2);
    ctx.restore();
  };
  sign(x + w * 0.04, y + h * 0.16, w * 0.22, h * 0.1, '#ff2e88', 'BAR');
  sign(x + w * 0.72, y + h * 0.12, w * 0.24, h * 0.1, '#00e5ff', 'HOTEL');
  sign(x + w * 0.4, y + h * 0.3, w * 0.2, h * 0.09, '#ffd76a', 'TACOS');
  // wet road + reflections
  ctx.fillStyle = '#160b2e';
  ctx.fillRect(x, y + h * 0.65, w, h * 0.35);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ff2e88'; ctx.fillRect(x + w * 0.08, y + h * 0.66, w * 0.14, h * 0.3);
  ctx.fillStyle = '#00e5ff'; ctx.fillRect(x + w * 0.74, y + h * 0.66, w * 0.16, h * 0.3);
  ctx.globalAlpha = 1;
  // car with headlights
  const cx = x + w * 0.5, cy = y + h * 0.82, cw = w * 0.44, ch = h * 0.09;
  ctx.fillStyle = '#05010d';
  ctx.beginPath();
  ctx.moveTo(cx - cw / 2, cy);
  ctx.lineTo(cx - cw * 0.4, cy - ch * 0.6);
  ctx.lineTo(cx - cw * 0.16, cy - ch * 1.1);
  ctx.lineTo(cx + cw * 0.16, cy - ch * 1.1);
  ctx.lineTo(cx + cw * 0.4, cy - ch * 0.55);
  ctx.lineTo(cx + cw / 2, cy);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(cx - cw * 0.42, cy - ch * 0.4, ch * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + cw * 0.42, cy - ch * 0.4, ch * 0.14, 0, Math.PI * 2); ctx.fill();
  const beam = ctx.createLinearGradient(cx, cy, cx, cy + h * 0.18);
  beam.addColorStop(0, 'rgba(255,233,168,0.5)');
  beam.addColorStop(1, 'rgba(255,233,168,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(cx - cw * 0.4, cy);
  ctx.lineTo(cx + cw * 0.4, cy);
  ctx.lineTo(cx + cw * 0.62, cy + h * 0.18);
  ctx.lineTo(cx - cw * 0.62, cy + h * 0.18);
  ctx.closePath(); ctx.fill();
}

export const SCENES = {
  driver: { name: 'Dani at Sunset', draw: drawDriver },
  lighthouse: { name: 'Lighthouse Docks', draw: drawLighthouse },
  boat: { name: 'Boat Chase', draw: drawBoatChase },
  neon: { name: 'Neon Street', draw: drawNeonStreet },
};
