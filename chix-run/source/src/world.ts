import type { KAPLAYCtx } from 'kaplay';

type WorldState = { elapsed: number; speed: number; frenzy: boolean };
type Building = {
  x: number;
  width: number;
  top: number;
  antenna: boolean;
  windows: { x: number; y: number; warm: boolean }[];
};

/** Local, deterministic scenery: no assets, no frame-by-frame random sampling. */
export function makeWorld(
  k: KAPLAYCtx,
  read: () => WorldState,
  reducedMotion: boolean,
): void {
  const c = {
    sky: k.Color.fromHex('#17152b'),
    skyTop: k.Color.fromHex('#101123'),
    skyBottom: k.Color.fromHex('#332346'),
    distant: k.Color.fromHex('#251d3e'),
    skyline: k.Color.fromHex('#35264b'),
    rooftop: k.Color.fromHex('#1b1b2b'),
    ground: k.Color.fromHex('#131521'),
    road: k.Color.fromHex('#202133'),
    roadBottom: k.Color.fromHex('#171927'),
    line: k.Color.fromHex('#45415a'),
    lime: k.Color.fromHex('#d9ff65'),
    purple: k.Color.fromHex('#b698ec'),
    cyan: k.Color.fromHex('#73e4d8'),
    gold: k.Color.fromHex('#ffd378'),
    moon: k.Color.fromHex('#e8d2f0'),
    moonShade: k.Color.fromHex('#b698d1'),
    white: k.Color.fromHex('#e4def6'),
  };

  let seed = 7919;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const stars = Array.from({ length: 32 }, (_, index) => ({
    x: 16 + random() * 448,
    y: 25 + random() * 197,
    radius: index % 5 === 0 ? 1.7 : 0.9,
    flare: index % 8 === 0,
  }));

  function buildings(count: number, base: number, near: boolean): Building[] {
    return Array.from({ length: count }, (_, index) => {
      const x = index * (500 / count) - 10;
      const width = (500 / count) * (0.62 + random() * 0.26);
      const top = base - (near ? 30 : 38) - random() * (near ? 78 : 68);
      const windows: Building['windows'] = [];
      if (near) {
        for (let row = 0; row < 4; row++) {
          for (let column = 0; column < 2; column++) {
            if (random() > 0.58 || top + 14 + row * 14 > base - 10) continue;
            windows.push({
              x: x + 7 + column * 11,
              y: top + 14 + row * 14,
              warm: random() > 0.32,
            });
          }
        }
      }
      return { x, width, top, windows, antenna: random() > 0.68 };
    });
  }

  const far = buildings(19, 258, false);
  const near = buildings(12, 286, true);
  const horizon = 250;
  const depthY = (depth: number) => horizon + 470 * depth * depth;
  const leftAt = (y: number) => 140 - (y - horizon) * (180 / 470);
  const rightAt = (y: number) => 340 + (y - horizon) * (180 / 470);
  const laneAt = (y: number, fraction: number) => {
    const left = leftAt(y);
    return left + (rightAt(y) - left) * fraction;
  };

  k.add([
    k.z(-30),
    {
      id: 'midnight-sky',
      draw() {
        k.drawRect({ width: 480, height: 720, color: c.sky });
        k.drawRect({ width: 480, height: 286, gradient: [c.skyTop, c.skyBottom] });
        for (const star of stars) {
          k.drawCircle({ pos: k.vec2(star.x, star.y), radius: star.radius, color: c.white, opacity: 0.56 });
          if (star.flare) {
            k.drawLine({ p1: k.vec2(star.x - 4, star.y), p2: k.vec2(star.x + 4, star.y), width: 0.8, color: c.purple, opacity: 0.45 });
            k.drawLine({ p1: k.vec2(star.x, star.y - 4), p2: k.vec2(star.x, star.y + 4), width: 0.8, color: c.purple, opacity: 0.45 });
          }
        }
        k.drawCircle({ pos: k.vec2(350, 140), radius: 94, anchor: 'center', color: c.purple, opacity: 0.035 });
        k.drawCircle({ pos: k.vec2(350, 140), radius: 78, anchor: 'center', color: c.moon, opacity: 0.045 });
        k.drawEllipse({ pos: k.vec2(350, 140), radiusX: 65, radiusY: 65, anchor: 'center', gradient: [c.moon, c.moonShade] });
        for (const [x, y, radius] of [[323, 119, 12], [369, 155, 18], [335, 168, 7], [376, 112, 6]] as const) {
          k.drawCircle({ pos: k.vec2(x, y), radius, anchor: 'center', color: c.moonShade, opacity: 0.23 });
        }
        k.drawLine({ p1: k.vec2(287, 137), p2: k.vec2(413, 137), width: 1, color: c.moon, opacity: 0.13 });
      },
    },
  ]);

  k.add([
    k.z(-24),
    {
      id: 'rooftop-city',
      draw() {
        for (const building of far) {
          k.drawRect({ pos: k.vec2(building.x, building.top), width: building.width, height: 258 - building.top, color: c.distant });
          if (building.antenna) {
            k.drawLine({ p1: k.vec2(building.x + building.width / 2, building.top), p2: k.vec2(building.x + building.width / 2, building.top - 14), width: 1, color: c.distant });
          }
        }
        for (const building of near) {
          k.drawRect({ pos: k.vec2(building.x, building.top), width: building.width, height: 286 - building.top, color: c.skyline });
          k.drawLine({ p1: k.vec2(building.x, building.top), p2: k.vec2(building.x + building.width, building.top), width: 1, color: c.purple, opacity: 0.16 });
          if (building.antenna) {
            const x = building.x + building.width * 0.7;
            k.drawLine({ p1: k.vec2(x, building.top), p2: k.vec2(x, building.top - 18), width: 1.4, color: c.skyline });
            k.drawCircle({ pos: k.vec2(x, building.top - 18), radius: 1.2, color: c.gold, opacity: 0.75 });
          }
          for (const window of building.windows) {
            k.drawRect({ pos: k.vec2(window.x, window.y), width: 3, height: 5, color: window.warm ? c.gold : c.cyan, opacity: 0.56 });
          }
        }
        k.drawRect({ pos: k.vec2(0, 275), width: 480, height: 16, color: c.rooftop });
        k.drawLine({ p1: k.vec2(0, 275), p2: k.vec2(480, 275), width: 1, color: c.purple, opacity: 0.2 });
      },
    },
  ]);

  k.add([
    k.z(-20),
    {
      id: 'night-runway',
      draw() {
        const state = read();
        const accent = state.frenzy ? c.gold : c.lime;
        const elapsed = reducedMotion ? 0 : state.elapsed;
        const scroll = elapsed * Math.max(80, state.speed) / 3000;
        k.drawRect({ pos: k.vec2(0, horizon), width: 480, height: 470, color: c.ground });
        k.drawPolygon({
          pts: [k.vec2(140, horizon), k.vec2(340, horizon), k.vec2(520, 720), k.vec2(-40, 720)],
          colors: [c.road, c.road, c.roadBottom, c.roadBottom],
        });

        for (const fraction of [1 / 3, 2 / 3]) {
          k.drawLine({ p1: k.vec2(laneAt(horizon, fraction), horizon), p2: k.vec2(laneAt(720, fraction), 720), width: 1, color: c.line, opacity: 0.5 });
        }
        for (const edge of [leftAt, rightAt]) {
          k.drawLine({ p1: k.vec2(edge(horizon), horizon), p2: k.vec2(edge(720), 720), width: 11, color: accent, opacity: 0.045 });
          k.drawLine({ p1: k.vec2(edge(horizon), horizon), p2: k.vec2(edge(720), 720), width: 2, color: accent, opacity: 0.75 });
        }

        for (let index = 0; index < 13; index++) {
          const depth = (index / 13 + scroll) % 1;
          const y = depthY(depth);
          k.drawLine({ p1: k.vec2(leftAt(y), y), p2: k.vec2(rightAt(y), y), width: 1, color: c.purple, opacity: 0.05 + depth * 0.12 });
          const ahead = depthY(Math.min(1, depth + 0.025 + depth * 0.018));
          for (const edge of [leftAt, rightAt]) {
            k.drawLine({ p1: k.vec2(edge(y), y), p2: k.vec2(edge(ahead), ahead), width: 2 + depth * 3, color: accent, opacity: 0.3 + depth * 0.6 });
          }
          if (index % 2 === 0) {
            for (const fraction of [1 / 3, 2 / 3]) {
              k.drawLine({ p1: k.vec2(laneAt(y, fraction), y), p2: k.vec2(laneAt(ahead, fraction), ahead), width: 1 + depth, color: c.purple, opacity: 0.24 });
            }
          }
        }

        // A thin arrival glow gives the vanishing point a clean, bright silhouette.
        k.drawLine({ p1: k.vec2(141, horizon), p2: k.vec2(339, horizon), width: 5, color: accent, opacity: 0.075 });
        k.drawLine({ p1: k.vec2(141, horizon), p2: k.vec2(339, horizon), width: 1, color: accent, opacity: 0.4 });
      },
    },
  ]);

  k.add([
    k.z(-10),
    {
      id: 'runway-speed-streaks',
      draw() {
        if (reducedMotion) return;
        const state = read();
        if (state.speed < 100) return;
        const amount = state.frenzy ? 14 : 6;
        const accent = state.frenzy ? c.gold : c.cyan;
        for (let index = 0; index < amount; index++) {
          const depth = (index / amount + state.elapsed * state.speed / 2100) % 1;
          const y = 330 + depth * 390;
          const left = index % 2 === 0;
          const x = left ? leftAt(y) - 16 - (index % 3) * 10 : rightAt(y) + 16 + (index % 3) * 10;
          const length = 8 + depth * (state.frenzy ? 66 : 30);
          k.drawLine({ p1: k.vec2(x, y), p2: k.vec2(x + (left ? -1 : 1) * length * 0.35, y + length), width: state.frenzy ? 1.4 : 1, color: accent, opacity: depth * (state.frenzy ? 0.42 : 0.17) });
        }
      },
    },
  ]);
}
