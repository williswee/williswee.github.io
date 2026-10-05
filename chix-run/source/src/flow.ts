/** The only legal states of a Chix Run session. */
export type Phase =
  | { readonly kind: "menu" }
  | { readonly kind: "playing"; readonly score: number; readonly lives: number }
  | { readonly kind: "gameover"; readonly score: number };

export type FlowEvent =
  | { readonly type: "start" }
  | { readonly type: "coin" }
  | { readonly type: "hit" }
  | { readonly type: "restart" };

function freshGame(): Extract<Phase, { kind: "playing" }> {
  return { kind: "playing", score: 0, lives: 3 };
}

function assertNever(value: never): never {
  throw new Error(`Unexpected flow variant: ${JSON.stringify(value)}`);
}

/** Pure state transitions. Invalid events preserve the original state reference. */
export function step(phase: Phase, event: FlowEvent): Phase {
  switch (phase.kind) {
    case "menu":
      switch (event.type) {
        case "start":
          return freshGame();
        case "coin":
        case "hit":
        case "restart":
          return phase;
        default:
          return assertNever(event);
      }

    case "playing":
      switch (event.type) {
        case "coin":
          return { ...phase, score: phase.score + 1 };
        case "hit":
          return phase.lives <= 1
            ? { kind: "gameover", score: phase.score }
            : { ...phase, lives: phase.lives - 1 };
        case "start":
        case "restart":
          return phase;
        default:
          return assertNever(event);
      }

    case "gameover":
      switch (event.type) {
        case "restart":
          return freshGame();
        case "start":
        case "coin":
        case "hit":
          return phase;
        default:
          return assertNever(event);
      }

    default:
      return assertNever(phase);
  }
}
