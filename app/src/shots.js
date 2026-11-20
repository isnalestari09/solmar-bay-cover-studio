// URL presets for Solmar Bay Cover Studio, used by deep links and by
// the screenshot runs. Examples:
//   ?size=portrait&grade=gold&scene1=lighthouse&scene2=neon&scene3=boat
//   ?photo2=sample        — load the generated sample photo into panel 2
//   ?shot=cover           — hide the editor chrome, show only the cover
//   ?title=VICE%20GOLD&subtitle=ONE%20LAST%20CHASE
import { SIZES, GRADES } from './cover.js';
import { SCENE_LIST } from './scenes.js';

export function applyShotParams(state, hooks) {
  const q = new URLSearchParams(location.search);
  const loads = [];
  const size = q.get('size');
  if (size && SIZES[size]) state.size = size;
  const grade = q.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const title = q.get('title');
  if (title) state.title = title.slice(0, 24).toUpperCase();
  const subtitle = q.get('subtitle');
  if (subtitle) state.subtitle = subtitle.slice(0, 40).toUpperCase();
  const tagline = q.get('tagline');
  if (tagline) state.tagline = tagline.slice(0, 60);
  const keys = new Set(SCENE_LIST.map((s) => s.key));
  for (let i = 0; i < 3; i++) {
    const scene = q.get(`scene${i + 1}`);
    if (scene && keys.has(scene)) {
      state.panels[i].scene = scene;
      state.panels[i].mode = 'scene';
    }
    if (q.get(`photo${i + 1}`) === 'sample') {
      loads.push(hooks.loadSamplePhoto(i));
    }
    const zoom = Number(q.get(`zoom${i + 1}`));
    if (Number.isFinite(zoom) && zoom >= 0.5 && zoom <= 3) {
      state.panels[i].zoom = zoom;
    }
  }
  if (q.get('shot') === 'cover') {
    document.body.classList.add('shot-cover');
  }
  return Promise.all(loads);
}
