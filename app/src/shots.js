// Deterministic shot presets: the states ?shot=cover and ?shot=editor put the app
// in, so the screenshots are reproducible. A cover shot draws the finished cover
// full-frame; an editor shot opens the editor with the pier sample photo already
// loaded in the hero panel.

import { defaultState } from './cover.js';

/** State for a cover shot in the given size, with the classic three scenes. */
export function coverShotState(size) {
  const state = defaultState();
  state.size = size;
  state.grade = 'sunset';
  state.panels = [
    { type: 'scene', scene: 'dani', zoom: 1, ox: 0, oy: 0 },
    { type: 'scene', scene: 'boat', zoom: 1, ox: 0, oy: 0 },
    { type: 'scene', scene: 'lighthouse', zoom: 1, ox: 0, oy: 0 },
  ];
  return state;
}

/** State for the editor shot: pier photo in the hero, Neon Nights grade. */
export function editorShotState() {
  const state = defaultState();
  state.size = 'wide';
  state.grade = 'neon';
  state.panels = [
    { type: 'photo', key: 'sample:pier', zoom: 1.15, ox: 0, oy: -0.04 },
    { type: 'scene', scene: 'neon', zoom: 1, ox: 0, oy: 0 },
    { type: 'scene', scene: 'boat', zoom: 1, ox: 0, oy: 0 },
  ];
  return state;
}

/** The four screenshots this entry ships, in file order. */
export const SHOT_LIST = [
  { file: '1-cover.jpg', shot: 'cover', size: 'wide', w: 1280, h: 720, note: 'Wide cover, 1920 x 1080 export' },
  { file: '2-editor.jpg', shot: 'editor', size: 'wide', w: 1280, h: 720, note: 'Editor with the pier sample photo loaded' },
  { file: '3-cover.jpg', shot: 'cover', size: 'portrait', w: 1024, h: 1280, note: 'Portrait cover, 1080 x 1350 export' },
  { file: '4-cover.jpg', shot: 'cover', size: 'square', w: 1080, h: 1080, note: 'Square cover, 1080 x 1080 export' },
];

/** The shot entry for a screenshot file name, or null. */
export function shotByFile(file) {
  return SHOT_LIST.find((s) => s.file === file) || null;
}
