// shots.js — deterministic presets for screenshots and shared links.
// ?shot=cover     landscape cover, three drawn scenes
// ?shot=editor    editor view with a sample photo loaded in panel 2
// ?shot=portrait  portrait cover, 1080 x 1350
// ?shot=square    square cover, 1080 x 1080
// Extra params: &photo=pier|boulevard (panel 2 photo), &caption=... (title),
// &grade=sunset|neon|gold, &size=landscape|square|portrait.

import { SCENES } from './scenes.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

const SAMPLES = {
  pier: './samples/pier.jpg',
  boulevard: './samples/boulevard.jpg',
};

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot') || '';
  const out = { shot };
  if (params.get('size')) out.size = params.get('size');
  if (params.get('grade')) out.grade = params.get('grade');
  if (params.get('caption')) out.title = params.get('caption');
  if (params.get('subtitle')) out.subtitle = params.get('subtitle');
  if (params.get('tagline')) out.tagline = params.get('tagline');
  if (params.get('photo')) out.photo = params.get('photo');
  return out;
}

// Apply a shot preset to a state object. Returns a promise that resolves
// once any sample photo the preset needs has loaded.
export async function applyShot(state, shot) {
  const name = shot.shot || 'cover';
  if (name === 'portrait') {
    state.size = 'portrait';
    state.panels[0].kind = 'scene'; state.panels[0].scene = 'neon';
    state.panels[1].kind = 'scene'; state.panels[1].scene = 'sunset';
    // Lighthouse for the bottom band: its tower spans the full panel
    // height, so it stays visible above the title band.
    state.panels[2].kind = 'scene'; state.panels[2].scene = 'lighthouse';
    state.grade = 'neon';
  } else if (name === 'square') {
    state.size = 'square';
    state.panels[0].kind = 'scene'; state.panels[0].scene = 'lighthouse';
    state.panels[1].kind = 'scene'; state.panels[1].scene = 'sunset';
    state.panels[2].kind = 'scene'; state.panels[2].scene = 'neon';
    state.grade = 'gold';
  } else if (name === 'editor') {
    state.size = 'landscape';
    state.panels[0].kind = 'scene'; state.panels[0].scene = 'sunset';
    state.panels[1].kind = 'photo'; state.panels[1].scene = 'boat';
    state.panels[2].kind = 'scene'; state.panels[2].scene = 'lighthouse';
    state.grade = 'sunset';
    state.selected = 1;
  } else {
    state.size = 'landscape';
    state.panels[0].kind = 'scene'; state.panels[0].scene = 'sunset';
    state.panels[1].kind = 'scene'; state.panels[1].scene = 'boat';
    state.panels[2].kind = 'scene'; state.panels[2].scene = 'lighthouse';
    state.grade = 'sunset';
  }
  if (shot.size) state.size = shot.size;
  if (shot.grade) state.grade = shot.grade;
  if (shot.title) state.title = shot.title;
  if (shot.subtitle) state.subtitle = shot.subtitle;
  if (shot.tagline) state.tagline = shot.tagline;
  const photoName = shot.photo || (name === 'editor' ? 'pier' : null);
  if (photoName && SAMPLES[photoName]) {
    const img = await loadImage(SAMPLES[photoName]);
    state.panels[1].kind = 'photo';
    state.panels[1].photo = img;
    state.panels[1].zoom = 1;
    state.panels[1].dx = 0;
    state.panels[1].dy = 0;
  }
  return state;
}

export function sceneOptions() {
  return SCENES.map((s) => ({ id: s.id, name: s.name, hint: s.hint }));
}

// The four named presets, for the editor's one-click demo row.
export function shotList() {
  return [
    { id: 'cover', name: 'Sunset Cover', hint: 'Landscape, three scenes' },
    { id: 'editor', name: 'Photo Editor', hint: 'Pier photo in panel 2' },
    { id: 'portrait', name: 'Portrait', hint: '1080 × 1350, neon grade' },
    { id: 'square', name: 'Square', hint: '1080 × 1080, gold grade' },
  ];
}

export function sampleNames() {
  return Object.keys(SAMPLES);
}

export function sampleSrc(name) {
  return SAMPLES[name] || null;
}

export { loadImage };
