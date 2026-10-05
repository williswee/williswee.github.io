import { describe, expect, test } from "bun:test";
import {
  advanceArcade,
  collectCoin,
  COMBO_WINDOW,
  DASH_COOLDOWN,
  DASH_DURATION,
  dashReadyProgress,
  FRENZY_DURATION,
  freshArcade,
  grantMagnet,
  isInvulnerable,
  MAGNET_DURATION,
  registerHit,
  triggerDash,
  type Arcade,
} from "./arcade";

function coins(count: number, initial = freshArcade()): Arcade {
  let state = initial;
  for (let i = 0; i < count; i++) state = collectCoin(state);
  return state;
}

describe("dash timing", () => {
  test("only a ready dash can begin and dashing is invulnerable", () => {
    const ready = freshArcade();
    const dashing = triggerDash(ready);
    expect(dashing.dash).toEqual({ kind: "dashing", remaining: DASH_DURATION });
    expect(isInvulnerable(dashing)).toBe(true);
    expect(triggerDash(dashing)).toBe(dashing);
    const cooldown = advanceArcade(dashing, DASH_DURATION);
    expect(cooldown.dash).toEqual({ kind: "cooldown", remaining: DASH_COOLDOWN });
    expect(isInvulnerable(cooldown)).toBe(false);
    expect(triggerDash(cooldown)).toBe(cooldown);
    const recharged = advanceArcade(cooldown, DASH_COOLDOWN);
    expect(recharged.dash).toEqual({ kind: "ready" });
    expect(triggerDash(recharged).dash.kind).toBe("dashing");
  });

  test("a tick crossing the dash boundary subtracts its remaining time from cooldown", () => {
    const dashing = advanceArcade(triggerDash(freshArcade()), 0.1);
    expect(dashing.dash.kind).toBe("dashing");
    if (dashing.dash.kind === "dashing") expect(dashing.dash.remaining).toBeCloseTo(0.3);
    const cooldown = advanceArcade(dashing, 0.8);
    expect(cooldown.dash.kind).toBe("cooldown");
    if (cooldown.dash.kind === "cooldown") expect(cooldown.dash.remaining).toBeCloseTo(1.9);
  });

  test("a single tick can cross both boundaries, exactly or with excess time", () => {
    const dashing = triggerDash(freshArcade());
    expect(advanceArcade(dashing, DASH_DURATION + DASH_COOLDOWN).dash).toEqual({ kind: "ready" });
    expect(advanceArcade(dashing, 30).dash).toEqual({ kind: "ready" });
    expect(advanceArcade(freshArcade(), 30).dash).toEqual({ kind: "ready" });
  });

  test("HUD progress is normalized across all dash states", () => {
    expect(dashReadyProgress(freshArcade())).toBe(1);
    const dashing = triggerDash(freshArcade());
    expect(dashReadyProgress(dashing)).toBe(0);
    const cooldown = advanceArcade(dashing, DASH_DURATION);
    expect(dashReadyProgress(cooldown)).toBe(0);
    expect(dashReadyProgress(advanceArcade(cooldown, DASH_COOLDOWN / 2))).toBeCloseTo(0.5);
    expect(dashReadyProgress(advanceArcade(cooldown, DASH_COOLDOWN))).toBe(1);
    expect(dashReadyProgress({ ...freshArcade(), dash: { kind: "cooldown", remaining: 20 } })).toBe(0);
    expect(dashReadyProgress({ ...freshArcade(), dash: { kind: "cooldown", remaining: -1 } })).toBe(1);
  });
});

describe("coin chains and power-ups", () => {
  test("collecting within the window extends a chain; expiry preserves its record", () => {
    const first = collectCoin(freshArcade());
    expect(first.combo).toBe(1);
    expect(first.comboRemaining).toBe(COMBO_WINDOW);
    const second = collectCoin(advanceArcade(first, COMBO_WINDOW - 0.1));
    expect(second.combo).toBe(2);
    expect(second.comboRemaining).toBe(COMBO_WINDOW);
    const expired = advanceArcade(second, COMBO_WINDOW);
    expect(expired.combo).toBe(0);
    expect(expired.comboRemaining).toBe(0);
    expect(expired.maxCombo).toBe(2);
    const next = collectCoin(expired);
    expect(next.combo).toBe(1);
    expect(next.maxCombo).toBe(2);
  });

  test("the eighth consecutive coin starts frenzy; later multiples cannot refresh an active frenzy", () => {
    const seventh = coins(7);
    expect(seventh.frenzyRemaining).toBe(0);
    const eighth = collectCoin(seventh);
    expect(eighth.combo).toBe(8);
    expect(eighth.frenzyRemaining).toBe(FRENZY_DURATION);
    expect(isInvulnerable(eighth)).toBe(true);
    const ninth = collectCoin(advanceArcade(eighth, 1));
    expect(ninth.frenzyRemaining).toBe(FRENZY_DURATION - 1);
    const sixteenth = coins(7, ninth);
    expect(sixteenth.combo).toBe(16);
    expect(sixteenth.frenzyRemaining).toBe(FRENZY_DURATION - 1);
    expect(sixteenth.maxCombo).toBe(16);
  });

  test("a future multiple of eight starts frenzy after the previous timer expires", () => {
    const sixteenth = coins(16);
    const seventeenth = collectCoin(advanceArcade(sixteenth, 2));
    const eighteenth = collectCoin(advanceArcade(seventeenth, 2));
    const nineteenth = collectCoin(advanceArcade(eighteenth, 2));
    expect(nineteenth.combo).toBe(19);
    expect(nineteenth.frenzyRemaining).toBe(0);
    const twentyThird = coins(4, nineteenth);
    expect(twentyThird.combo).toBe(23);
    expect(twentyThird.frenzyRemaining).toBe(0);
    const twentyFourth = collectCoin(twentyThird);
    expect(twentyFourth.combo).toBe(24);
    expect(twentyFourth.frenzyRemaining).toBe(FRENZY_DURATION);
    expect(isInvulnerable(twentyFourth)).toBe(true);
  });

  test("combo expiry and frenzy expiry run independently", () => {
    const expiredChain = advanceArcade(coins(8), COMBO_WINDOW);
    expect(expiredChain.combo).toBe(0);
    expect(expiredChain.maxCombo).toBe(8);
    expect(expiredChain.frenzyRemaining).toBe(FRENZY_DURATION - COMBO_WINDOW);
    expect(isInvulnerable(expiredChain)).toBe(true);
    const expiredFrenzy = advanceArcade(expiredChain, FRENZY_DURATION - COMBO_WINDOW);
    expect(expiredFrenzy.frenzyRemaining).toBe(0);
    expect(isInvulnerable(expiredFrenzy)).toBe(false);
  });

  test("magnet grants refresh their duration and large ticks clamp all timers to zero", () => {
    const active = grantMagnet(coins(8, triggerDash(freshArcade())));
    expect(active.magnetRemaining).toBe(MAGNET_DURATION);
    expect(advanceArcade(active, 1).magnetRemaining).toBe(MAGNET_DURATION - 1);
    expect(grantMagnet(advanceArcade(active, 1)).magnetRemaining).toBe(MAGNET_DURATION);
    const expired = advanceArcade(active, 100);
    expect(expired.combo).toBe(0);
    expect(expired.comboRemaining).toBe(0);
    expect(expired.frenzyRemaining).toBe(0);
    expect(expired.magnetRemaining).toBe(0);
    expect(expired.maxCombo).toBe(8);
    expect(expired.dash.kind).toBe("ready");
  });

  test("hits clear the chain and both power-ups while preserving max combo and dash", () => {
    const active = grantMagnet(coins(8, triggerDash(freshArcade())));
    const hit = registerHit(active);
    expect(hit.combo).toBe(0);
    expect(hit.comboRemaining).toBe(0);
    expect(hit.frenzyRemaining).toBe(0);
    expect(hit.magnetRemaining).toBe(0);
    expect(hit.maxCombo).toBe(8);
    expect(hit.dash).toBe(active.dash);
  });
});

describe("purity", () => {
  test("fresh runs own distinct state and dash objects", () => {
    const first = freshArcade();
    const second = freshArcade();
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.dash).not.toBe(first.dash);
  });

  test("all transformations leave a frozen input unchanged", () => {
    const state: Arcade = Object.freeze({
      dash: Object.freeze({ kind: "ready" as const }),
      combo: 7,
      comboRemaining: 2,
      frenzyRemaining: 1,
      magnetRemaining: 5,
      maxCombo: 10,
    });
    const before = structuredClone(state);
    for (const result of [advanceArcade(state, 0.1), triggerDash(state), collectCoin(state), registerHit(state), grantMagnet(state)]) {
      expect(result).not.toBe(state);
      expect(state).toEqual(before);
    }
  });

  test("nonpositive or invalid time never advances a run", () => {
    const state = grantMagnet(coins(8, triggerDash(freshArcade())));
    for (const dt of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(advanceArcade(state, dt)).toBe(state);
    }
  });
});
