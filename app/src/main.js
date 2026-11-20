// Editor for Solmar Bay Cover Studio.
// Wires the controls in index.html to the cover renderer: size, panel
// scenes and photos, text, colour grade, live preview and PNG export.

import { renderCover, panelAt, panelPolygons, SIZES, GRADES } from './cover.js';
import { SCENE_LIST } from './scenes.js';
import { applyShotParams } from './shots.js';

const TAGLINES = [
  'Every sunset has a price.',
  'The bay never forgets.',
  'Run the night.',
  'One last chase.',
];
const SUBTITLES = [
  'A DANI REYES STORY',
  'ONE LAST CHASE',
  'VICE GOLD',
  'THE BAY NEVER FORGETS',
];

const state = {
  size: 'landscape',
  grade: 'sunset',
  title: 'SOLMAR BAY',
  subtitle: 'A DANI REYES STORY',
  tagline: 'Every sunset has a price.',
  panels: [
    { mode: 'scene', scene: 'sunset', photo: null, photoName: '', zoom: 1, ox: 0, oy: 0 },
    { mode: 'scene', scene: 'boat', photo: null, photoName: '', zoom: 1, ox: 0, oy: 0 },
    { mode: 'scene', scene: 'neon', photo: null, photoName: '', zoom: 1, ox: 0, oy: 0 },
  ],
  selected: 0,
};

const preview = document.getElementById('preview');
const panelCardsEl = document.getElementById('panelCards');
let photosResolve;
const photosReady = new Promise((resolve) => { photosResolve = resolve; });

// A sample "photo": a beach portrait drawn in code, used by the
// Sample photo button and by ?photoN=sample presets.
function drawSamplePhoto(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#ff9a5e');
  sky.addColorStop(1, '#c94b6d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(w * 0.68, h * 0.22, w * 0.11, 0, Math.PI * 2);
  ctx.fill();
  const sea = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.78);
  sea.addColorStop(0, '#3d6a8a');
  sea.addColorStop(1, '#1d3a55');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.55, w, h * 0.23);
  ctx.fillStyle = 'rgba(255, 233, 168, 0.5)';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(w * (0.3 + ((i * 37) % 40) / 100), h * (0.58 + i * 0.018), w * 0.16, 3);
  }
  ctx.fillStyle = '#e8c890';
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  // Beach umbrella.
  ctx.fillStyle = '#f3ead8';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.62);
  ctx.lineTo(w * 0.44, h * 0.62);
  ctx.lineTo(w * 0.32, h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c22f2f';
  ctx.beginPath();
  ctx.moveTo(w * 0.26, h * 0.62);
  ctx.lineTo(w * 0.32, h * 0.5);
  ctx.lineTo(w * 0.38, h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a3a28';
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.62);
  ctx.lineTo(w * 0.32, h * 0.82);
  ctx.stroke();
  // Person standing on the sand.
  ctx.fillStyle = '#241028';
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.66, w * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.585, h * 0.96);
  ctx.quadraticCurveTo(w * 0.58, h * 0.74, w * 0.6, h * 0.7);
  ctx.lineTo(w * 0.64, h * 0.7);
  ctx.quadraticCurveTo(w * 0.66, h * 0.74, w * 0.655, h * 0.96);
  ctx.closePath();
  ctx.fill();
}

function makeSamplePhoto() {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 1200;
  drawSamplePhoto(c.getContext('2d'), c.width, c.height);
  const img = new Image();
  img.src = c.toDataURL('image/png');
  return new Promise((resolve) => { img.onload = () => resolve(img); });
}

async function loadSamplePhoto(i) {
  const img = await makeSamplePhoto();
  const panel = state.panels[i];
  panel.photo = img;
  panel.photoName = 'sample photo';
  panel.mode = 'photo';
  panel.zoom = 1;
  panel.ox = 0;
  panel.oy = 0;
  state.selected = i;
  render();
}

function loadPhotoFile(i, file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const panel = state.panels[i];
      panel.photo = img;
      panel.photoName = file.name;
      panel.mode = 'photo';
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      state.selected = i;
      render();
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function sceneName(panel) {
  return SCENE_LIST.find((s) => s.key === panel.scene)?.name ?? panel.scene;
}

function buildPanelCards() {
  panelCardsEl.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.dataset.panel = String(i);
    const sceneButtons = SCENE_LIST.map((s) =>
      `<button type="button" class="pill scene-pick" data-scene="${s.key}">${s.name}</button>`).join('');
    card.innerHTML = `
      <h3>PANEL ${i + 1} <span class="status"></span></h3>
      <div class="row">${sceneButtons}</div>
      <div class="row">
        <button type="button" class="mini accent upload-btn">Upload photo</button>
        <button type="button" class="mini sample-btn">Sample photo</button>
        <button type="button" class="mini back-btn">Back to scene</button>
      </div>
      <div class="zoom-label"><span>Zoom</span><span class="zoom-val">1.00&times;</span></div>
      <input type="range" class="zoom" min="0.5" max="3" step="0.05" value="1" aria-label="Zoom panel ${i + 1}">
      <input type="file" class="file-input" accept="image/*" hidden>`;
    card.querySelectorAll('.scene-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        panel.mode = 'scene';
        panel.scene = btn.dataset.scene;
        state.selected = i;
        render();
      });
    });
    card.querySelector('.upload-btn').addEventListener('click', () => {
      card.querySelector('.file-input').click();
    });
    card.querySelector('.file-input').addEventListener('change', (e) => {
      loadPhotoFile(i, e.target.files[0]);
      e.target.value = '';
    });
    card.querySelector('.sample-btn').addEventListener('click', () => {
      state.selected = i;
      loadSamplePhoto(i);
    });
    card.querySelector('.back-btn').addEventListener('click', () => {
      panel.mode = 'scene';
      state.selected = i;
      render();
    });
    card.querySelector('.zoom').addEventListener('input', (e) => {
      panel.zoom = Number(e.target.value);
      render();
    });
    card.addEventListener('click', () => { state.selected = i; render(); });
    panelCardsEl.appendChild(card);
  });
}

function render() {
  renderCover(preview, state);
  document.querySelectorAll('#sizeRow .pill').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.querySelectorAll('#gradeRow .pill').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('.panel-card').forEach((card, i) => {
    const panel = state.panels[i];
    card.classList.toggle('selected', state.selected === i);
    card.querySelectorAll('.scene-pick').forEach((b) => {
      b.classList.toggle('active', panel.mode === 'scene' && b.dataset.scene === panel.scene);
    });
    const status = card.querySelector('.status');
    status.textContent = panel.mode === 'photo'
      ? `Photo: ${panel.photoName} — drag the cover to move it.`
      : `Scene: ${sceneName(panel)}`;
    const zoom = card.querySelector('.zoom');
    zoom.disabled = panel.mode !== 'photo';
    zoom.value = String(panel.zoom);
    card.querySelector('.zoom-val').textContent = `${panel.zoom.toFixed(2)}×`;
  });
}

async function exportPNG() {
  const c = document.createElement('canvas');
  renderCover(c, state);
  const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `solmar-bay-cover-${state.size}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return blob;
}

function randomize() {
  const rnd = Math.random;
  state.panels.forEach((panel) => {
    panel.mode = 'scene';
    panel.scene = SCENE_LIST[Math.floor(rnd() * SCENE_LIST.length)].key;
  });
  const grades = Object.keys(GRADES);
  state.grade = grades[Math.floor(rnd() * grades.length)];
  state.subtitle = SUBTITLES[Math.floor(rnd() * SUBTITLES.length)];
  state.tagline = TAGLINES[Math.floor(rnd() * TAGLINES.length)];
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('taglineInput').value = state.tagline;
  render();
}

function canvasPoint(e) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (preview.width / rect.width),
    y: (e.clientY - rect.top) * (preview.height / rect.height),
  };
}

let drag = null;
preview.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(preview.width, preview.height, p.x, p.y);
  state.selected = i;
  const panel = state.panels[i];
  drag = { i, x: p.x, y: p.y, moved: 0, photo: panel.mode === 'photo' };
  preview.setPointerCapture(e.pointerId);
  render();
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  if (drag.photo && drag.moved > 2) {
    const panel = state.panels[drag.i];
    const polys = panelPolygons(preview.width, preview.height);
    const poly = polys[drag.i];
    const bw = Math.max(...poly.map((q) => q[0])) - Math.min(...poly.map((q) => q[0]));
    const bh = Math.max(...poly.map((q) => q[1])) - Math.min(...poly.map((q) => q[1]));
    panel.ox = Math.max(-0.5, Math.min(0.5, panel.ox + dx / bw));
    panel.oy = Math.max(-0.5, Math.min(0.5, panel.oy + dy / bh));
    drag.x = p.x;
    drag.y = p.y;
    render();
  }
});
preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('dragover', (e) => e.preventDefault());
preview.addEventListener('drop', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const i = panelAt(preview.width, preview.height, p.x, p.y);
  loadPhotoFile(i, e.dataTransfer.files[0]);
});

document.getElementById('sizeRow').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-size]');
  if (!btn) return;
  state.size = btn.dataset.size;
  render();
});
document.getElementById('gradeRow').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-grade]');
  if (!btn) return;
  state.grade = btn.dataset.grade;
  render();
});
document.getElementById('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value.toUpperCase();
  render();
});
document.getElementById('subtitleInput').addEventListener('input', (e) => {
  state.subtitle = e.target.value.toUpperCase();
  render();
});
document.getElementById('taglineInput').addEventListener('input', (e) => {
  state.tagline = e.target.value;
  render();
});
document.getElementById('exportBtn').addEventListener('click', exportPNG);
document.getElementById('randomBtn').addEventListener('click', randomize);
document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'e' || e.key === 'E') exportPNG();
  if (e.key === 'r' || e.key === 'R') randomize();
});

buildPanelCards();
applyShotParams(state, { loadSamplePhoto }).then(() => {
  render();
  photosResolve();
});

window.__studio = { state, render, exportPNG, makeSamplePhoto, randomize, photosReady };
