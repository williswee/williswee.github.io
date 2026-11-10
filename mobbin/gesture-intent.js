'use strict';

// Resolve the final movement, so an early wobble cannot choose the wrong action.
function resolveSwipeIntent(dx, dy, elapsed, cancelled = false) {
  const x = Math.abs(dx), y = Math.abs(dy);
  const axis = x >= 8 && x > y * 1.08 ? 'x' : y >= 8 && y > x * 1.25 ? 'y' : null;
  const distance = axis === 'x' ? x : y;
  const threshold = axis === 'x' ? 18 : 32;
  const flick = axis === 'x' && x >= 14 && elapsed <= 200 && x / Math.max(1, elapsed) >= .35;
  return {
    axis,
    commit: !cancelled && Boolean(axis) && (distance >= threshold || flick),
    suppressClick: Math.max(x, y) >= 8,
  };
}

function nextCaptureSelection(selection, catalog) {
  const order = selection.moment.captureOrder;
  const nodeKey = order[order.indexOf(selection.nodeKey) + 1];
  if (nodeKey) return { ...selection, nodeKey, trail: [...selection.trail, selection.nodeKey] };

  let { product, index } = selection;
  index += 1;
  if (index === product.moments.length) {
    product = catalog[(catalog.indexOf(product) + 1) % catalog.length];
    index = 0;
  }
  const moment = product.moments[index];
  return { product, moment, index, nodeKey: moment.entry, trail: [] };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { resolveSwipeIntent, nextCaptureSelection };
