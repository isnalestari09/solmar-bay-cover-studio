// Solmar Bay Cover Studio: wires the page — pick a size, fill each panel
// with a drawn scene or your own photo, write the words, export the PNG.
import { drawCover, defaultState, panelAt, SIZES } from './cover.js';
import { GRADES, SCENES } from './scenes.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelName = document.getElementById('panelName');
const zoom = document.getElementById('zoom');
const state = defaultState();
let selected = 0;
let dragging = false;
let lastX = 0, lastY = 0;

const PANEL_NAMES = ['Hero', 'Panel 2', 'Panel 3'];

function redraw() {
  drawCover(canvas, state);
  panelName.textContent = PANEL_NAMES[selected];
  const p = state.panels[selected];
  zoom.value = String(p.scale || 1);
  zoom.disabled = !(p.kind === 'photo' && p.photo);
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function setPanelPhoto(img) {
  state.panels[selected] = { kind: 'photo', photo: img, px: 0.5, py: 0.5, scale: 1 };
  status.textContent = `Photo loaded into ${PANEL_NAMES[selected]} — drag to position, zoom to crop.`;
  redraw();
}

// Size buttons
const sizeRow = document.getElementById('sizes');
for (const [key, s] of Object.entries(SIZES)) {
  const b = document.createElement('button');
  b.textContent = s.name;
  b.classList.toggle('active', key === state.size);
  b.addEventListener('click', () => {
    state.size = key;
    sizeRow.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    redraw();
  });
  sizeRow.appendChild(b);
}

// Scene buttons for the selected panel
const sceneRow = document.getElementById('scenes');
for (const [key, s] of Object.entries(SCENES)) {
  const b = document.createElement('button');
  b.textContent = s.name;
  b.dataset.scene = key;
  b.addEventListener('click', () => {
    state.panels[selected] = { kind: 'scene', scene: key, photo: null, px: 0.5, py: 0.5, scale: 1 };
    sceneRow.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    status.textContent = `${s.name} in ${PANEL_NAMES[selected]}.`;
    redraw();
  });
  sceneRow.appendChild(b);
}
sceneRow.querySelector('[data-scene="driver"]').classList.add('active');

// Grade buttons
const gradeRow = document.getElementById('grades');
for (const [key, g] of Object.entries(GRADES)) {
  const b = document.createElement('button');
  b.textContent = g.name;
  b.classList.toggle('active', key === state.grade);
  b.addEventListener('click', () => {
    state.grade = key;
    gradeRow.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    redraw();
  });
  gradeRow.appendChild(b);
}

// Words
for (const id of ['title', 'subtitle', 'tagline']) {
  document.getElementById(id).addEventListener('input', (e) => {
    state[id] = e.target.value;
    redraw();
  });
}

// Photo upload + samples
document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setPanelPhoto(await loadImage(URL.createObjectURL(file)));
});
document.querySelectorAll('.sample').forEach((b) => {
  b.addEventListener('click', async () => {
    setPanelPhoto(await loadImage(b.dataset.sample));
  });
});
document.getElementById('clearPhoto').addEventListener('click', () => {
  state.panels[selected] = { kind: 'scene', scene: 'driver', photo: null, px: 0.5, py: 0.5, scale: 1 };
  status.textContent = 'Back to the drawn scene.';
  redraw();
});
zoom.addEventListener('input', () => {
  const p = state.panels[selected];
  if (p.kind === 'photo' && p.photo) {
    p.scale = Number(zoom.value);
    redraw();
  }
});

// Click a panel to select it; drag a photo panel to pan the photo.
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width;
  const fy = (e.clientY - r.top) / r.height;
  selected = panelAt(state, fx, fy);
  dragging = true;
  lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = state.panels[selected];
  if (p.kind !== 'photo' || !p.photo) return;
  const r = canvas.getBoundingClientRect();
  p.px += (e.clientX - lastX) / r.width;
  p.py += (e.clientY - lastY) / r.height;
  p.px = Math.max(0, Math.min(1, p.px));
  p.py = Math.max(0, Math.min(1, p.py));
  lastX = e.clientX; lastY = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = false; });

// Export the cover at full size.
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `solmar-bay-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved solmar-bay-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

// Shot mode: ?shot=cover|editor&size=..&photo=..&caption=.. renders a fixed
// scene so screenshots are the app's own drawing, nothing edited in.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  if (shot === 'cover') document.body.classList.add('shot');
  runShot(shot, params, state, async (sample, text) => {
    const img = await loadImage(sample);
    state.panels[1] = { kind: 'photo', photo: img, px: 0.5, py: 0.5, scale: 1 };
    if (text) state.title = text;
    redraw();
  });
  redraw();
} else {
  redraw();
}
