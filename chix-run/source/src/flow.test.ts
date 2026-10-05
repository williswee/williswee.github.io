import { describe, expect, test } from "bun:test";
import { step, type FlowEvent, type Phase } from "./flow";

describe("step", () => {
  const menu: Phase = Object.freeze({ kind: "menu" });
  const playing: Phase = Object.freeze({ kind: "playing", score: 7, lives: 3 });
  const gameover: Phase = Object.freeze({ kind: "gameover", score: 7 });

  const cases: ReadonlyArray<{
    phase: Phase;
    event: FlowEvent;
    expected: Phase;
    unchanged: boolean;
  }> = [
    { phase: menu, event: { type: "start" }, expected: { kind: "playing", score: 0, lives: 3 }, unchanged: false },
    { phase: menu, event: { type: "coin" }, expected: menu, unchanged: true },
    { phase: menu, event: { type: "hit" }, expected: menu, unchanged: true },
    { phase: menu, event: { type: "restart" }, expected: menu, unchanged: true },
    { phase: playing, event: { type: "start" }, expected: playing, unchanged: true },
    { phase: playing, event: { type: "coin" }, expected: { kind: "playing", score: 8, lives: 3 }, unchanged: false },
    { phase: playing, event: { type: "hit" }, expected: { kind: "playing", score: 7, lives: 2 }, unchanged: false },
    { phase: playing, event: { type: "restart" }, expected: playing, unchanged: true },
    { phase: gameover, event: { type: "start" }, expected: gameover, unchanged: true },
    { phase: gameover, event: { type: "coin" }, expected: gameover, unchanged: true },
    { phase: gameover, event: { type: "hit" }, expected: gameover, unchanged: true },
    { phase: gameover, event: { type: "restart" }, expected: { kind: "playing", score: 0, lives: 3 }, unchanged: false },
  ];

  for (const { phase, event, expected, unchanged } of cases) {
    test(`${phase.kind} + ${event.type}`, () => {
      const before = { ...phase };
      const result = step(phase, Object.freeze(event));
      expect(result).toEqual(expected);
      expect(phase).toEqual(before);
      if (unchanged) expect(result).toBe(phase);
      else expect(result).not.toBe(phase);
    });
  }

  test("three hits end the run and preserve the collected score", () => {
    let phase = step(menu, { type: "start" });
    phase = step(step(phase, { type: "coin" }), { type: "coin" });
    phase = step(phase, { type: "hit" });
    expect(phase).toEqual({ kind: "playing", score: 2, lives: 2 });
    phase = step(phase, { type: "hit" });
    expect(phase).toEqual({ kind: "playing", score: 2, lives: 1 });
    phase = step(phase, { type: "hit" });
    expect(phase).toEqual({ kind: "gameover", score: 2 });
    expect("lives" in phase).toBe(false);
    expect(step(phase, { type: "hit" })).toBe(phase);
    expect(step(phase, { type: "coin" })).toBe(phase);
  });

  test("each restart produces a fresh run", () => {
    const first = step(gameover, { type: "restart" });
    const second = step(gameover, { type: "restart" });
    expect(first).toEqual({ kind: "playing", score: 0, lives: 3 });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });
});
