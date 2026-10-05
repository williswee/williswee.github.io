import type { KAPLAYCtx } from 'kaplay';

type ArtComp = { id: string; draw: () => void };
export const palette = {
  field: '#131521', ink: '#121422', line: '#363248', cream: '#fff9ec',
  muted: '#b5aec7', mint: '#d9ff65', mintShade: '#86b943', gold: '#ffd56a',
  coral: '#ff746e', violet: '#b69aec', cyan: '#73e4d8',
  feather: '#e9dcc0', orange: '#ffa844', comb: '#ff615b',
} as const;

export type ChickenPose = { time: number; moving: number; dash: boolean; frenzy: boolean };

export function chickenArt(k: KAPLAYCtx, read: () => ChickenPose = () => ({ time: k.time(), moving: 1, dash: false, frenzy: false })): ArtComp {
  const c = (value: string) => k.Color.fromHex(value);
  return {
    id: 'chicken-art',
    draw() {
      const pose = read();
      const stride = Math.sin(pose.time * (pose.dash ? 30 : 18)) * (pose.moving === 0 ? 1 : 6);
      const flap = Math.sin(pose.time * (pose.dash ? 30 : 14)) * (pose.moving === 0 ? 3 : 8);
      const featherColor = pose.frenzy ? palette.gold : palette.cream;
      const outline = { width: 2.3, color: c(palette.ink) };
      k.drawEllipse({ pos: k.vec2(2, 36), radiusX: 25, radiusY: 5, anchor: 'center', color: c('#080b17'), opacity: 0.55 });
      if (pose.dash || pose.frenzy) {
        const glow = c(pose.frenzy ? palette.gold : palette.cyan);
        k.drawCircle({ pos: k.vec2(0, -2), radius: 39, anchor: 'center', color: glow, opacity: 0.12 });
        k.drawCircle({ pos: k.vec2(0, -2), radius: 35, anchor: 'center', fill: false, outline: { width: 2, color: glow }, opacity: 0.65 });
        if (pose.dash) {
          for (const y of [-15, -3, 10]) {
            k.drawLine({ p1: k.vec2(-40, y), p2: k.vec2(-29, y), width: 2.5, color: glow, opacity: 0.85 });
          }
        }
      }

      // A ragged fan of feathers, tiny legs, and absurdly large running feet.
      for (const [x, y] of [[-34, -13], [-38, -1], [-33, 11]] as const) {
        k.drawPolygon({ pts: [k.vec2(-15, 12), k.vec2(x, y + flap * 0.15), k.vec2(x + 9, y + 13), k.vec2(-12, 18)], color: c(featherColor), outline });
      }
      for (const [x, step] of [[-9, stride], [11, -stride]] as const) {
        const footX = x + step * 0.65;
        const footY = 31 - Math.max(0, step) * 0.7;
        k.drawLines({ pts: [k.vec2(x, 18), k.vec2(x - step * 0.3, 26), k.vec2(footX, footY)], width: 4, color: c(palette.orange), join: 'round', cap: 'round' });
        k.drawRect({ pos: k.vec2(footX + 4, footY), width: 19, height: 8, radius: 4, anchor: 'center', angle: -step * 2, color: c(palette.orange), outline: { width: 1.8, color: c(palette.ink) } });
        k.drawLine({ p1: k.vec2(footX + 7, footY - 2), p2: k.vec2(footX + 8, footY + 2), width: 1, color: c('#bd6c32') });
      }

      // The far wing peeks around a plump, pear-shaped silhouette.
      k.drawPolygon({ pts: [k.vec2(15, -2), k.vec2(33, -9 - flap), k.vec2(30, 5 - flap * 0.6), k.vec2(18, 15)], color: c(pose.frenzy ? '#e9b444' : palette.feather), outline });
      const points = Array.from({ length: 44 }, (_, i) => {
        const a = i / 44 * Math.PI * 2;
        return k.vec2(Math.cos(a) * (23 + Math.sin(a) * 3), Math.sin(a) * 25 + 1);
      });
      k.drawPolygon({ pts: points, color: c(featherColor), outline: { width: 2.5, color: c(palette.ink) } });
      k.drawEllipse({ pos: k.vec2(-9, 6), radiusX: 13, radiusY: 14, anchor: 'center', angle: -20, color: c(pose.frenzy ? '#ffe99a' : palette.feather) });

      // The comb is a little lopsided; the face is very lopsided.
      for (const [x, y, radiusX, radiusY, angle] of [[-8, -28, 5, 7, -25], [0, -32, 5, 7, 0], [8, -28, 5, 7, 25]] as const) {
        k.drawEllipse({ pos: k.vec2(x, y), radiusX, radiusY, angle, anchor: 'center', color: c(palette.comb), outline: { width: 1.8, color: c(palette.ink) } });
      }
      k.drawEllipse({ pos: k.vec2(20, 9), radiusX: 5, radiusY: 8, anchor: 'center', angle: -15, color: c(palette.comb), outline: { width: 1.8, color: c(palette.ink) } });
      k.drawPolygon({ pts: [k.vec2(18, -2), k.vec2(36, 2), k.vec2(23, 10), k.vec2(17, 5)], color: c(palette.orange), outline });
      k.drawLine({ p1: k.vec2(23, 4), p2: k.vec2(31, 3), width: 1.5, color: c('#a25c2e') });
      k.drawCircle({ pos: k.vec2(24, 0), radius: 1.3, anchor: 'center', color: c(palette.ink) });
      for (const [x, y, radius, pupilX, pupilY] of [[2, -15, 7, 2, 1], [16, -10, 10, 3, -1]] as const) {
        k.drawCircle({ pos: k.vec2(x, y), radius, anchor: 'center', color: c('#ffffff'), outline: { width: 1.8, color: c(palette.ink) } });
        const wobble = Math.sin(pose.time * 9 + x) * (pose.moving === 0 ? 0.15 : 0.65);
        k.drawCircle({ pos: k.vec2(x + pupilX + wobble, y + pupilY), radius: radius * 0.38, anchor: 'center', color: c(palette.ink) });
        k.drawCircle({ pos: k.vec2(x + pupilX - 1 + wobble, y + pupilY - 1), radius: 1, anchor: 'center', color: c('#ffffff') });
      }

      // The near wing flaps frantically, with three feather tips.
      k.drawPolygon({ pts: [k.vec2(-12, 1), k.vec2(-34, 8 - flap), k.vec2(-25, 12 - flap * 0.6), k.vec2(-26, 16 - flap * 0.3), k.vec2(-15, 16), k.vec2(-6, 9)], color: c(featherColor), outline });
      k.drawLines({ pts: [k.vec2(-26, 10 - flap * 0.5), k.vec2(-18, 11), k.vec2(-13, 7)], width: 1.3, color: c(pose.frenzy ? '#c2943d' : '#baab91'), join: 'round', cap: 'round' });
    },
  };
}

export function coinArt(k: KAPLAYCtx): ArtComp {
  const c = (value: string) => k.Color.fromHex(value);
  return { id: 'coin-art', draw() {
    k.drawCircle({ radius: 21, anchor: 'center', color: c(palette.gold), opacity: 0.12 });
    k.drawCircle({ radius: 13, anchor: 'center', color: c(palette.gold), outline: { width: 2, color: c('#704428') } });
    k.drawCircle({ radius: 9, anchor: 'center', fill: false, outline: { width: 1.5, color: c('#bd8a37') } });
    k.drawPolygon({ pts: [k.vec2(0, -6), k.vec2(4, 0), k.vec2(0, 6), k.vec2(-4, 0)], color: c('#fff4c0') });
    k.drawLine({ p1: k.vec2(-7, -8), p2: k.vec2(-2, -11), width: 2, color: c(palette.cream) });
  } };
}

export function hazardArt(k: KAPLAYCtx, width = 54, gate = false): ArtComp {
  const c = (value: string) => k.Color.fromHex(value);
  return { id: 'hazard-art', draw() {
    if (gate) {
      k.drawRect({ pos: k.vec2(0, 0), width, height: 26, anchor: 'center', radius: 5, color: c('#672b42'), outline: { width: 2, color: c(palette.coral) } });
      for (let x = -width / 2 + 8; x < width / 2 - 4; x += 22) {
        k.drawLine({ p1: k.vec2(x, -7), p2: k.vec2(x + 8, 7), width: 4, color: c(palette.coral) });
      }
      k.drawCircle({ pos: k.vec2(-width / 2 + 4, 0), radius: 4, anchor: 'center', color: c(palette.cream) });
      k.drawCircle({ pos: k.vec2(width / 2 - 4, 0), radius: 4, anchor: 'center', color: c(palette.cream) });
      return;
    }
    k.drawEllipse({ pos: k.vec2(0, 23), radiusX: 25, radiusY: 5, anchor: 'center', color: c('#090a15'), opacity: 0.5 });
    for (const x of [-25, 25]) {
      k.drawEllipse({ pos: k.vec2(x, -7), radiusX: 13, radiusY: 4, anchor: 'center', color: c('#e17593') });
      k.drawLine({ p1: k.vec2(x - 10, -7), p2: k.vec2(x + 10, -7), width: 2, color: c(palette.cream) });
      k.drawLine({ p1: k.vec2(x, -6), p2: k.vec2(x * 0.6, 4), width: 4, color: c('#8d405b') });
    }
    k.drawRect({ width: 37, height: 24, radius: 8, anchor: 'center', color: c(palette.coral), outline: { width: 2.5, color: c(palette.ink) } });
    k.drawRect({ pos: k.vec2(0, 0), width: 25, height: 9, radius: 3, anchor: 'center', color: c(palette.ink) });
    for (const x of [-7, 7]) k.drawLine({ p1: k.vec2(x - 2, -2), p2: k.vec2(x + 2, 2), width: 2, color: c(palette.cream) });
    k.drawLine({ p1: k.vec2(-8, 14), p2: k.vec2(8, 14), width: 3, color: c('#b54e69') });
  } };
}

export function magnetArt(k: KAPLAYCtx): ArtComp {
  const c = (value: string) => k.Color.fromHex(value);
  return { id: 'magnet-art', draw() {
    k.drawCircle({ radius: 26, anchor: 'center', color: c(palette.cyan), opacity: 0.12 });
    k.drawCircle({ radius: 19, anchor: 'center', color: c('#173943'), outline: { width: 1.5, color: c(palette.cyan) } });
    k.drawLines({ pts: [k.vec2(-7, -7), k.vec2(-7, 5), k.vec2(-3, 9), k.vec2(3, 9), k.vec2(7, 5), k.vec2(7, -7)], width: 6, color: c(palette.cyan), join: 'round' });
    for (const x of [-7, 7]) k.drawRect({ pos: k.vec2(x, -6), width: 6, height: 5, anchor: 'center', color: c(palette.cream) });
  } };
}
