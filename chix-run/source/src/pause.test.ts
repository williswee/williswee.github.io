import { describe, expect, test } from 'bun:test';
import { createRunPause } from './pause';

function runFixture() {
  const run = { playing: true, score: 7, lives: 3, elapsed: 4, dashRemaining: 0.2 };
  let enginePaused = false;
  let cleared = 0;
  let focused = 0;
  const changes: boolean[] = [];
  const pause = createRunPause({
    canPause: () => run.playing,
    setEnginePaused: value => { enginePaused = value; },
    clearInput: () => { cleared += 1; },
    onChange: value => changes.push(value),
    focusGame: () => { focused += 1; },
  });
  function tick() {
    if (!enginePaused) {
      run.elapsed += 1;
      run.dashRemaining = Math.max(0, run.dashRemaining - 1);
      run.lives -= 1;
    }
  }
  return { run, pause, tick, changes, cleared: () => cleared, focused: () => focused };
}

describe('run pause', () => {
  test('leaving the court freezes the existing run until an explicit resume', () => {
    const game = runFixture();
    const before = { ...game.run };
    game.pause.pause();
    game.tick(); game.tick();
    expect(game.run).toEqual(before);
    expect(game.pause.paused).toBe(true);
    expect(game.cleared()).toBe(1);
    expect(game.focused()).toBe(0);
    game.pause.resume();
    expect(game.focused()).toBe(1);
    game.tick();
    expect(game.run.elapsed).toBe(5);
    expect(game.run.score).toBe(7);
    expect(game.run.lives).toBe(2);
    expect(game.changes).toEqual([true, false]);
  });

  test('repeated focus loss and hidden-tab signals cannot toggle the run back on', () => {
    const game = runFixture();
    game.pause.pause(); game.pause.pause(); game.pause.pause();
    game.tick();
    expect(game.pause.paused).toBe(true);
    expect(game.run.elapsed).toBe(4);
    expect(game.changes).toEqual([true]);
    expect(game.cleared()).toBe(1);
    game.pause.toggle();
    expect(game.pause.paused).toBe(false);
    expect(game.focused()).toBe(1);
  });

  test('menu and finished runs cannot be paused or resumed', () => {
    const game = runFixture();
    game.run.playing = false;
    game.pause.pause(); game.pause.resume(); game.pause.toggle();
    expect(game.pause.paused).toBe(false);
    expect(game.changes).toEqual([]);
    expect(game.focused()).toBe(0);
  });

  test('a new scene clears pause without moving focus or restarting the old run', () => {
    const game = runFixture();
    game.pause.pause();
    game.pause.reset();
    expect(game.pause.paused).toBe(false);
    expect(game.run).toEqual({ playing: true, score: 7, lives: 3, elapsed: 4, dashRemaining: 0.2 });
    expect(game.focused()).toBe(0);
    expect(game.changes).toEqual([true, false]);
  });
});
