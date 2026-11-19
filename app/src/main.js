// main.js — editor wiring for Solmar Bay Cover Studio.
// Builds the control rows, keeps the canvas in sync with the state, and
// handles panel picking, photo pan/zoom, uploads, presets and PNG export.

import { drawCover, defaultState, SIZES, hitPanel } from './cover.js';
import { SCENES, GRADES } from './scenes.js';
import { shotFromUrl, applyShot, shotList, sampleNames, sampleSrc, loadImage } from './shots.js';

const canvas = document.getElementById('coverCanvas');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panelLabel');
const zoomRange = document.getElementById('zoomRange');
const zoomValue = document.getElementById('zoomValue');
const titleInput = document.getElementById('titleInput');
const subtitleInput = document.getElementById('subtitleInput');
const taglineInput = document.getElementById('taglineInput');
const photoInput = document.getElementById('photoInput');

const state = defaultState();
let readyResolve;
const ready = new Promise((resolve) => { readyResolve = resolve; });

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function selectedPanel() {
  return state.panels[state.selected];
}

function markActive(rowId, attr, value) {
  const row = document.getElementById(rowId);
  if (!row) return;
  for (const btn of row.querySelectorAll('button')) {
    btn.classList.toggle('active', btn.dataset[attr] === value);
  }
}

function render() {
  drawCover(canvas, state);
  markActive('sizeRow', 'size', state.size);
  markActive('gradeRow', 'grade', state.grade);
  markActive('sceneRow', 'scene', selectedPanel().kind === 'scene' ? selectedPanel().scene : '');
  markActive('sampleRow', 'sample', selectedPanel().kind === 'photo' ? (selectedPanel().sample || '') : '');
  const panel = selectedPanel();
  if (panelLabel) {
    panelLabel.textContent = panel.kind === 'photo'
      ? `Panel ${state.selected + 1} — your photo`
      : `Panel ${state.selected + 1} — ${SCENES.find((s) => s.id === panel.scene)?.name || panel.scene}`;
  }
  if (zoomRange) zoomRange.value = String(panel.zoom || 1);
  if (zoomValue) zoomValue.textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  if (titleInput && document.activeElement !== titleInput) titleInput.value = state.title;
  if (subtitleInput && document.activeElement !== subtitleInput) subtitleInput.value = state.subtitle;
  if (taglineInput && document.activeElement !== taglineInput) taglineInput.value = state.tagline;
}

function buildButton(rowId, label, dataset, title) {
  const row = document.getElementById(rowId);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  for (const [key, value] of Object.entries(dataset)) btn.dataset[key] = value;
  if (title) btn.title = title;
  row.appendChild(btn);
  return btn;
}

function buildControls() {
  for (const [id, label] of Object.entries(SIZES)) {
    const btn = buildButton('sizeRow', label.label, { size: id });
    btn.addEventListener('click', () => { state.size = id; render(); });
  }
  for (const grade of GRADES) {
    const btn = buildButton('gradeRow', grade.name, { grade: grade.id });
    btn.addEventListener('click', () => { state.grade = grade.id; render(); });
  }
  for (const scene of SCENES) {
    const btn = buildButton('sceneRow', scene.name, { scene: scene.id }, scene.hint);
    btn.addEventListener('click', () => {
      const panel = selectedPanel();
      panel.kind = 'scene';
      panel.scene = scene.id;
      panel.photo = null;
      panel.sample = null;
      render();
    });
  }
  for (const name of sampleNames()) {
    const btn = buildButton('sampleRow', name === 'pier' ? 'Pier photo' : 'Boulevard photo', { sample: name });
    btn.addEventListener('click', async () => {
      try {
        const img = await loadImage(sampleSrc(name));
        const panel = selectedPanel();
        panel.kind = 'photo';
        panel.photo = img;
        panel.sample = name;
        panel.zoom = 1; panel.dx = 0; panel.dy = 0;
        setStatus(`Loaded the ${name} sample into panel ${state.selected + 1}.`);
        render();
      } catch (err) {
        setStatus('That sample photo did not load. Try again.');
      }
    });
  }
  for (const preset of shotList()) {
    const btn = buildButton('presetRow', preset.name, { shot: preset.id }, preset.hint);
    btn.addEventListener('click', async () => {
      await applyShot(state, { shot: preset.id });
      setStatus(`Preset “${preset.name}” applied.`);
      render();
    });
  }
}

// Canvas coordinates from a pointer event, in cover pixels.
function canvasPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (ev.clientX - rect.left) * scaleX, y: (ev.clientY - rect.top) * scaleY };
}

let drag = null;

canvas.addEventListener('pointerdown', (ev) => {
  const pt = canvasPoint(ev);
  const hit = hitPanel(state.size, pt.x, pt.y);
  if (hit < 0) return;
  state.selected = hit;
  const panel = selectedPanel();
  if (panel.kind === 'photo' && panel.photo) {
    drag = { x: pt.x, y: pt.y, dx: panel.dx || 0, dy: panel.dy || 0 };
    canvas.setPointerCapture(ev.pointerId);
  }
  render();
});

canvas.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const pt = canvasPoint(ev);
  const panel = selectedPanel();
  panel.dx = drag.dx + (pt.x - drag.x);
  panel.dy = drag.dy + (pt.y - drag.y);
  // Clamp the pan so the photo always covers its panel.
  const limit = Math.min(canvas.width, canvas.height) * 0.35;
  panel.dx = Math.max(-limit, Math.min(limit, panel.dx));
  panel.dy = Math.max(-limit, Math.min(limit, panel.dy));
  render();
});

canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

if (zoomRange) {
  zoomRange.addEventListener('input', () => {
    const panel = selectedPanel();
    panel.zoom = parseFloat(zoomRange.value);
    render();
  });
}

if (titleInput) titleInput.addEventListener('input', () => { state.title = titleInput.value; render(); });
if (subtitleInput) subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; render(); });
if (taglineInput) taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; render(); });

if (photoInput) {
  photoInput.addEventListener('change', () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const panel = selectedPanel();
        panel.kind = 'photo';
        panel.photo = img;
        panel.sample = null;
        panel.zoom = 1; panel.dx = 0; panel.dy = 0;
        setStatus(`“${file.name}” is in panel ${state.selected + 1}. Drag it to position, zoom to crop.`);
        render();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const clearPhotoBtn = document.getElementById('clearPhotoBtn');
if (clearPhotoBtn) {
  clearPhotoBtn.addEventListener('click', () => {
    const panel = selectedPanel();
    panel.kind = 'scene';
    panel.photo = null;
    panel.sample = null;
    panel.zoom = 1; panel.dx = 0; panel.dy = 0;
    setStatus(`Panel ${state.selected + 1} is back to a drawn scene.`);
    render();
  });
}

const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) { setStatus('Export failed — try again.'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solmar-bay-cover-${state.size}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(`Exported solmar-bay-cover-${state.size}.png (${Math.round(blob.size / 1024)} KB).`);
    }, 'image/png');
  });
}

// Test hooks: the functional test drives the app through these.
window.coverApp = { state, render, canvas };
window.coverReady = ready;

buildControls();
render();

const shot = shotFromUrl();
if (shot.shot || shot.photo || shot.caption || shot.size || shot.grade) {
  applyShot(state, shot)
    .then(() => { render(); setStatus(`Showing the “${shot.shot || 'custom'}” preset.`); readyResolve(); })
    .catch(() => { render(); readyResolve(); });
} else {
  readyResolve();
}
