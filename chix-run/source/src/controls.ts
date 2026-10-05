export type ControlRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type TouchControlLayout = {
  readonly left: ControlRect;
  readonly dash: ControlRect;
  readonly right: ControlRect;
  readonly top: number;
  readonly barTop: number;
  readonly helpY: number;
  readonly playerY: number;
  readonly fontSize: number;
  readonly helpFontSize: number;
  readonly compact: boolean;
};

/** Canvas coordinates shared by the drawn buttons and their pointer targets. */
export function touchControlLayout(renderedWidth: number): TouchControlLayout {
  const width = Number.isFinite(renderedWidth) && renderedWidth > 0 ? renderedWidth : 480;
  const scale = 480 / width;
  const height = Math.max(88, 48 * scale);
  const top = 702 - height;
  const fontSize = Math.max(26, 15 * scale);
  const helpFontSize = Math.max(17, 13 * scale);
  const barTop = top - helpFontSize - 16;
  return {
    left: { x: 8, y: top, width: 144, height },
    dash: { x: 160, y: top, width: 160, height },
    right: { x: 328, y: top, width: 144, height },
    top,
    barTop,
    helpY: barTop + helpFontSize / 2 + 6,
    playerY: barTop - 42,
    fontSize,
    helpFontSize,
    compact: width < 230,
  };
}
