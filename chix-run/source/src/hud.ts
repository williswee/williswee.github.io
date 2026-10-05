import type { Comp, KAPLAYCtx } from 'kaplay';
import type { Phase } from './flow';
import type { Arcade } from './arcade';
import { dashReadyProgress } from './arcade';
import { palette } from './art';

export type PlayingPhase = Extract<Phase, { kind: 'playing' }>;
export type RunGuidance = 'move' | 'dash' | null;
export type HudState = { arcade: Arcade; elapsed: number; level: number; best: number; inputMode: 'keyboard' | 'pointer'; guidance: RunGuidance };

/** Menu and game-over phases cannot be rendered by the live game HUD. */
export function playingHud(k: KAPLAYCtx, initial: PlayingPhase, read: () => HudState): Comp & { renderPhase: (phase: PlayingPhase) => void } {
  let phase = initial;
  const c = (value: string) => k.Color.fromHex(value);
  function label(value: string, x: number, y: number, size: number, color: string = palette.cream, font = 'Outfit', center = false) {
    k.drawText({ text: value, pos: k.vec2(x, y), font, size, color: c(color), anchor: center ? 'center' : 'topleft' });
  }
  return { id: 'playing-hud', renderPhase(next) { phase = next; }, draw() {
    const { arcade, elapsed, level, inputMode, guidance } = read();
    const frenzy = arcade.frenzyRemaining > 0;
    k.drawRect({ width: 480, height: 151, color: c('#111320'), opacity: 0.95 });
    k.drawLine({ p1: k.vec2(24, 93), p2: k.vec2(456, 93), width: 1, color: c(palette.line) });
    label('COINS', 26, 18, 11, palette.muted);
    label(phase.score.toString().padStart(3, '0'), 24, 32, 44, palette.cream, 'Display');
    label(`ROUND ${level.toString().padStart(2, '0')}`, 240, 27, 13, palette.violet, 'Outfit', true);
    label(`${Math.floor(elapsed / 60)}:${Math.floor(elapsed % 60).toString().padStart(2, '0')}`, 240, 57, 23, palette.cream, 'Display', true);
    label('LIVES', 364, 18, 11, palette.muted);
    for (let i = 0; i < 3; i++) {
      const x = 371 + i * 30;
      const alive = i < phase.lives;
      k.drawCircle({ pos: k.vec2(x, 57), radius: 10, anchor: 'center', color: c(alive ? palette.cream : '#383448') });
      for (const dx of [-4, 0, 4]) k.drawCircle({ pos: k.vec2(x + dx, 45 - (dx === 0 ? 2 : 0)), radius: 3, anchor: 'center', color: c(alive ? palette.comb : '#383448') });
      k.drawPolygon({ pts: [k.vec2(x + 7, 55), k.vec2(x + 16, 58), k.vec2(x + 7, 61)], color: c(alive ? palette.orange : '#383448') });
      if (alive) {
        for (const dx of [-3, 4]) k.drawCircle({ pos: k.vec2(x + dx, 54), radius: dx < 0 ? 2 : 2.5, anchor: 'center', color: c(palette.ink) });
      }
    }
    label(frenzy ? 'SHIELD: YOU CAN’T GET HIT' : arcade.combo > 0 ? `${8 - arcade.combo % 8} MORE COINS = SHIELD` : '8 IN A ROW = A SHIELD', 26, 102, 12, frenzy ? palette.gold : palette.cream);
    for (let i = 0; i < 8; i++) {
      const active = frenzy || i < arcade.combo % 8;
      k.drawRect({ pos: k.vec2(26 + i * 19, 127), width: 14, height: 4, radius: 2, color: c(active ? palette.gold : '#41394f') });
    }
    if (frenzy) label(`${arcade.frenzyRemaining.toFixed(1)}s`, 185, 120, 12, palette.gold);
    if (arcade.magnetRemaining > 0) {
      label(`MAGNET  ${Math.ceil(arcade.magnetRemaining)}s`, 335, 109, 13, palette.cyan);
    } else label(arcade.dash.kind === 'ready' ? 'DASH READY' : arcade.dash.kind === 'dashing' ? 'DASHING' : 'DASH RECHARGING', 319, 109, 12, palette.muted);
    k.drawRect({ pos: k.vec2(0, 632), width: 480, height: 88, color: c('#10121e'), opacity: 0.96 });
    k.drawLine({ p1: k.vec2(24, 632), p2: k.vec2(456, 632), color: c(palette.line), width: 1 });
    const ready = arcade.dash.kind === 'ready';
    const dashing = arcade.dash.kind === 'dashing';
    k.drawRect({ pos: k.vec2(240, 665), width: 144, height: 44, radius: 10, anchor: 'center', color: c(ready ? palette.mint : dashing ? palette.cyan : '#292737') });
    if (guidance === 'dash' && ready) k.drawRect({ pos: k.vec2(240, 665), width: 152, height: 52, radius: 13, anchor: 'center', fill: false, outline: { width: 2, color: c(palette.cream) } });
    if (!ready && !dashing) k.drawRect({ pos: k.vec2(176, 687), width: 128 * dashReadyProgress(arcade), height: 3, radius: 2, color: c(palette.mint) });
    label(ready ? 'DASH' : dashing ? 'WHOOSH!' : `${arcade.dash.kind === 'cooldown' ? arcade.dash.remaining.toFixed(1) : '0'}s`, 248, 665, 19, ready || dashing ? palette.ink : palette.muted, 'Outfit', true);
    if (ready) k.drawPolygon({ pts: [k.vec2(196, 653), k.vec2(189, 667), k.vec2(197, 667), k.vec2(193, 678), k.vec2(205, 662), k.vec2(197, 662)], color: c(palette.ink) });
    for (const [x, dir] of [[68, -1], [412, 1]] as const) {
      k.drawLines({ pts: [k.vec2(x - dir * 6, 656), k.vec2(x + dir * 6, 665), k.vec2(x - dir * 6, 674)], width: 2, color: c(palette.cream), cap: 'round', join: 'round' });
    }
    const touch = window.innerWidth <= 540;
    label(touch ? 'LEFT' : 'A / LEFT', 106, 665, touch ? 15 : 11, palette.muted, 'Outfit', true);
    label(touch ? 'RIGHT' : 'D / RIGHT', 373, 665, touch ? 15 : 11, palette.muted, 'Outfit', true);
    const help = dashing ? 'YOU CAN’T GET HIT WHILE DASHING'
      : !ready ? 'RECHARGING · DODGE UNTIL READY'
      : guidance === 'move' ? inputMode === 'pointer' ? 'HOLD EITHER SIDE · FOLLOW THE GOLD' : 'A / D OR ARROWS · FOLLOW THE GOLD'
      : guidance === 'dash' ? inputMode === 'pointer' ? 'TAP DASH TO SMASH THROUGH DRONES' : 'SPACE / SHIFT: SMASH THROUGH DRONES'
      : 'DODGE DRONES · DASH TO BREAK THEM';
    label(help, 240, 706, 17, guidance === 'dash' && ready ? palette.cream : palette.muted, 'Outfit', true);
  } };
}
