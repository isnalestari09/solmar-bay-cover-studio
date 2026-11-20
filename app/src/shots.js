// shots.js — the four screenshots this entry hands in, as data.
//
// Each shot names the file, the pixel size, and the exact cover preset that
// produced it, so the screenshot run and the dossier agree. `shotURL` turns a
// shot into the app URL that renders it (the app reads the same query params
// a person could share as a preset link).

export const SHOTS = [
  {
    file: '1-cover.jpg',
    label: 'Landscape cover',
    width: 1280, height: 720,
    view: 'cover', size: 'landscape',
    scenes: ['sunset', 'chase', 'neon'], grade: 'sunset',
    title: 'SOLMAR BAY', subtitle: 'A Dani Reyes Story',
    tagline: 'Every sunset has a price.',
  },
  {
    file: '2-editor.jpg',
    label: 'Editor with a photo loaded',
    width: 1280, height: 720,
    view: 'editor', size: 'landscape',
    scenes: ['sunset', 'lighthouse', 'neon'], grade: 'neon',
    title: 'SOLMAR BAY', subtitle: 'A Dani Reyes Story',
    tagline: 'Every sunset has a price.',
    photo: 'sample', photoPanel: 1,
  },
  {
    file: '3-cover.jpg',
    label: 'Portrait cover',
    width: 1024, height: 1280,
    view: 'cover', size: 'portrait',
    scenes: ['lighthouse', 'neon', 'chase'], grade: 'vice',
    title: 'SOLMAR BAY', subtitle: 'One Last Chase',
    tagline: 'The bay never forgets.',
  },
  {
    file: '4-cover.jpg',
    label: 'Square cover',
    width: 1080, height: 1080,
    view: 'cover', size: 'square',
    scenes: ['chase', 'sunset', 'lighthouse'], grade: 'neon',
    title: 'SOLMAR BAY', subtitle: 'Vice Gold',
    tagline: 'Run the night.',
  },
];

export function shotURL(shot, base = '') {
  const q = new URLSearchParams();
  q.set('view', shot.view);
  q.set('size', shot.size);
  q.set('grade', shot.grade);
  q.set('title', shot.title);
  q.set('subtitle', shot.subtitle);
  q.set('tagline', shot.tagline);
  q.set('scenes', shot.scenes.join(','));
  if (shot.photo) q.set('photo', shot.photo);
  if (shot.photoPanel !== undefined) q.set('photoPanel', String(shot.photoPanel));
  return `${base}/?${q.toString()}`;
}

export function applyShotToState(shot, state) {
  state.size = shot.size;
  state.grade = shot.grade;
  state.title = shot.title;
  state.subtitle = shot.subtitle;
  state.tagline = shot.tagline;
  shot.scenes.forEach((scene, i) => {
    if (state.panels[i]) {
      state.panels[i].kind = 'scene';
      state.panels[i].scene = scene;
      state.panels[i].photo = null;
    }
  });
  return state;
}
