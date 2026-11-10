'use strict';

const feedNextScreen = document.querySelector('#feed-next-screen');
const feedNextLabel = document.querySelector('#feed-next-label');
const sheetNextScreen = document.querySelector('#sheet-next-screen');
const sheetNextLabel = sheetNextScreen.querySelector('span');
const screenProgress = document.querySelector('#screen-progress');
const feedFeedback = document.querySelector('#feed-feedback');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let transition = null;
let settleAnimation = null;
let departingFrame = null;
let queuedMove = null;
let swipe = null;
let suppressClick = false;
let feedbackTimer;

function isZoomed() { return (window.visualViewport?.scale || 1) > 1.02; }
function updateZoom() {
  document.body.classList.toggle('is-zoomed', isZoomed());
  if (isZoomed()) {
    queuedMove = null;
    cancelSwipe();
    clearMotion();
  }
}
window.visualViewport?.addEventListener('resize', updateZoom);
updateZoom();

function captureOrder(selection) { return selection?.moment.captureOrder || []; }

function renderFeed() {
  if (!committed) return;
  const order = captureOrder(committed);
  const index = order.indexOf(committed.nodeKey);
  prototype.setAttribute('aria-label', `${committed.product.name}. ${committed.moment.nodes[committed.nodeKey].label}. Captured ${monthLabel(committed.moment)}. Screen ${index + 1} of ${order.length}.`);
  const next = nextCaptureSelection(committed, history);
  const boundary = next.product !== committed.product ? 'app' : next.moment !== committed.moment ? 'year' : 'screen';
  const previewInput = primaryStep && (primaryStep.kind === 'captured-input-state' || /^(Preview |View captured |Next captured )/.test(primaryStep.label));
  const label = boundary === 'app' ? 'Next app' : boundary === 'year' ? 'Next year' : previewInput ? 'Preview' : 'Next';
  const accessibleLabel = boundary === 'screen' ? previewInput ? primaryStep.label : 'Next screen' : label;
  sheetNextScreen.disabled = false;
  sheetNextLabel.textContent = boundary === 'screen' ? 'Next screen' : label;
  feedNextScreen.disabled = false;
  feedNextLabel.textContent = label;
  feedNextScreen.dataset.destination = boundary;
  feedNextScreen.setAttribute('aria-label', accessibleLabel);
  feedNextScreen.title = `${accessibleLabel} · Swipe left`;
  screenProgress.replaceChildren(...order.map((_, i) => {
    const segment = document.createElement('span');
    segment.dataset.state = i < index ? 'seen' : i === index ? 'current' : 'future';
    return segment;
  }));
}

function clearMotion() {
  const active = transition;
  transition = null;
  for (const animation of active?.animations || []) animation.cancel();
  active?.layer.remove();
  settleAnimation?.cancel();
  settleAnimation = null;
  prototype.style.transform = '';
  delete stage.dataset.dragging;
}

function requestMove(move) {
  if (!committed) return false;
  if (pending || transition) {
    queuedMove = move;
    return true;
  }
  queuedMove = null;
  return move();
}

function drainMove() {
  if (!queuedMove || pending || transition || swipe) return;
  const move = queuedMove;
  queuedMove = null;
  if (!appSheet.open && !yearSheet.open && !controlsSheet.open && !isZoomed()) move();
}

window.addEventListener('captureloading', event => {
  if (swipe) abandonSwipe();
  clearTapHints();
  clearTimeout(feedbackTimer);
  feedFeedback.hidden = true;
  if (!event.detail.motion) {
    queuedMove = null;
    clearMotion();
  }
});

window.addEventListener('capturewillchange', event => {
  if (!event.detail.motion || !committed || reducedMotion.matches || typeof prototype.animate !== 'function') return;
  // Freeze the source layout before applying the incoming capture's ratio and insets.
  const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = prototype;
  const bounds = prototype.getBoundingClientRect();
  const stageBounds = stage.getBoundingClientRect();
  const frame = document.createElement('div');
  frame.className = 'outgoing-capture';
  frame.style.cssText = prototype.style.cssText;
  Object.assign(frame.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, transform: '' });
  const plane = capture.parentElement.cloneNode(false);
  frame.append(plane);

  const layer = document.createElement('div');
  layer.className = 'outgoing-stage';
  layer.setAttribute('aria-hidden', 'true');
  layer.append(frame);
  if (immersivePortrait.matches) layer.style.backgroundColor = getComputedStyle(captureSurface).backgroundColor;
  departingFrame = { layer, plane, width, x: bounds.left - stageBounds.left - left, y: bounds.top - stageBounds.top - top };
});

function slideCapture(motion, previousCapture, source) {
  const { layer, plane, width, x, y } = source;
  plane.append(previousCapture);
  stage.append(layer);
  const horizontal = motion.axis === 'x';
  const distance = horizontal ? immersivePortrait.matches ? stage.clientWidth : Math.max(width, prototype.offsetWidth) : stage.clientHeight;
  const dx = horizontal ? distance * motion.direction : 0;
  const dy = horizontal ? 0 : distance * motion.direction;
  const translate = (tx, ty) => `translate3d(${tx}px, ${ty}px, 0)`;
  const timing = { duration: 240, easing: 'cubic-bezier(.2,.75,.25,1)' };
  const animations = [
    prototype.animate([{ transform: translate(x - dx, y - dy) }, { transform: translate(0, 0) }], timing),
    layer.animate([{ transform: translate(x, y) }, { transform: translate(dx, dy) }], timing),
  ];
  const active = { layer, animations };
  transition = active;
  Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
    if (transition !== active) return;
    layer.remove();
    transition = null;
    drainMove();
  });
}

window.addEventListener('capturechange', event => {
  const source = departingFrame;
  departingFrame = null;
  clearMotion();
  if (source) slideCapture(event.detail.motion, event.detail.previousCapture, source);
  renderFeed();
  if (!transition) queueMicrotask(drainMove);
});

window.addEventListener('captureerror', () => {
  queuedMove = null;
  departingFrame = null;
  clearMotion();
  renderFeed();
});

function moveCompany(direction, focusScreen = false) {
  if (history.length < 2) return false;
  return requestMove(() => {
    const index = history.indexOf(committed.product);
    const product = history[(index + direction + history.length) % history.length];
    chooseProduct(product.id, undefined, undefined, { focusScreen, motion: { axis: 'y', direction: -direction } });
    return true;
  });
}

function moveScreen(step, focusScreen = false) {
  return requestMove(() => {
    const context = committed;
    const previous = context.trail.at(-1);
    if (step < 0 && !previous) {
      announce.textContent = feedFeedback.textContent = 'Start of this version';
      feedFeedback.hidden = false;
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => { feedFeedback.hidden = true; }, 2200);
      return false;
    }
    const next = step > 0
      ? nextCaptureSelection(context, history)
      : { ...context, nodeKey: previous, trail: context.trail.slice(0, -1) };
    showSelection(next, { focusScreen, motion: { axis: 'x', direction: -step } });
    return true;
  });
}

document.querySelector('#sheet-next-app').addEventListener('click', event => moveCompany(1, event.detail === 0));
feedNextScreen.addEventListener('click', event => moveScreen(1, event.detail === 0));
sheetNextScreen.addEventListener('click', event => moveScreen(1, event.detail === 0));

function rebound() {
  const from = prototype.style.transform;
  prototype.style.transform = '';
  settleAnimation?.cancel();
  if (!from || reducedMotion.matches || typeof prototype.animate !== 'function') return;
  settleAnimation = prototype.animate([{ transform: from }, { transform: 'translate(0,0)' }], { duration: 140, easing: 'ease-out' });
}

function beginSwipe(id, x, y, type) {
  suppressClick = false;
  if (!committed || isZoomed()) return;
  const canDrag = !pending && !transition;
  if (canDrag) clearMotion();
  swipe = { id, x, y, type, canDrag, moved: false, claimed: false, started: performance.now() };
}

function positionCapture(axis, dx, dy) {
  const delta = Math.max(-110, Math.min(110, axis === 'x' ? dx : dy));
  prototype.style.transform = `translate${axis.toUpperCase()}(${delta}px)`;
}

function updateSwipe(x, y) {
  const dx = x - swipe.x;
  const dy = y - swipe.y;
  const intent = resolveSwipeIntent(dx, dy, performance.now() - swipe.started);
  swipe.moved ||= intent.suppressClick;
  if (!intent.axis) return;
  swipe.claimed = true;
  if (swipe.canDrag && !reducedMotion.matches) {
    stage.dataset.dragging = 'true';
    positionCapture(intent.axis, dx, dy);
  }
}

function finishSwipe(event, x, y, cancelled = false) {
  const finished = swipe;
  abandonSwipe();
  const dx = x - finished.x;
  const dy = y - finished.y;
  const intent = resolveSwipeIntent(dx, dy, performance.now() - finished.started, cancelled);
  suppressClick = finished.moved || intent.suppressClick;
  delete stage.dataset.dragging;
  if (finished.type === 'touch' && suppressClick && event.cancelable) event.preventDefault();
  if (intent.commit) {
    if (finished.canDrag && !reducedMotion.matches) positionCapture(intent.axis, dx, dy);
    const moved = intent.axis === 'y' ? moveCompany(dy < 0 ? 1 : -1) : moveScreen(dx < 0 ? 1 : -1);
    if (!moved && finished.canDrag) rebound();
  } else if (finished.canDrag) rebound();
  drainMove();
}

function abandonSwipe() {
  swipe?.touchEvents?.abort();
  swipe = null;
  suppressClick = true;
}

function cancelSwipe() {
  if (!swipe) return;
  const { canDrag } = swipe;
  abandonSwipe();
  queuedMove = null;
  if (canDrag) clearMotion();
}

// Touch Events own the phone gesture. Pointer Events handle desktop drags.
stage.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) { cancelSwipe(); return; }
  const touch = event.touches[0];
  suppressClick = false;
  if (event.target.closest('a, input, dialog, #retry')) return;
  beginSwipe(touch.identifier, touch.clientX, touch.clientY, 'touch');
  if (!swipe || event.target === stage) return;
  // An ongoing touch keeps its original target even if the capture is removed.
  swipe.touchEvents = new AbortController();
  const { signal } = swipe.touchEvents;
  for (const type of ['touchmove', 'touchend', 'touchcancel']) {
    event.target.addEventListener(type, onDetachedTouch, { passive: false, signal });
  }
}, { passive: true });
window.addEventListener('touchstart', event => {
  if (event.touches.length > 1 && swipe?.type === 'touch') cancelSwipe();
}, { passive: true });
function onTouchMove(event) {
  if (swipe?.type !== 'touch') return;
  if (event.touches.length !== 1 || isZoomed()) { cancelSwipe(); return; }
  const touch = event.touches[0];
  if (touch.identifier !== swipe.id) return;
  updateSwipe(touch.clientX, touch.clientY);
  if (swipe.moved && event.cancelable) event.preventDefault();
}
function onTouchEnd(event) {
  if (swipe?.type !== 'touch') return;
  const touch = Array.from(event.changedTouches).find(point => point.identifier === swipe.id);
  if (touch) finishSwipe(event, touch.clientX, touch.clientY, event.touches.length > 0 || isZoomed());
}

function onTouchCancel() {
  if (swipe?.type === 'touch') cancelSwipe();
}

function onDetachedTouch(event) {
  if (stage.contains(event.target)) return;
  if (event.type === 'touchmove') onTouchMove(event);
  if (event.type === 'touchend') onTouchEnd(event);
  if (event.type === 'touchcancel') onTouchCancel();
}

// Register before contact so the browser sees a cancelable stage gesture from the start.
stage.addEventListener('touchmove', onTouchMove, { passive: false });
stage.addEventListener('touchend', onTouchEnd, { passive: false });
stage.addEventListener('touchcancel', onTouchCancel);

stage.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch' || event.sourceCapabilities?.firesTouchEvents ||
      !event.isPrimary || event.button !== 0 || event.target.closest('a, input, dialog, #retry')) return;
  beginSwipe(event.pointerId, event.clientX, event.clientY, 'pointer');
});
stage.addEventListener('pointermove', event => {
  if (swipe?.type !== 'pointer' || swipe.id !== event.pointerId) return;
  updateSwipe(event.clientX, event.clientY);
  if (!swipe.claimed) return;
  if (!stage.hasPointerCapture(event.pointerId)) stage.setPointerCapture(event.pointerId);
  if (event.cancelable) event.preventDefault();
});
window.addEventListener('pointerup', event => {
  if (swipe?.type === 'pointer' && swipe.id === event.pointerId) finishSwipe(event, event.clientX, event.clientY);
});
window.addEventListener('pointercancel', event => {
  if (swipe?.type === 'pointer' && swipe.id === event.pointerId) cancelSwipe();
});
window.addEventListener('blur', cancelSwipe);
stage.addEventListener('click', event => {
  if (!suppressClick || event.detail === 0 && !event.pointerType && !event.sourceCapabilities?.firesTouchEvents) return;
  suppressClick = false;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

function clearTapHints() {
  hotspots.querySelectorAll('.is-guided').forEach(button => button.classList.remove('is-guided'));
}

stage.addEventListener('click', event => {
  if (pending || !committed || event.target.closest('button, a')) return;
  const targets = [...hotspots.querySelectorAll(primaryStep ? '[data-primary="true"]' : '.hotspot')];
  clearTapHints();
  targets.forEach(button => button.classList.add('is-guided'));
  const destination = feedNextScreen.dataset.destination;
  const forwardHint = `Swipe left for the next ${destination}`;
  announce.textContent = primaryStep ? `Tap ${primaryStep.label} to continue.` : forwardHint;
  if (!primaryStep) {
    clearTimeout(feedbackTimer);
    feedFeedback.textContent = forwardHint;
    feedFeedback.hidden = false;
  }
});

let wheelX = 0, wheelY = 0, wheelLatched = false, wheelTimer;
stage.addEventListener('wheel', event => {
  if (event.ctrlKey || isZoomed() || appSheet.open || yearSheet.open || controlsSheet.open) return;
  event.preventDefault();
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => { wheelX = wheelY = 0; wheelLatched = false; }, 180);
  if (wheelLatched) return;
  const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
  wheelX += event.deltaX * scale;
  wheelY += event.deltaY * scale;
  if (Math.max(Math.abs(wheelX), Math.abs(wheelY)) < 65) return;
  if (Math.abs(wheelY) > Math.abs(wheelX) * 1.35) { wheelLatched = true; moveCompany(wheelY > 0 ? 1 : -1); }
  else if (Math.abs(wheelX) > Math.abs(wheelY) * 1.35) {
    wheelLatched = true;
    // Natural scrolling reports a positive horizontal delta for a leftward swipe.
    moveScreen(wheelX > 0 ? 1 : -1);
  }
}, { passive: false });

document.addEventListener('keydown', event => {
  if (event.altKey || event.metaKey || event.ctrlKey || event.repeat || isZoomed() || appSheet.open || yearSheet.open || controlsSheet.open || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const actions = { ArrowUp: () => moveCompany(1, true), ArrowDown: () => moveCompany(-1, true), ArrowRight: () => moveScreen(1, true), ArrowLeft: () => moveScreen(-1, true) };
  if (!actions[event.key]) return;
  event.preventDefault();
  actions[event.key]();
});
renderFeed();
