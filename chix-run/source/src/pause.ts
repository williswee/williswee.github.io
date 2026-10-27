interface PauseEffects {
  canPause(): boolean;
  setEnginePaused(value: boolean): void;
  clearInput(): void;
  onChange(value: boolean): void;
  focusGame(): void;
}

/** Pause preserves the current scene and all its timers. Only resume restores play. */
export function createRunPause(effects: PauseEffects) {
  let paused = false;
  function set(value: boolean) {
    if (paused === value) return;
    paused = value;
    effects.setEnginePaused(value);
    if (value) effects.clearInput();
    effects.onChange(value);
  }
  function pause() {
    if (effects.canPause()) set(true);
  }
  function resume() {
    if (!paused || !effects.canPause()) return;
    set(false);
    effects.focusGame();
  }
  return {
    get paused() { return paused; },
    pause,
    resume,
    toggle() { if (paused) resume(); else pause(); },
    reset() { set(false); },
  };
}
