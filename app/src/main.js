// Solmar Bay Cover Studio editor: wires the controls to the cover renderer.
// Photos are read on the user's own machine (file input or the kit's samples)
// and never uploaded. The same state drives the live preview and the PNG export.

import { GRADES, SCENES } from './scenes.js';
import { LAYOUTS, SIZES, defaultState, panelAt, renderCover } from './cover.js';
import { coverShotState, editorShotState } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

const state = defaultState();
const images = {};
let selected = 0;
let uploadCount = 0;
let dragStart = null;

/** Load an image from a URL and keep it under a key. */
function loadImage(key, url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** The preview canvas size for the current post size, capped at 960 px wide. */
function previewSize() {
  const size = SIZES[state.size];
  const scale = Math.min(1, 960 / size.w);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

/** Redraw the preview canvas from the current state. */
function renderPreview() {
  const { w, h } = previewSize();
  if (preview.width !== w) preview.width = w;
  if (preview.height !== h) preview.height = h;
  renderCover(pctx, w, h, state, images);
  drawSelection(pctx, w, h);
  window.__coverReady = true;
}

/** A dashed accent outline around the selected panel, preview only. */
function drawSelection(ctx, w, h) {
  const poly = LAYOUTS[state.size].panels[selected];
  if (!poly) return;
  const pal = GRADES[state.grade];
  ctx.save();
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.setLineDash([w * 0.02, w * 0.012]);
  ctx.beginPath();
  ctx.moveTo(poly[0][0] * w, poly[0][1] * h);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0] * w, poly[i][1] * h);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/** Mark a control group of buttons with the active one. */
function markActive(containerId, value) {
  const box = $(containerId);
  if (!box) return;
  for (const btn of box.querySelectorAll('button[data-value]')) {
    btn.classList.toggle('active', btn.dataset.value === value);
  }
}

/** Refresh the panel controls to match the selected panel's fill. */
function refreshPanelControls() {
  const fill = state.panels[selected];
  $('panelName').textContent = `Panel ${selected + 1} · ${['Hero', 'Second', 'Third'][selected]}`;
  markActive('sceneButtons', fill.type === 'scene' ? fill.scene : '');
  const zoom = $('zoom');
  zoom.value = String(Math.round(((fill.zoom || 1) - 1) / 2 * 100));
  $('zoomLabel').textContent = `${Math.round((fill.zoom || 1) * 100)}%`;
  $('photoTools').style.display = fill.type === 'photo' ? 'block' : 'none';
}

/** Select a panel and refresh the controls. */
function selectPanel(i) {
  selected = i;
  refreshPanelControls();
  renderPreview();
}

/** Set the selected panel's fill to a drawn scene. */
function setScene(scene) {
  state.panels[selected] = { type: 'scene', scene, zoom: 1, ox: 0, oy: 0 };
  refreshPanelControls();
  renderPreview();
}

/** Set the selected panel's fill to a photo under a key. */
function setPhoto(key) {
  state.panels[selected] = { type: 'photo', key, zoom: 1, ox: 0, oy: 0 };
  refreshPanelControls();
  renderPreview();
}

/** Build the size buttons. */
function buildSizeButtons() {
  const box = $('sizeButtons');
  for (const [id, size] of Object.entries(SIZES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.value = id;
    btn.textContent = size.label;
    btn.addEventListener('click', () => {
      state.size = id;
      markActive('sizeButtons', id);
      renderPreview();
    });
    box.appendChild(btn);
  }
  markActive('sizeButtons', state.size);
}

/** Build the scene picker buttons. */
function buildSceneButtons() {
  const box = $('sceneButtons');
  for (const [id, scene] of Object.entries(SCENES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.value = id;
    btn.textContent = scene.name;
    btn.addEventListener('click', () => setScene(id));
    box.appendChild(btn);
  }
}

/** Build the colour grade buttons. */
function buildGradeButtons() {
  const box = $('gradeButtons');
  for (const [id, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.value = id;
    btn.textContent = grade.name;
    btn.addEventListener('click', () => {
      state.grade = id;
      markActive('gradeButtons', id);
      renderPreview();
    });
    box.appendChild(btn);
  }
  markActive('gradeButtons', state.grade);
}

/** Export the cover at full post size as a PNG download. */
function exportPng() {
  return new Promise((resolve, reject) => {
    const size = SIZES[state.size];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    const ctx = off.getContext('2d');
    renderCover(ctx, size.w, size.h, state, images);
    off.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG export produced no blob'));
        return;
      }
      window.__lastExportBytes = blob.size;
      window.__exportDone = true;
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solmar-bay-cover-${state.size}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch {
        // The PNG is still rendered; the download itself could not start.
      }
      resolve(blob.size);
    }, 'image/png');
  });
}

/** Wire the preview canvas: click to pick a panel, drag to pan a photo. */
function wirePreview() {
  preview.addEventListener('pointerdown', (e) => {
    const rect = preview.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const hit = panelAt(state.size, fx, fy);
    if (hit >= 0 && hit !== selected) selectPanel(hit);
    const fill = state.panels[selected];
    if (fill.type === 'photo') {
      dragStart = { x: e.clientX, y: e.clientY, ox: fill.ox || 0, oy: fill.oy || 0 };
      try {
        preview.setPointerCapture(e.pointerId);
      } catch {
        // The pointer is already gone; dragging just will not start.
      }
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragStart) return;
    const rect = preview.getBoundingClientRect();
    const fill = state.panels[selected];
    fill.ox = dragStart.ox + (e.clientX - dragStart.x) / rect.width;
    fill.oy = dragStart.oy + (e.clientY - dragStart.y) / rect.height;
    fill.ox = Math.max(-0.6, Math.min(0.6, fill.ox));
    fill.oy = Math.max(-0.6, Math.min(0.6, fill.oy));
    renderPreview();
  });
  preview.addEventListener('pointerup', () => {
    dragStart = null;
  });
  preview.addEventListener('wheel', (e) => {
    const fill = state.panels[selected];
    if (fill.type !== 'photo') return;
    e.preventDefault();
    fill.zoom = Math.max(1, Math.min(3, (fill.zoom || 1) * (e.deltaY < 0 ? 1.12 : 0.89)));
    refreshPanelControls();
    renderPreview();
  }, { passive: false });
}

/** Wire every control in the side panel. */
function wireControls() {
  buildSizeButtons();
  buildSceneButtons();
  buildGradeButtons();
  $('uploadBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const key = `upload:${uploadCount++}`;
      loadImage(key, String(reader.result)).then(() => setPhoto(key));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  $('samplePier').addEventListener('click', () => setPhoto('sample:pier'));
  $('sampleBoulevard').addEventListener('click', () => setPhoto('sample:boulevard'));
  $('backToScene').addEventListener('click', () => setScene('dani'));
  $('zoom').addEventListener('input', (e) => {
    const fill = state.panels[selected];
    if (fill.type !== 'photo') return;
    fill.zoom = 1 + (Number(e.target.value) / 100) * 2;
    $('zoomLabel').textContent = `${Math.round(fill.zoom * 100)}%`;
    renderPreview();
  });
  $('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    renderPreview();
  });
  $('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderPreview();
  });
  $('taglineInput').addEventListener('input', (e) => {
    state.tagline = e.target.value;
    renderPreview();
  });
  $('exportBtn').addEventListener('click', () => {
    exportPng().catch((err) => {
      window.__exportError = String(err);
    });
  });
  wirePreview();
}

/** Full-frame cover shot mode: hide the editor, draw the cover to the window. */
function runCoverShot(size) {
  const shotState = coverShotState(size);
  Object.assign(state, shotState);
  document.body.classList.add('shot-mode');
  preview.width = window.innerWidth;
  preview.height = window.innerHeight;
  renderCover(pctx, preview.width, preview.height, state, images);
  window.__coverReady = true;
}

/** Editor shot mode: the editor, with the pier sample already in the hero. */
async function runEditorShot() {
  const shotState = editorShotState();
  Object.assign(state, shotState);
  await loadImage('sample:pier', 'samples/pier.jpg');
  selectPanel(0);
  markActive('sizeButtons', state.size);
  markActive('gradeButtons', state.grade);
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('taglineInput').value = state.tagline;
  renderPreview();
}

/** Boot: preload the samples, wire the controls, honour ?shot=. */
async function boot() {
  window.__coverReady = false;
  wireControls();
  refreshPanelControls();
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const size = params.get('size') || 'wide';
  try {
    await Promise.all([
      loadImage('sample:pier', 'samples/pier.jpg'),
      loadImage('sample:boulevard', 'samples/boulevard.jpg'),
    ]);
  } catch (err) {
    window.__sampleError = String(err);
  }
  if (shot === 'cover') {
    runCoverShot(SIZES[size] ? size : 'wide');
  } else if (shot === 'editor') {
    await runEditorShot();
  } else {
    renderPreview();
  }
}

window.__app = { state, images, renderPreview, exportPng, selectPanel, setScene, setPhoto };
boot();
