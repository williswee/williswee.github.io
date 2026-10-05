export const DASH_DURATION = 0.4;
export const DASH_COOLDOWN = 2.4;
export const COMBO_WINDOW = 3;
export const FRENZY_DURATION = 6;
export const MAGNET_DURATION = 7;

export type Dash =
  | { readonly kind: "ready" }
  | { readonly kind: "dashing"; readonly remaining: number }
  | { readonly kind: "cooldown"; readonly remaining: number };

/** Auxiliary run mechanics. Score and lives remain exclusively in flow.ts. */
export type Arcade = {
  readonly dash: Dash;
  readonly combo: number;
  readonly comboRemaining: number;
  readonly frenzyRemaining: number;
  readonly magnetRemaining: number;
  readonly maxCombo: number;
};

export function freshArcade(): Arcade {
  return {
    dash: { kind: "ready" },
    combo: 0,
    comboRemaining: 0,
    frenzyRemaining: 0,
    magnetRemaining: 0,
    maxCombo: 0,
  };
}

function assertNever(value: never): never {
  throw new Error(`Unexpected dash state: ${JSON.stringify(value)}`);
}

function advanceDash(dash: Dash, dt: number): Dash {
  switch (dash.kind) {
    case "ready":
      return dash;
    case "dashing":
      if (dt < dash.remaining) {
        return { kind: "dashing", remaining: dash.remaining - dt };
      }
      if (dt >= dash.remaining + DASH_COOLDOWN) return { kind: "ready" };
      return {
        kind: "cooldown",
        remaining: DASH_COOLDOWN - (dt - dash.remaining),
      };
    case "cooldown":
      return dt >= dash.remaining
        ? { kind: "ready" }
        : { kind: "cooldown", remaining: dash.remaining - dt };
    default:
      return assertNever(dash);
  }
}

/** Advance every timer in seconds, including time left after a dash ends. */
export function advanceArcade(state: Arcade, dt: number): Arcade {
  if (!Number.isFinite(dt) || dt <= 0) return state;
  const comboRemaining = Math.max(0, state.comboRemaining - dt);
  return {
    ...state,
    dash: advanceDash(state.dash, dt),
    combo: comboRemaining > 0 ? state.combo : 0,
    comboRemaining,
    frenzyRemaining: Math.max(0, state.frenzyRemaining - dt),
    magnetRemaining: Math.max(0, state.magnetRemaining - dt),
  };
}

export function triggerDash(state: Arcade): Arcade {
  if (state.dash.kind !== "ready") return state;
  return { ...state, dash: { kind: "dashing", remaining: DASH_DURATION } };
}

export function collectCoin(state: Arcade): Arcade {
  const combo = state.combo + 1;
  return {
    ...state,
    combo,
    comboRemaining: COMBO_WINDOW,
    frenzyRemaining: combo % 8 === 0 && state.frenzyRemaining <= 0
      ? FRENZY_DURATION
      : state.frenzyRemaining,
    maxCombo: Math.max(state.maxCombo, combo),
  };
}

export function registerHit(state: Arcade): Arcade {
  return {
    ...state,
    combo: 0,
    comboRemaining: 0,
    frenzyRemaining: 0,
    magnetRemaining: 0,
  };
}

export function grantMagnet(state: Arcade): Arcade {
  return { ...state, magnetRemaining: MAGNET_DURATION };
}

export function isInvulnerable(state: Arcade): boolean {
  return state.dash.kind === "dashing" || state.frenzyRemaining > 0;
}

/** A normalized HUD value: ready is 1, dashing is 0, cooldown fills toward 1. */
export function dashReadyProgress(state: Arcade): number {
  switch (state.dash.kind) {
    case "ready":
      return 1;
    case "dashing":
      return 0;
    case "cooldown":
      return Math.max(0, Math.min(1, 1 - state.dash.remaining / DASH_COOLDOWN));
    default:
      return assertNever(state.dash);
  }
}
