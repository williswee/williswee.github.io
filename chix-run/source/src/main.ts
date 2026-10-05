import kaplay, { type GameObj, type PosComp } from 'kaplay';
import { step, type Phase, type FlowEvent } from './flow';
import { freshArcade, advanceArcade, collectCoin, triggerDash, registerHit, grantMagnet, isInvulnerable, type Arcade } from './arcade';
import { playingHud, type PlayingPhase, type RunGuidance } from './hud';
import { chickenArt, coinArt, hazardArt, magnetArt, palette } from './art';
import { makeWorld } from './world';
import { createSound } from './sound';
import { loadDisplayFont } from './display-font';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const status = document.querySelector<HTMLParagraphElement>('#status');
if (!canvas || !status) throw new Error('The game canvas and status region are required.');
const W = 480;
const H = 720;
const PLAYER_Y = 580;
const SPEED = 380;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const k = kaplay({ canvas, width: W, height: H, stretch: true, letterbox: true, background: palette.field,
  global: false, debug: false, touchToMouse: false, crisp: false, focus: true, pixelDensity: 2 });
k.loadFont('Outfit', './fonts/outfit.ttf', { size: 128, filter: 'linear' });
loadDisplayFont(k);
const sound = createSound();
const c = (value: string) => k.Color.fromHex(value);
let phase: Phase = { kind: 'menu' };
let arcade: Arcade = freshArcade();
let hud: ReturnType<typeof playingHud> | null = null;
let player: GameObj<PosComp> | null = null;
let elapsed = 0;
let run = 0;
let hits = 0;
let coins = 0;
let dashes = 0;
let smashes = 0;
let nearMisses = 0;
let magnets = 0;
let best = readBest();
let finalStats = { elapsed: 0, maxCombo: 0, smashes: 0, newBest: false };
let flash = 0;
let flashColor: string = palette.cyan;
let activeBanner: GameObj | null = null;
let inputMode: 'keyboard' | 'pointer' = matchMedia('(pointer: coarse)').matches ? 'pointer' : 'keyboard';
type Lesson = 'move' | 'dash';
const learnedLessons = new Set<Lesson>();
try {
  const saved: unknown = JSON.parse(localStorage.getItem('chix-run-lessons') ?? '[]');
  if (Array.isArray(saved)) for (const lesson of saved) {
    if (lesson === 'move' || lesson === 'dash') learnedLessons.add(lesson);
  }
} catch { /* Guidance still works when storage is unavailable. */ }
const pointers = new Map<number, -1 | 1>();
type ItemKind = 'coin' | 'hazard' | 'magnet';
type Falling = GameObj<PosComp> & {
  kind: ItemKind; width: number; hazardType: 'drone' | 'gate' | undefined;
  speed: number; nearChecked: boolean;
};
const items = new Set<Falling>();
const level = () => 1 + Math.floor(elapsed / 18);

function learn(lesson: Lesson) {
  if (learnedLessons.has(lesson)) return;
  learnedLessons.add(lesson);
  try { localStorage.setItem('chix-run-lessons', JSON.stringify([...learnedLessons])); } catch { /* Remember for this session. */ }
}
function runGuidance(): RunGuidance {
  if (phase.kind !== 'playing') return null;
  if (elapsed < 4.5 && !learnedLessons.has('move')) return 'move';
  if (elapsed >= 4.5 && !learnedLessons.has('dash')) return 'dash';
  return null;
}

function readBest() {
  try {
    const value = Number(localStorage.getItem('chix-run-best') ?? localStorage.getItem('bean-run-best') ?? 0);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch { return 0; }
}
function saveBest(value: number) {
  best = Math.max(best, value);
  try { localStorage.setItem('chix-run-best', String(best)); } catch { /* Private mode still permits play. */ }
  const bestLabel = document.querySelector('#personal-best');
  if (bestLabel) bestLabel.textContent = best.toString().padStart(3, '0');
}
saveBest(best);

function announce() {
  if (!status || !canvas) return;
  switch (phase.kind) {
    case 'menu':
      status.textContent = 'Chix Run. Enter to run. Move with arrows or A and D. Space or Shift to dash.';
      canvas.setAttribute('aria-label', 'Chix Run. Enter to start. Arrow keys or A and D to move. Space or Shift to dash. On touch, hold either side to move and tap the dash button.');
      break;
    case 'playing':
      status.textContent = `Score ${phase.score}. ${phase.lives} lives. Dash ${arcade.dash.kind}.`;
      canvas.setAttribute('aria-label', 'Chix Run. Playing. Arrow keys or A and D to move. Space or Shift to dash. On touch, hold either side to move and tap the dash button.');
      break;
    case 'gameover':
      status.textContent = `Run finished. ${phase.score} coins. Press Enter or tap Run again.`;
      canvas.setAttribute('aria-label', `Chix Run. Game over with ${phase.score} coins. Press Enter or Space to restart, or tap One more run.`);
      break;
  }
  canvas.dataset.phase = phase.kind;
  document.body.dataset.phase = phase.kind;
}

/** This is the only bridge between the game and its pure score/life flow. */
function dispatch(event: FlowEvent) {
  const next = step(phase, event);
  if (next === phase) return;
  const changedScene = next.kind !== phase.kind;
  if (next.kind === 'gameover') {
    finalStats = { elapsed, maxCombo: arcade.maxCombo, smashes, newBest: next.score > best };
    saveBest(next.score);
    sound.play('over');
  }
  phase = next;
  announce();
  if (changedScene) enter(phase);
  else if (phase.kind === 'playing') hud?.renderPhase(phase);
}

function enter(next: Phase) {
  pointers.clear(); player = null; hud = null; items.clear();
  switch (next.kind) {
    case 'menu': k.go('menu'); break;
    case 'playing': k.go('playing', next); break;
    case 'gameover': k.go('gameover', next); break;
    default: { const unreachable: never = next; throw new Error(String(unreachable)); }
  }
}

function text(value: string, x: number, y: number, size: number, color: string = palette.cream, center = false, display = false) {
  return k.add([k.pos(x, y), k.text(value, { size, font: display ? 'Display' : 'Outfit', align: center ? 'center' : 'left' }),
    k.color(c(color)), k.opacity(1), k.anchor(center ? 'center' : 'topleft'), k.z(30)]);
}
function drawText(value: string, x: number, y: number, size: number, color: string = palette.cream, display = false, center = true) {
  k.drawText({ text: value, pos: k.vec2(x, y), size, font: display ? 'Display' : 'Outfit', color: c(color), anchor: center ? 'center' : 'topleft' });
}
function line(x1: number, y1: number, x2: number, y2: number, color: string, width = 1) {
  k.drawLine({ p1: k.vec2(x1, y1), p2: k.vec2(x2, y2), color: c(color), width });
}
function burst(x: number, y: number, color: string, big = false) {
  const count = reducedMotion ? 3 : big ? 22 : 9;
  for (let i = 0; i < count; i++) {
    k.add([k.pos(x, y), k.rect(i % 3 === 0 ? 7 : 3, i % 3 === 0 ? 3 : 3), k.anchor('center'), k.rotate(i * 38),
      k.color(c(color)), k.opacity(1), k.move(i * 360 / count, (big ? 140 : 65) + i * 6), k.lifespan(big ? 0.75 : 0.45, { fade: 0.3 }), k.z(24)]);
  }
}
function popup(value: string, x: number, y: number, color: string = palette.gold, size = 22) {
  const object = text(value, x, y, size, color, true, true);
  object.use(k.move(-90, 35)); object.use(k.lifespan(0.8, { fade: 0.35 }));
}
function banner(value: string, sub: string, color: string = palette.gold, duration = 1.8) {
  if (activeBanner?.exists()) k.destroy(activeBanner);
  const object = k.add([k.pos(240, 300), k.z(32), k.opacity(1), k.lifespan(duration),
    { id: 'run-banner', draw() {
      k.drawRect({ pos: k.vec2(0, 0), width: 350, height: 65, radius: 8, anchor: 'center', color: c('#151522'), opacity: 0.92 });
      drawText(value, 0, -9, 31, color, true); drawText(sub, 0, 19, 14, palette.cream);
    } }]);
  activeBanner = object;
  object.onDestroy(() => { if (activeBanner === object) activeBanner = null; });
  if (!reducedMotion) object.onUpdate(() => { object.pos.y = 300 - Math.sin(Math.min(k.time(), 1) * Math.PI) * 2; });
}

function actionButton(label: string) {
  const button = k.add([k.pos(240, 565), k.rect(400, 62, { radius: 10 }), k.anchor('center'), k.color(c(palette.mint)), k.z(29)]);
  text(label, 225, 562, 27, palette.ink, true, true);
  k.add([k.z(31), { id: 'action-arrow', draw() {
    line(388, 565, 406, 565, palette.ink, 2.5); line(398, 558, 406, 565, palette.ink, 2.5); line(398, 572, 406, 565, palette.ink, 2.5);
  } }]);
  button.onUpdate(() => {
    const m = k.mousePos(); const hover = m.x >= 40 && m.x <= 440 && m.y >= 534 && m.y <= 596;
    button.color = c(hover ? '#ebffac' : palette.mint);
    if (canvas) canvas.style.cursor = hover ? 'pointer' : 'default';
  });
  if (!matchMedia('(pointer: coarse)').matches) text('ENTER / SPACE', 240, 611, 11, palette.muted, true);
}

k.scene('menu', () => {
  makeWorld(k, () => ({ elapsed: reducedMotion ? 0 : k.time() * 0.3, speed: 90, frenzy: false }), reducedMotion);
  const titleShadow = text('CHIX RUN', 244, 139, 89, '#503d72', true, true); titleShadow.use(k.rotate(-6));
  const title = text('CHIX RUN', 240, 132, 89, palette.cream, true, true); title.use(k.rotate(-6));
  const tag = k.add([k.pos(240, 214), k.rotate(-6), k.rect(166, 30, { radius: 3 }), k.anchor('center'), k.color(c(palette.violet)), k.z(29)]);
  tag.add([k.text('FLIGHT RISK', { size: 17, font: 'Display' }), k.anchor('center'), k.color(c(palette.ink)), k.pos(0, -1)]);
  const hero = k.add([k.pos(260, 350), k.scale(2.7), k.rotate(10), chickenArt(k, () => ({ time: reducedMotion ? 0 : k.time(), moving: 1, dash: false, frenzy: false })), k.z(10)]);
  hero.onUpdate(() => { hero.pos.y = 350 + (reducedMotion ? 0 : Math.sin(k.time() * 3) * 5); });
  k.add([k.z(7), { id: 'hero-speed', draw() {
    for (let i = 0; i < 5; i++) line(65 + i * 10, 326 + i * 24, 161 + i * 8, 326 + i * 24, i % 2 ? palette.violet : palette.mint, i % 2 ? 2 : 4);
  } }]);
  for (const [x, y, s] of [[105, 282, 1], [383, 323, 1.35], [120, 439, 0.85]] as const) {
    const coin = k.add([k.pos(x, y), k.scale(s), coinArt(k), k.z(12)]);
    coin.onUpdate(() => { coin.pos.y = y + (reducedMotion ? 0 : Math.sin(k.time() * 3 + x) * 5); });
  }
  k.add([k.pos(390, 454), k.scale(0.9), k.rotate(-10), hazardArt(k), k.z(12)]);
  text('ALL FLAPS. NO BRAKES.', 240, 480, 24, palette.cream, true, true);
  text('Grab the gold. Don’t get plucked.', 240, 509, 16, palette.muted, true);
  actionButton('LET’S RUN');
  k.onKeyPress(['enter', 'space'], () => { if (!gameKeyboardActive()) return; sound.unlock(); sound.play('start'); dispatch({ type: 'start' }); });
});

function dash() {
  if (phase.kind !== 'playing') return;
  const next = triggerDash(arcade);
  if (next === arcade) return;
  learn('dash');
  arcade = next; dashes += 1; flash = 0.14; flashColor = palette.cyan;
  sound.unlock(); sound.play('dash');
  if (player) burst(player.pos.x, player.pos.y, palette.cyan);
}

k.scene('playing', (initial: PlayingPhase) => {
  arcade = freshArcade(); elapsed = 0; run += 1; hits = 0; coins = 0; dashes = 0; smashes = 0; nearMisses = 0; magnets = 0; flash = 0;
  if (canvas) canvas.style.cursor = 'default';
  makeWorld(k, () => ({ elapsed, speed: arcade.dash.kind === 'dashing' ? 480 : 230 + level() * 20, frenzy: arcade.frenzyRemaining > 0 }), reducedMotion);
  hud = playingHud(k, initial, () => ({ arcade, elapsed, level: level(), best, inputMode, guidance: runGuidance() })); k.add([k.z(50), hud]);
  let direction = 0;
  let invincibleUntil = 0;
  let trailAt = 0;
  let showerAt = 0;
  const chicken = k.add([k.pos(240, PLAYER_Y), k.rotate(0),
    k.area({ shape: new k.Rect(k.vec2(-18, -25), 36, 50) }),
    chickenArt(k, () => ({ time: reducedMotion ? 0 : elapsed, moving: direction, dash: arcade.dash.kind === 'dashing', frenzy: arcade.frenzyRemaining > 0 })), 'player', k.z(15)]);
  player = chicken;
  k.add([k.z(45), { id: 'impact-flash', draw() {
    if (flash > 0 && !reducedMotion) k.drawRect({ width: W, height: H, color: c(flashColor), opacity: flash * 0.8 });
  } }]);

  function createItem(kind: ItemKind, x: number, y = 165, speed = 300, width = 48, hazardType: 'drone' | 'gate' = 'drone', wobble = 0) {
    if (phase.kind !== 'playing') return;
    const item = k.add([k.pos(x, y), k.scale(1), k.rotate(0),
      k.area({ shape: new k.Rect(k.vec2(-width / 2, kind === 'hazard' ? -14 : -12), width, kind === 'hazard' ? 28 : 24) }),
      kind === 'coin' ? coinArt(k) : kind === 'magnet' ? magnetArt(k) : hazardArt(k, width, hazardType === 'gate'),
      { kind, width, hazardType: kind === 'hazard' ? hazardType : undefined, speed, nearChecked: false }, kind, 'falling', k.z(kind === 'hazard' ? 11 : 12)]);
    items.add(item); const createdAt = elapsed;
    item.onDestroy(() => items.delete(item));
    item.onUpdate(() => {
      item.move(0, item.speed + Math.min(level() - 1, 6) * 16);
      if (wobble !== 0) item.pos.x = k.clamp(x + Math.sin((elapsed - createdAt) * 3) * wobble, 52, 428);
      if (hazardType !== 'gate' || kind !== 'hazard') item.scale = k.vec2(k.clamp(0.6 + (item.pos.y - 165) / 1000, 0.6, 1));
      if (kind === 'magnet' && !reducedMotion) item.angle = Math.sin(elapsed * 4) * 10;
      if (kind === 'coin' && (arcade.magnetRemaining > 0 || arcade.frenzyRemaining > 0)) {
        const delta = chicken.pos.sub(item.pos);
        if (delta.len() < (arcade.frenzyRemaining > 0 ? 190 : 160)) item.move(delta.unit().scale(510));
      }
      if (kind === 'hazard' && !item.nearChecked && item.pos.y > chicken.pos.y + 36) {
        item.nearChecked = true;
        const gap = Math.abs(item.pos.x - chicken.pos.x) - item.width / 2;
        if (gap > 15 && gap < 50 && elapsed > invincibleUntil && !isInvulnerable(arcade)) {
          nearMisses += 1; sound.play('near'); popup('CLOSE CALL', chicken.pos.x, chicken.pos.y - 60, palette.cyan, 17);
        }
      }
      if (item.pos.y > 760) k.destroy(item);
    });
    return item;
  }

  function coinTrail(x: number, count = 6, curved = false) {
    for (let i = 0; i < count; i++) k.wait(i * 0.17, () => createItem('coin', k.clamp(x + (curved ? Math.sin(i * 0.6) * 48 : i % 2 === 0 ? -6 : 6), 42, 438), 165, 300, 24));
  }
  function warning(x: number, value = '!') {
    const object = text(value, x, 191, 25, palette.coral, true, true);
    object.use(k.lifespan(0.65, { fade: 0.2 }));
  }
  function drone(x: number, wobble = 0) {
    warning(x); k.wait(0.65, () => createItem('hazard', x, 165, 265, 48, 'drone', wobble));
  }
  function gate(gapX: number) {
    banner('FIND THE GAP', 'OR DASH STRAIGHT THROUGH', palette.coral);
    const left = gapX - 78; const right = gapX + 78;
    k.wait(0.7, () => {
      if (left > 10) createItem('hazard', left / 2, 165, 250, left, 'gate');
      if (right < 470) createItem('hazard', (right + 480) / 2, 165, 250, 480 - right, 'gate');
    });
    coinTrail(gapX, 5);
  }
  // The opening teaches a coin trail before the first hazard reaches the player.
  k.wait(0.25, () => coinTrail(240));
  k.wait(2.35, () => coinTrail(100));
  k.wait(3.9, () => drone(380));
  k.wait(6.5, () => createItem('magnet', chicken.pos.x, 165, 250, 30));
  k.wait(1.1, () => popup('FOLLOW THE GOLD', 240, 405, palette.gold, 18));
  let pattern = 0;
  function nextPattern() {
    if (phase.kind !== 'playing') return;
    const lane = [100, 240, 380][pattern % 3] ?? 240;
    switch (pattern % 5) {
      case 0: gate(lane); break;
      case 1: drone(100, 45); drone(380, -45); coinTrail(240); break;
      case 2: drone(chicken.pos.x, 38); coinTrail(lane, 7, true); break;
      case 3: gate(lane); break;
      case 4: drone(lane); coinTrail(lane === 100 ? 380 : 100, 7); break;
    }
    pattern += 1;
    k.wait(Math.max(1.5, 2.8 - (level() - 1) * 0.15), nextPattern);
  }
  k.wait(6, nextPattern);
  function nextMagnet() {
    createItem('magnet', [100, 240, 380][Math.floor(elapsed) % 3] ?? 240, 165, 250, 30);
    k.wait(16, nextMagnet);
  }
  k.wait(22, nextMagnet);
  let announcedLevel = 1;
  chicken.onUpdate(() => {
    const dt = Math.min(k.dt(), 0.05);
    elapsed += dt; arcade = advanceArcade(arcade, dt); flash = Math.max(0, flash - dt);
    const keyboard = gameKeyboardActive() ? Number(k.isKeyDown('right') || k.isKeyDown('d')) - Number(k.isKeyDown('left') || k.isKeyDown('a')) : 0;
    const pointer = [...pointers.values()].reduce<number>((sum, dir) => sum + dir, 0);
    direction = keyboard || Math.sign(pointer);
    const dashing = arcade.dash.kind === 'dashing';
    chicken.move(direction * SPEED * (dashing ? 2.1 : 1), 0);
    chicken.pos.x = k.clamp(chicken.pos.x, 38, 442);
    if (Math.abs(chicken.pos.x - 240) >= 32) learn('move');
    chicken.angle = reducedMotion ? 0 : k.lerp(chicken.angle, direction * 12, Math.min(1, dt * 14));
    chicken.hidden = !reducedMotion && elapsed < invincibleUntil && Math.floor(elapsed * 12) % 2 === 0;
    if (dashing && elapsed > trailAt && !reducedMotion) {
      trailAt = elapsed + 0.04;
      const shedAt = k.time();
      k.add([k.pos(chicken.pos.x - direction * 25, chicken.pos.y), k.rotate(chicken.angle + direction * 45), k.opacity(1), k.lifespan(0.3), k.z(13),
        { id: 'feather-trail', draw() {
          const opacity = Math.max(0, 0.5 * (1 - (k.time() - shedAt) / 0.3));
          k.drawEllipse({ radiusX: 5, radiusY: 14, anchor: 'center', color: c(palette.cyan), opacity });
          k.drawLine({ p1: k.vec2(0, -10), p2: k.vec2(0, 12), width: 1, color: c(palette.cream), opacity });
        } }]);
    }
    if (arcade.frenzyRemaining > 0 && elapsed > showerAt) {
      showerAt = elapsed + 0.33;
      createItem('coin', k.rand(55, 425), 160, 410, 24);
    }
    if (level() > announcedLevel) {
      announcedLevel = level(); banner(`ROUND ${announcedLevel}`, 'FASTER FEET. BIGGER TROUBLE.', palette.violet); sound.play('power');
    }
  });
  chicken.onCollide('coin', (coin) => {
    if (phase.kind !== 'playing' || !coin.exists()) return;
    const { x, y } = coin.pos; k.destroy(coin); coins += 1;
    const wasFrenzy = arcade.frenzyRemaining > 0;
    arcade = collectCoin(arcade); dispatch({ type: 'coin' });
    sound.play('coin', 1 + Math.min(arcade.combo % 8, 7) * 0.065);
    burst(x, y, palette.gold); popup('+1', x, y - 20);
    if (coins === 1) {
      banner('8 IN A ROW = A SHIELD', 'You can’t get hit for 6 seconds.', palette.gold, 3);
      if (status) status.textContent = 'Collect eight coins in a row for a shield. You cannot take damage for six seconds.';
    }
    if (!wasFrenzy && arcade.frenzyRemaining > 0) {
      banner('SHIELD ON!', 'Safe for 6 seconds. Smash through drones!', palette.gold, 2.4);
      if (status) status.textContent = 'Shield on. You cannot take damage for six seconds. You can smash through drones.';
      sound.play('power'); flash = 0.2; flashColor = palette.gold;
    }
  });
  chicken.onCollide('magnet', (magnet) => {
    if (phase.kind !== 'playing' || !magnet.exists()) return;
    k.destroy(magnet); magnets += 1; arcade = grantMagnet(arcade); sound.play('power');
    banner('COIN MAGNET', 'THE GOLD COMES TO YOU', palette.cyan); burst(chicken.pos.x, chicken.pos.y, palette.cyan, true);
  });
  chicken.onCollide('hazard', (hazard) => {
    if (phase.kind !== 'playing' || !hazard.exists()) return;
    if (isInvulnerable(arcade)) {
      k.destroy(hazard); smashes += 1; sound.play('dash');
      burst(chicken.pos.x, chicken.pos.y - 15, palette.coral, true); popup('SMASH!', chicken.pos.x, chicken.pos.y - 65, palette.mint, 25);
      for (const dx of [-22, 0, 22]) createItem('coin', k.clamp(chicken.pos.x + dx, 40, 440), chicken.pos.y - 50, 170, 24);
      return;
    }
    if (elapsed < invincibleUntil) return;
    k.destroy(hazard); hits += 1; invincibleUntil = elapsed + 1.35; arcade = registerHit(arcade);
    sound.play('hit'); burst(chicken.pos.x, chicken.pos.y, palette.coral, true); flash = 0.23; flashColor = palette.coral;
    if (!reducedMotion) k.shake(5);
    dispatch({ type: 'hit' });
    if (phase.kind === 'playing') popup('OUCH!', chicken.pos.x, chicken.pos.y - 65, palette.coral, 25);
  });
  k.onKeyPress(['space', 'shift'], () => { if (gameKeyboardActive()) dash(); });
});

k.scene('gameover', (final: Extract<Phase, { kind: 'gameover' }>) => {
  makeWorld(k, () => ({ elapsed: finalStats.elapsed * 0.3, speed: 0, frenzy: false }), reducedMotion);
  k.add([k.z(20), { id: 'results-tint', draw() { k.drawRect({ width: W, height: H, color: c('#111320'), opacity: 0.63 }); } }]);
  text('OH, CLUCK.', 240, 155, 65, palette.cream, true, true);
  text('The coop wants its chicken back.', 240, 207, 18, palette.muted, true);
  const chicken = k.add([k.pos(240, 286), k.scale(1.5), k.rotate(-14), chickenArt(k, () => ({ time: 0, moving: 0, dash: false, frenzy: false })), k.z(25)]);
  if (!reducedMotion) chicken.onUpdate(() => { chicken.pos.y = 286 + Math.sin(k.time() * 2) * 3; });
  text(final.score.toString().padStart(3, '0'), 240, 389, 78, palette.gold, true, true);
  text(finalStats.newBest ? 'NEW PERSONAL BEST · COINS IN THE BAG' : 'COINS IN THE BAG', 240, 443, 12, finalStats.newBest ? palette.gold : palette.muted, true);
  k.add([k.z(30), { id: 'run-stats', draw() {
    line(40, 463, 440, 463, palette.line);
    for (const [x, value, label] of [[107, `${Math.floor(finalStats.elapsed)}s`, 'SURVIVED'], [240, String(finalStats.maxCombo), 'BEST STREAK'], [373, String(finalStats.smashes), 'SMASHES']] as const) {
      drawText(value, x, 486, 25, palette.cream, true); drawText(label, x, 510, 10, palette.muted);
    }
  } }]);
  actionButton('ONE MORE RUN');
  k.onKeyPress(['enter', 'space'], () => { if (!gameKeyboardActive()) return; sound.unlock(); sound.play('start'); dispatch({ type: 'restart' }); });
});

function gameKeyboardActive(): boolean {
  const active = document.activeElement;
  return active === canvas || active === document.body || active === document.documentElement;
}

function logicalPoint(event: PointerEvent) {
  const box = canvas!.getBoundingClientRect();
  return { x: (event.clientX - box.left) / box.width * W, y: (event.clientY - box.top) / box.height * H };
}
canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  inputMode = 'pointer';
  event.preventDefault(); canvas.focus({ preventScroll: true }); sound.unlock();
  const point = logicalPoint(event);
  if (phase.kind !== 'playing') {
    if (point.x >= 40 && point.x <= 440 && point.y >= 534 && point.y <= 596) {
      sound.play('start'); dispatch({ type: phase.kind === 'menu' ? 'start' : 'restart' });
    }
    return;
  }
  if (point.x >= 168 && point.x <= 312 && point.y >= 640) { dash(); return; }
  canvas.setPointerCapture(event.pointerId); pointers.set(event.pointerId, point.x < W / 2 ? -1 : 1);
});
canvas.addEventListener('pointermove', (event) => {
  if (pointers.has(event.pointerId)) pointers.set(event.pointerId, logicalPoint(event).x < W / 2 ? -1 : 1);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) canvas.addEventListener(name, (event) => pointers.delete(event.pointerId));
window.addEventListener('blur', () => pointers.clear());
document.addEventListener('visibilitychange', () => pointers.clear());
canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Shift'].includes(event.key)) event.preventDefault(); });
document.addEventListener('keydown', event => {
  if (gameKeyboardActive() && ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', ' ', 'Enter', 'Shift'].includes(event.key)) inputMode = 'keyboard';
});
const soundButton = document.querySelector<HTMLButtonElement>('#sound-toggle');
soundButton?.addEventListener('click', () => {
  sound.unlock(); const muted = sound.toggle(); soundButton.setAttribute('aria-pressed', String(muted));
  soundButton.setAttribute('aria-label', muted ? 'Unmute game sound' : 'Mute game sound');
  const label = soundButton.querySelector('span'); if (label) label.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
});

// Verification observes copies; there are no setters, dispatchers or cheat spawns.
if (import.meta.env.DEV) Object.defineProperty(window, '__chixRun', { value: Object.freeze({ snapshot: () => ({
  phase: { ...phase }, player: player ? { x: player.pos.x, y: player.pos.y } : null,
  items: [...items].map(item => ({ kind: item.kind, x: item.pos.x, y: item.pos.y, width: item.width, hazardType: item.hazardType })),
  arcade: { ...arcade, dash: { ...arcade.dash } }, run, hits, coins, elapsed, dashes, smashes, nearMisses, magnets, best, level: level(),
  guidance: { inputMode, active: runGuidance(), learned: [...learnedLessons] },
}) }), writable: false, configurable: true });
k.onLoad(() => { announce(); enter(phase); });
