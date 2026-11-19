// Fixed scenes for screenshots: ?shot=cover renders just the cover,
// ?shot=editor shows the full editor with a photo loaded. Deterministic,
// so a screenshot is the app's own drawing of its own cover.
export function runShot(shot, params, state, applyPhoto) {
  const size = params.get('size');
  if (size && ['square', 'portrait', 'wide'].includes(size)) state.size = size;
  const grade = params.get('grade');
  if (grade && ['sunset', 'neon', 'gold'].includes(grade)) state.grade = grade;
  const caption = params.get('caption');
  if (caption) state.title = caption;
  const tagline = params.get('tagline');
  if (tagline) state.tagline = tagline;

  if (shot === 'cover') {
    // A hero cover: Dani at sunset, boat chase, lighthouse — title from caption.
    state.panels[0] = { kind: 'scene', scene: 'driver', photo: null, px: 0.5, py: 0.5, scale: 1 };
    state.panels[1] = { kind: 'scene', scene: 'boat', photo: null, px: 0.5, py: 0.5, scale: 1 };
    state.panels[2] = { kind: 'scene', scene: 'lighthouse', photo: null, px: 0.5, py: 0.5, scale: 1 };
    const photo = params.get('photo');
    if (photo) {
      // photo goes in panel 2, drawn by the app itself
      applyPhoto(`samples/${photo}.jpg`, caption);
      return;
    }
    // redraw happens in main.js after runShot returns
    return;
  }
  if (shot === 'editor') {
    // Editor with a photo loaded in panel 2, neon grade for contrast.
    state.grade = grade || 'neon';
    state.panels[2] = { kind: 'scene', scene: 'neon', photo: null, px: 0.5, py: 0.5, scale: 1 };
    const photo = params.get('photo') || 'pier';
    applyPhoto(`samples/${photo}.jpg`, caption);
  }
}
