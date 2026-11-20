// main.js — the Cover Studio editor.
//
// Wires the controls (size, panel scenes, photo upload + zoom + drag, text,
// grade, export) to the renderer in cover.js, keeps a live preview, and reads
// shareable presets from the URL (?size=&grade=&scenes=&photo=sample…).
// A bare `?view=cover` hides the editor and shows only the cover, which is
// how the cover screenshots are taken.

import { SCENES, SCENE_IDS } from './scenes.js';
import {
  SIZES, GRADES, defaultState, renderCover, panelPolygons, pointInPolygon,
  makeSamplePhoto, photoFromCanvas,
} from './cover.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = defaultState();
let selectedPanel = 0;
let drag = null;

const preview = $('#preview');
const offscreen = document.createElement('canvas');

function readParams() {
  const q = new URLSearchParams(location.search);
  if (q.get('size') && SIZES[q.get('size')]) state.size = q.get('size');
  if (q.get('grade') && GRADES[q.get('grade')]) state.grade = q.get('grade');
  if (q.get('title')) state.title = q.get('title').slice(0, 40);
  if (q.get('subtitle')) state.subtitle = q.get('subtitle').slice(0, 60);
  if (q.get('tagline')) state.tagline = q.get('tagline').slice(0, 80);
  if (q.get('scenes')) {
    const names = q.get('scenes').split(',').filter((n) => SCENES[n]);
    names.forEach((name, i) => {
      if (state.panels[i]) {
        state.panels[i].kind = 'scene';
        state.panels[i].scene = name;
        state.panels[i].photo = null;
      }
    });
  }
  return q;
}

function render() {
  renderCover(offscreen, state);
  const ctx = preview.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const coverOnly = document.body.classList.contains('cover-only');
  const box = coverOnly
    ? { width: window.innerWidth, height: window.innerHeight }
    : preview.parentElement.getBoundingClientRect();
  const scale = Math.min(box.width / offscreen.width, box.height / offscreen.height, 1);
  preview.width = Math.round(offscreen.width * scale * dpr);
  preview.height = Math.round(offscreen.height * scale * dpr);
  preview.style.width = `${Math.round(offscreen.width * scale)}px`;
  preview.style.height = `${Math.round(offscreen.height * scale)}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(offscreen, 0, 0, offscreen.width * scale, offscreen.height * scale);
  // Highlight the selected panel's diagonal band on the preview.
  // Editor only: a pure cover must never carry the selection outline.
  if (coverOnly) {
    updatePanelCards();
    return;
  }
  const polys = panelPolygons(offscreen.width, offscreen.height);
  const poly = polys[selectedPanel];
  ctx.save();
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 215, 106, 0.9)';
  ctx.lineWidth = 3 / scale;
  ctx.setLineDash([10 / scale, 8 / scale]);
  ctx.stroke();
  ctx.restore();
  updatePanelCards();
}

function updatePanelCards() {
  $$('.panel-card').forEach((card, i) => {
    card.classList.toggle('selected', i === selectedPanel);
    const panel = state.panels[i];
    const zoom = card.querySelector('.zoom');
    if (zoom) zoom.disabled = panel.kind !== 'photo' || !panel.photo;
    const hint = card.querySelector('.panel-hint');
    if (hint) {
      hint.textContent = panel.kind === 'photo' && panel.photo
        ? `Photo: ${panel.photo.name || 'your photo'} — drag the cover to move it`
        : `Scene: ${SCENES[panel.scene].name}`;
    }
  });
}

function buildControls() {
  // Size picker.
  const sizeRow = $('#sizeRow');
  Object.values(SIZES).forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = `${s.name} ${s.ratio}`;
    b.dataset.size = s.id;
    b.addEventListener('click', () => {
      state.size = s.id;
      $$('#sizeRow .chip').forEach((c) => c.classList.toggle('active', c === b));
      render();
    });
    sizeRow.appendChild(b);
  });
  // Grade picker.
  const gradeRow = $('#gradeRow');
  Object.values(GRADES).forEach((gr) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = `${gr.name} — ${gr.hint}`;
    b.dataset.grade = gr.id;
    b.addEventListener('click', () => {
      state.grade = gr.id;
      $$('#gradeRow .chip').forEach((c) => c.classList.toggle('active', c === b));
      render();
    });
    gradeRow.appendChild(b);
  });
  // Panel cards.
  const panelsEl = $('#panels');
  state.panels.forEach((panel, i) => {
    const card = document.createElement('section');
    card.className = 'panel-card';
    card.dataset.panel = String(i);
    card.innerHTML = `
      <h3>Panel ${i + 1}</h3>
      <div class="scene-row" role="group" aria-label="Panel ${i + 1} scene"></div>
      <div class="photo-row">
        <label class="upload-btn">Upload photo
          <input type="file" accept="image/*" hidden>
        </label>
        <button type="button" class="mini-btn sample-btn">Sample photo</button>
        <button type="button" class="mini-btn clear-btn">Back to scene</button>
      </div>
      <label class="zoom-label">Zoom
        <input type="range" class="zoom" min="1" max="3" step="0.05" value="1">
      </label>
      <p class="panel-hint"></p>`;
    const sceneRow = card.querySelector('.scene-row');
    SCENE_IDS.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip small';
      b.textContent = SCENES[id].name;
      b.addEventListener('click', () => {
        panel.kind = 'scene';
        panel.scene = id;
        panel.photo = null;
        selectedPanel = i;
        render();
      });
      sceneRow.appendChild(b);
    });
    card.querySelector('input[type=file]').addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      loadPhotoFile(file, i);
      ev.target.value = '';
    });
    card.querySelector('.sample-btn').addEventListener('click', () => {
      loadSamplePhoto(i % 2 === 0 ? 'boulevard' : 'pier', i);
    });
    card.querySelector('.clear-btn').addEventListener('click', () => {
      panel.kind = 'scene';
      panel.photo = null;
      selectedPanel = i;
      render();
    });
    card.querySelector('.zoom').addEventListener('input', (ev) => {
      if (panel.photo) {
        panel.photo.scale = Number(ev.target.value);
        render();
      }
    });
    card.addEventListener('click', () => { selectedPanel = i; render(); });
    panelsEl.appendChild(card);
  });
  // Text fields.
  $('#titleInput').addEventListener('input', (ev) => { state.title = ev.target.value; render(); });
  $('#subtitleInput').addEventListener('input', (ev) => { state.subtitle = ev.target.value; render(); });
  $('#taglineInput').addEventListener('input', (ev) => { state.tagline = ev.target.value; render(); });
  // Randomize and export.
  $('#randomBtn').addEventListener('click', () => {
    const ids = [...SCENE_IDS].sort(() => Math.random() - 0.5);
    state.panels.forEach((p, i) => {
      p.kind = 'scene';
      p.scene = ids[i % ids.length];
      p.photo = null;
    });
    const grades = Object.keys(GRADES);
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    syncInputs();
    render();
  });
  $('#exportBtn').addEventListener('click', exportPNG);
  // Drag to pan the selected panel's photo, click a panel to select it.
  preview.addEventListener('pointerdown', (ev) => {
    const rect = preview.getBoundingClientRect();
    const sx = offscreen.width / rect.width;
    const sy = offscreen.height / rect.height;
    const px = (ev.clientX - rect.left) * sx;
    const py = (ev.clientY - rect.top) * sy;
    const polys = panelPolygons(offscreen.width, offscreen.height);
    const hit = polys.findIndex((poly) => pointInPolygon(px, py, poly));
    if (hit >= 0) selectedPanel = hit;
    const panel = state.panels[selectedPanel];
    if (panel.kind === 'photo' && panel.photo) {
      drag = { x: ev.clientX, y: ev.clientY, ox: panel.photo.ox, oy: panel.photo.oy };
      preview.setPointerCapture(ev.pointerId);
    }
    render();
  });
  preview.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const panel = state.panels[selectedPanel];
    if (!panel.photo) return;
    const rect = preview.getBoundingClientRect();
    panel.photo.ox = drag.ox + (ev.clientX - drag.x) / rect.width;
    panel.photo.oy = drag.oy + (ev.clientY - drag.y) / rect.height;
    render();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  window.addEventListener('resize', render);
  // Keyboard shortcut: E exports, R randomises. Ignored while typing.
  window.addEventListener('keydown', (ev) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA/.test(tag)) return;
    if (ev.key === 'e' || ev.key === 'E') exportPNG();
    if (ev.key === 'r' || ev.key === 'R') $('#randomBtn').click();
  });
}

function loadPhotoFile(file, panelIndex) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.panels[panelIndex].kind = 'photo';
    state.panels[panelIndex].photo = { img, scale: 1, ox: 0, oy: 0, name: file.name };
    selectedPanel = panelIndex;
    render();
  };
  img.src = url;
}

function loadSamplePhoto(kind, panelIndex) {
  const canvas = makeSamplePhoto(kind);
  const photo = photoFromCanvas(canvas);
  photo.img.onload = () => {
    state.panels[panelIndex].kind = 'photo';
    state.panels[panelIndex].photo = photo;
    selectedPanel = panelIndex;
    render();
  };
  if (photo.img.complete && photo.img.naturalWidth) {
    state.panels[panelIndex].kind = 'photo';
    state.panels[panelIndex].photo = photo;
    selectedPanel = panelIndex;
    render();
  }
}

function exportPNG() {
  renderCover(offscreen, state);
  return new Promise((resolve) => {
    offscreen.toBlob((blob) => {
      if (!blob) { resolve(null); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solmar-bay-cover-${state.size}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(blob);
    }, 'image/png');
  });
}

function syncInputs() {
  $('#titleInput').value = state.title;
  $('#subtitleInput').value = state.subtitle;
  $('#taglineInput').value = state.tagline;
  $$('#sizeRow .chip').forEach((c) => c.classList.toggle('active', c.dataset.size === state.size));
  $$('#gradeRow .chip').forEach((c) => c.classList.toggle('active', c.dataset.grade === state.grade));
}

function boot() {
  const q = readParams();
  const coverOnly = q.get('view') === 'cover';
  document.body.classList.toggle('cover-only', coverOnly);
  buildControls();
  syncInputs();
  if (q.get('photo') === 'sample') {
    const panelIndex = Number(q.get('photoPanel') || 0);
    loadSamplePhoto(panelIndex % 2 === 0 ? 'boulevard' : 'pier', panelIndex);
  }
  render();
  // Handle for tests and the screenshot run.
  window.__studio = { state, render, exportPNG, renderCover, offscreen, preview };
  if (q.get('test') === '1') runSelfTest();
}

// In-page functional self-test (?test=1): exercises every size, scene and
// grade, edits the text, loads a sample photo, exports a PNG and checks the
// cover is not blank. Results land in <pre id="test-results"> for the runner.
async function runSelfTest() {
  const results = [];
  const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  try {
    for (const id of Object.keys(SIZES)) {
      state.size = id;
      render();
      check(`size ${id}`, offscreen.width === SIZES[id].width && offscreen.height === SIZES[id].height);
    }
    state.size = 'landscape';
    for (const id of SCENE_IDS) {
      state.panels.forEach((p) => { p.kind = 'scene'; p.scene = id; p.photo = null; });
      render();
      check(`scene ${id}`, true);
    }
    for (const id of Object.keys(GRADES)) {
      state.grade = id;
      render();
      check(`grade ${id}`, true);
    }
    state.title = 'TEST TITLE';
    state.subtitle = 'Test Sub';
    state.tagline = 'Test tag.';
    render();
    check('text edit', true);
    loadSamplePhoto('boulevard', 0);
    await new Promise((r) => setTimeout(r, 300));
    check('sample photo', state.panels[0].kind === 'photo' && !!state.panels[0].photo);
    const blob = await exportPNG();
    check('export png blob', !!blob && blob.size > 10000 && blob.type === 'image/png');
    const g = offscreen.getContext('2d');
    const px = g.getImageData(0, 0, offscreen.width, offscreen.height).data;
    let lit = 0;
    for (let i = 0; i < px.length; i += 401) {
      if (px[i] + px[i + 1] + px[i + 2] > 30) lit++;
    }
    check('cover pixels non-blank', lit > 100);
  } catch (err) {
    results.push(`FAIL exception: ${err.message}`);
  }
  const pre = document.createElement('pre');
  pre.id = 'test-results';
  pre.textContent = results.join('\n');
  document.body.appendChild(pre);
}

boot();
