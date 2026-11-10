'use strict';

const appPicker = document.querySelector('#app-picker');
const appName = document.querySelector('#app-name');
const appSheet = document.querySelector('#app-sheet');
const appSearch = document.querySelector('#app-search');
const appList = document.querySelector('#app-list');
const appCount = document.querySelector('#app-count');
const yearPicker = document.querySelector('#year-picker');
const yearSheet = document.querySelector('#year-sheet');
const headerYear = document.querySelector('#header-year');
const yearAppName = document.querySelector('#year-app-name');
let capture = document.querySelector('#capture');
const capturePlane = capture.parentElement;
const prototype = document.querySelector('#prototype');
const hotspots = document.querySelector('#hotspots');
const stage = document.querySelector('#stage');
const message = document.querySelector('#stage-message');
const retry = document.querySelector('#retry');
const screenLabel = document.querySelector('#screen-label');
const prototypeHint = document.querySelector('#prototype-hint');
const nextButton = document.querySelector('#prototype-next');
const citation = document.querySelector('#citation');
const stops = document.querySelector('#timeline-stops');
const announce = document.querySelector('#announce');
const backButton = document.querySelector('#prototype-back');
const resetButton = document.querySelector('#prototype-reset');
const mobbinLink = document.querySelector('.topbar .text-link');
const controls = document.querySelector('#prototype-controls');
const controlsSheet = document.querySelector('#controls-sheet');
const sheetControls = document.querySelector('#sheet-controls');
const sheetContext = document.querySelector('#sheet-context');
const flowToggle = document.querySelector('#flow-toggle');
const mobileLayout = matchMedia('(max-width: 719px)');
const imageCache = new Map();
const imageCacheLimit = 12;
const selections = new Map();
const captureSurface = document.querySelector('.museum');
const edgeSample = document.createElement('canvas');
const themeColor = document.querySelector('meta[name="theme-color"]');
const immersivePortrait = matchMedia('(max-width: 719px) and (orientation: portrait)');

let history = [];
let currentProduct = null;
let committed = null;
let pending = null;
let requestNumber = 0;
let primaryStep = null;
let lastControlFocus = null;
let failedSelection = null;

function closeAppPicker() {
  if (appSheet.open) appSheet.close();
}

function closeYearPicker() {
  if (yearSheet.open) yearSheet.close();
}

yearPicker.addEventListener('click', () => {
  closeAppPicker();
  closeControls();
  yearSheet.showModal();
  yearPicker.setAttribute('aria-expanded', 'true');
  stops.querySelector('[aria-pressed="true"]')?.focus();
});
yearSheet.addEventListener('close', () => yearPicker.setAttribute('aria-expanded', 'false'));
yearSheet.addEventListener('click', event => {
  if (event.target !== yearSheet) return;
  const bounds = yearSheet.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeYearPicker();
});
document.querySelector('#year-close').addEventListener('click', closeYearPicker);

function renderAppList() {
  const query = appSearch.value.trim().toLocaleLowerCase();
  const matches = history.filter(product => product.name.toLocaleLowerCase().includes(query));
  const fragment = document.createDocumentFragment();
  for (const product of [...matches].sort((a,b) => a.name.localeCompare(b.name))) {
    const button = element('button', 'app-choice');
    button.type = 'button';
    button.dataset.app = product.id;
    button.setAttribute('aria-pressed', String(currentProduct?.id === product.id));
    const info = element('span', 'app-choice-info');
    info.append(element('span', 'app-choice-name', product.name));
    const moments = product.moments;
    const years = moments.length === 1 ? monthLabel(moments[0]) : `${moments[0].date.slice(0,4)}–${moments.at(-1).date.slice(0,4)}`;
    const regions = new Set(moments.map(moment => moment.localeLabel).filter(Boolean));
    info.append(element('span', 'app-choice-detail', `${years} · ${moments.length} ${moments.length === 1 ? 'version' : 'versions'}${regions.size > 1 ? ' · regions vary' : ''}`));
    button.append(info, element('span', 'app-check', currentProduct?.id === product.id ? '✓' : ''));
    button.addEventListener('click', event => {
      closeAppPicker();
      chooseProduct(product.id, undefined, undefined, { focusScreen: event.detail === 0 });
    });
    fragment.append(button);
  }
  appList.replaceChildren(fragment);
  appCount.textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'app' : 'apps'}` : 'No matching apps';
}

appPicker.addEventListener('click', () => {
  closeControls();
  closeYearPicker();
  appSearch.value = '';
  renderAppList();
  appSheet.showModal();
  appPicker.setAttribute('aria-expanded', 'true');
  if (!mobileLayout.matches) appSearch.focus({ preventScroll: true });
});
appSheet.addEventListener('close', () => appPicker.setAttribute('aria-expanded', 'false'));
appSheet.addEventListener('click', event => {
  if (event.target !== appSheet) return;
  const bounds = appSheet.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeAppPicker();
});
document.querySelector('#app-close').addEventListener('click', closeAppPicker);
appSearch.addEventListener('input', renderAppList);

function isControlFocus(target) {
  return target && (controls.contains(target) || controlsSheet.contains(target) || target === flowToggle);
}

document.addEventListener('focusin', event => {
  lastControlFocus = isControlFocus(event.target) ? event.target : null;
});

function closeControls() {
  if (controlsSheet.open) controlsSheet.close();
}

function placeControls() {
  // A media rule can hide the focused control before its change event fires.
  const focused = document.activeElement === document.body ? lastControlFocus : document.activeElement;
  const needsFocus = isControlFocus(focused);
  closeControls();
  sheetControls.append(controls);
  if (needsFocus) {
    flowToggle.focus({ preventScroll: true });
  }
}

flowToggle.addEventListener('click', () => {
  closeAppPicker();
  closeYearPicker();
  controlsSheet.showModal();
  flowToggle.setAttribute('aria-expanded', 'true');
});
controlsSheet.addEventListener('close', () => flowToggle.setAttribute('aria-expanded', 'false'));
document.querySelector('#flow-close').addEventListener('click', closeControls);
controlsSheet.addEventListener('click', event => {
  if (event.target !== controlsSheet) return;
  const bounds = controlsSheet.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeControls();
});
mobileLayout.addEventListener('change', placeControls);
placeControls();

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function readRoute() {
  const [product, date, node] = location.hash.slice(1).split('/');
  return { product, date, node };
}

function monthLabel(moment) {
  return moment.dateLabel || new Intl.DateTimeFormat('en', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${moment.date}-01T00:00:00Z`));
}

function mobbinUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://mobbin.com' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function validNode(node) {
  return node && typeof node === 'object' &&
    /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(node.screenId) &&
    [node.label, node.image, node.alt].every(value => typeof value === 'string' && value.trim()) &&
    mobbinUrl(node.source) &&
    new URL(node.source).pathname.replace(/\/$/, '').endsWith(`/${node.screenId}`);
}

function normalizeHistory(data) {
  const list = Array.isArray(data) ? data : data?.products;
  if (!Array.isArray(list)) throw new Error('History must contain products.');
  const normalized = [];
  for (const product of list) {
    if (!product || product.platform !== 'ios' || !/^[a-z0-9-]+$/.test(product.id) ||
        typeof product.name !== 'string' || !product.name.trim() || !Array.isArray(product.moments)) continue;
    const moments = [];
    const dates = new Set();
    for (const moment of product.moments) {
      if (!moment || !/^\d{4}-(0[1-9]|1[0-2])$/.test(moment.date) ||
          dates.has(moment.date) || !mobbinUrl(moment.versionSource) ||
          !moment.nodes || typeof moment.nodes !== 'object') continue;
      const nodes = Object.fromEntries(Object.entries(moment.nodes).filter(([, node]) => validNode(node)));
      const order = moment.captureOrder;
      const branded = moment.entryEvidence;
      if (!Object.hasOwn(nodes, moment.entry) || !branded?.logoVisible || !branded.clearStart ||
          branded.screenId !== nodes[moment.entry].screenId || !Array.isArray(order) || order.length < 3 ||
          order[0] !== moment.entry || new Set(order).size !== order.length ||
          order.some((key, index) => !nodes[key] || index > 0 && !(nodes[order[index-1]].hotspots || []).some(h => h.to === key))) continue;
      moments.push({ ...moment, nodes });
      dates.add(moment.date);
    }
    moments.sort((a, b) => a.date.localeCompare(b.date));
    if (moments.length >= 3) normalized.push({ ...product, name: product.name.trim(), moments });
  }
  if (!normalized.length) throw new Error('No mobile captures are available.');
  return normalized;
}

function prepareCapture(node) {
  if (imageCache.has(node)) {
    const cached = imageCache.get(node);
    imageCache.delete(node);
    imageCache.set(node, cached);
    return cached;
  }
  const entry = { frame: null };
  entry.promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.draggable = false;
    image.referrerPolicy = 'no-referrer';
    image.onload = async () => {
      try {
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty capture');
        entry.frame = measureCapture(image, node);
        resolve(entry.frame);
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error('Image unavailable'));
    image.src = node.image;
  });
  imageCache.set(node, entry);
  while (imageCache.size > imageCacheLimit) imageCache.delete(imageCache.keys().next().value);
  entry.promise.catch(() => {
    if (imageCache.get(node) === entry) imageCache.delete(node);
  });
  return entry;
}

function setStatus(text, busy) {
  message.hidden = !text;
  message.textContent = text;
  stage.setAttribute('aria-busy', String(busy));
}

function updateThemeColor() {
  const color = immersivePortrait.matches && captureSurface.style.getPropertyValue('--capture-background');
  themeColor.content = color || '#0b0b0b';
}
immersivePortrait.addEventListener('change', updateThemeColor);

function measureCaptureDock(image, node, contentTop, contentHeight) {
  const width = image.naturalWidth;
  const bandHeight = Math.min(Math.floor(width * .2), Math.floor(contentHeight));
  let clearance = 0;
  let background = '';
  let ink = '';
  try {
    // Check every pixel in the candidate overlap, including tiny header marks.
    edgeSample.width = width;
    edgeSample.height = bandHeight;
    const context = edgeSample.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, Math.floor(contentTop), width, bandHeight, 0, 0, width, bandHeight);
    const pixels = context.getImageData(0, 0, width, bandHeight).data;
    const reference = Math.floor(width / 2) * 4;
    const color = [pixels[reference], pixels[reference + 1], pixels[reference + 2]];
    scan: for (; clearance < bandHeight; clearance++) {
      for (let i = clearance * width * 4; i < (clearance + 1) * width * 4; i += 4) {
        if (pixels[i + 3] < 250 || Math.abs(pixels[i] - color[0]) > 10 ||
            Math.abs(pixels[i + 1] - color[1]) > 10 || Math.abs(pixels[i + 2] - color[2]) > 10) break scan;
      }
    }
    if (clearance >= 4) {
      background = `#${color.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
      const linear = color.map(channel => {
        const value = channel / 255;
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      });
      const luminance = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
      ink = luminance > .179 ? '#080808' : '#fff';
    }
  } catch { clearance = 0; }
  const hotspotTops = (node.hotspots || []).map(h => h.rect?.[1]).filter(Number.isFinite);
  const firstHotspot = Math.min(...hotspotTops) * image.naturalHeight - contentTop;
  const safeOverlap = Math.max(0, Math.min(clearance, firstHotspot) - 3);
  return { dockAspect: width / (contentHeight - safeOverlap), background, ink };
}

function measureCapture(image, node) {
  const { naturalWidth: width, naturalHeight: height } = image;
  const footer = Number.isFinite(node.footerHeight) && node.footerHeight >= 0 && node.footerHeight < height ? node.footerHeight : 0;
  const top = Math.max(0, Number.isFinite(node.viewportInsets?.topRatio) ? node.viewportInsets.topRatio * width : Number(node.viewportInsets?.top) || 0);
  const bottom = Math.max(0, Number(node.viewportInsets?.bottom) || 0);
  const hasInsets = top + bottom < height - footer;
  const contentTop = hasInsets ? top : 0;
  const contentHeight = height - footer - (hasInsets ? top + bottom : 0);
  return { image, width, height, contentTop, contentHeight, ...measureCaptureDock(image, node, contentTop, contentHeight) };
}

function renderStatusBarRepair(repair, donor, width, height) {
  const ready = Boolean(donor && donor.width === width && donor.height === height);
  capturePlane.toggleAttribute('data-status-bar-repair', ready);
  if (!ready) return;

  const { offsetY, left, right } = repair;
  const inset = ([x, y, w, h]) => {
    const top = y + offsetY;
    return `inset(${100 * top / height}% ${100 * (width - x - w) / width}% ${100 * (height - top - h) / height}% ${100 * x / width}%)`;
  };
  const style = capturePlane.style;
  style.setProperty('--status-bar-donor', `url(${JSON.stringify(donor.image.src)})`);
  style.setProperty('--status-bar-shift', `${-100 * offsetY / height}%`);
  style.setProperty('--status-bar-left', inset(left));
  style.setProperty('--status-bar-right', inset(right));
}

function renderHotspots(selection) {
  const { moment, nodeKey } = selection;
  const fragment = document.createDocumentFragment();
  let primary = null;
  for (const hotspot of moment.nodes[nodeKey].hotspots || []) {
    const rect = hotspot.rect;
    if (!Object.hasOwn(moment.nodes, hotspot.to) || hotspot.to === nodeKey ||
        typeof hotspot.label !== 'string' || !hotspot.label.trim() ||
        !Array.isArray(rect) || rect.length !== 4 || !rect.every(Number.isFinite)) continue;
    const [x, y, width, height] = rect;
    if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) continue;
    const button = element('button', 'hotspot');
    button.type = 'button';
    button.setAttribute('aria-label', hotspot.label);
    button.title = hotspot.label;
    if (hotspot.primary) button.dataset.primary = 'true';
    button.style.position = 'absolute';
    button.style.left = `${x * 100}%`;
    button.style.top = `${y * 100}%`;
    button.style.width = `${width * 100}%`;
    button.style.height = `${height * 100}%`;
    if (!primary && hotspot.primary === true) primary = hotspot;
    button.addEventListener('click', event => {
      if (committed !== selection || pending) return;
      showSelection({ ...selection, nodeKey: hotspot.to, trail: [...selection.trail, nodeKey] }, {
        focusScreen: event.detail === 0,
      });
    });
    fragment.append(button);
  }
  hotspots.replaceChildren(fragment);
  return primary;
}

async function showSelection(selection, { fallback = false, focusScreen = false, motion = null } = {}) {
  closeControls();
  closeAppPicker();
  closeYearPicker();
  const request = ++requestNumber;
  const { nodes } = selection.moment;
  const node = nodes[selection.nodeKey];
  const prepared = prepareCapture(node);
  const repair = node.statusBarRepair;
  const donor = repair && Object.hasOwn(nodes, repair.donor) && prepareCapture(nodes[repair.donor]);
  pending = { ...selection, fallback, motion };
  failedSelection = null;
  window.dispatchEvent(new CustomEvent('captureloading', { detail: { motion } }));
  retry.hidden = true;
  capture.hidden = !committed;
  hotspots.hidden = true;
  nextButton.disabled = true;
  backButton.disabled = true;
  resetButton.disabled = true;
  setStatus('', true);
  const loadingTimer = setTimeout(() => {
    if (request === requestNumber) setStatus('Loading this capture…', true);
  }, 140);

  try {
    const frame = prepared.frame || await prepared.promise;
    const donorFrame = donor && (donor.frame || await donor.promise.catch(() => null));
    if (request !== requestNumber) return;

    const previousCapture = capture;
    const { image, width, height, contentTop, contentHeight, dockAspect, background, ink } = frame;
    if (previousCapture === image) motion = null;
    window.dispatchEvent(new CustomEvent('capturewillchange', { detail: { motion } }));
    committed = selection;
    pending = null;
    if (currentProduct !== selection.product) renderProductControls(selection.product);
    selections.set(selection.product.id, { date: selection.moment.date, nodeKey: selection.nodeKey, trail: [...selection.trail] });
    if (previousCapture !== image) {
      previousCapture.removeAttribute('id');
      previousCapture.replaceWith(image);
      capture = image;
      capture.id = 'capture';
      capture.className = 'capture';
    }
    capture.alt = node.alt;
    renderStatusBarRepair(repair, donorFrame, width, height);
    prototype.style.setProperty('--prototype-ratio', `${width} / ${height}`);
    prototype.style.setProperty('--dock-fit-aspect', String(dockAspect));
    captureSurface.style.setProperty('--capture-background', background);
    captureSurface.style.setProperty('--capture-foreground', ink);
    updateThemeColor();
    prototype.style.setProperty('--content-ratio', `${width} / ${contentHeight}`);
    prototype.style.setProperty('--content-aspect', String(width / contentHeight));
    stage.style.setProperty('--content-aspect', String(width / contentHeight));
    prototype.style.setProperty('--plane-height', `${height / contentHeight * 100}%`);
    prototype.style.setProperty('--plane-top', `${-contentTop / contentHeight * 100}%`);
    prototype.setAttribute('aria-label', `${selection.product.name}. ${node.label}. Captured ${monthLabel(selection.moment)}.`);
    screenLabel.textContent = node.label;
    headerYear.textContent = `Year ${selection.moment.date.slice(0, 4)}`;
    yearPicker.setAttribute('aria-label', `Change year. Current version ${monthLabel(selection.moment)}`);
    sheetContext.textContent = `${selection.product.name} · Captured ${monthLabel(selection.moment)}${selection.moment.localeLabel ? ' · '+selection.moment.localeLabel : ''}`;
    citation.href = node.source;
    citation.setAttribute('aria-label', `View this screen on Mobbin, ${selection.product.name}, ${monthLabel(selection.moment)}, opens in a new tab`);
    citation.hidden = false;
    mobbinLink.href = selection.moment.versionSource;
    mobbinLink.setAttribute('aria-label', `Explore this ${selection.product.name} version on Mobbin, opens in a new tab`);
    for (const button of stops.children) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.index) === selection.index));
    }
    primaryStep = renderHotspots(selection);
    prototypeHint.textContent = primaryStep ? `${primaryStep.label} →` : 'End of this preview';
    nextButton.disabled = !primaryStep;
    nextButton.setAttribute('aria-label', primaryStep ? primaryStep.label : 'End of this preview');
    capture.hidden = false;
    hotspots.hidden = false;
    backButton.disabled = !selection.trail.length;
    resetButton.disabled = selection.nodeKey === selection.moment.entry && !selection.trail.length;
    setStatus('', false);
    window.history.replaceState(null, '', `#${selection.product.id}/${selection.moment.date}/${selection.nodeKey}`);
    announce.textContent = `${selection.product.name}, ${monthLabel(selection.moment)}. ${fallback ? 'This screen is not included for this date. Showing ' : ''}${node.label}.`;
    if (focusScreen) prototype.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('capturechange', { detail: { selection, motion, previousCapture } }));
    const next = nextCaptureSelection(selection, history);
    const afterNext = nextCaptureSelection(next, history);
    // Use the same route for decoding as for the next two right swipes.
    const likely = [next.moment.nodes[next.nodeKey], afterNext.moment.nodes[afterNext.nodeKey]];
    for (const link of node.hotspots || []) likely.push(selection.moment.nodes[link.to]);
    for (const adjacent of [selection.index - 1, selection.index + 1]) {
      const other = selection.product.moments[adjacent];
      if (other) likely.push(other.nodes[other.entry]);
    }
    const nextProduct = history[(history.indexOf(selection.product) + 1) % history.length];
    if (nextProduct && nextProduct !== selection.product) {
      const saved = selections.get(nextProduct.id);
      const nextMoment = nextProduct.moments[momentIndex(nextProduct, saved?.date)];
      likely.push(nextMoment.nodes[nextMoment.entry]);
    }
    for (const destination of new Set(likely.filter(Boolean))) prepareCapture(destination);
  } catch {
    if (request !== requestNumber) return;
    failedSelection = pending;
    pending = null;
    if (committed) {
      hotspots.hidden = false;
      nextButton.disabled = !primaryStep;
      backButton.disabled = !committed.trail.length;
      resetButton.disabled = committed.nodeKey === committed.moment.entry && !committed.trail.length;
    }
    setStatus('This capture couldn’t load. Try again.', false);
    retry.hidden = false;
    window.dispatchEvent(new Event('captureerror'));
  } finally {
    clearTimeout(loadingTimer);
  }
}

function showMoment(index, focusScreen) {
  const moment = currentProduct.moments[index];
  if (!moment) return;
  showSelection({ product: currentProduct, moment, index, nodeKey: moment.entry, trail: [] }, { focusScreen });
}

function momentIndex(product, date) {
  const exact = product.moments.findIndex(moment => moment.date === date);
  if (exact >= 0) return exact;
  if (!/^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(date || '')) return 0;
  const prior = product.moments.findLastIndex(moment => moment.date <= date);
  return Math.max(0, prior);
}

function renderProductControls(product) {
  currentProduct = product;
  appName.textContent = product.name;
  appPicker.disabled = false;
  yearPicker.disabled = false;
  appPicker.setAttribute('aria-label', `${product.name}. Choose another app`);
  yearAppName.textContent = product.name;
  stops.replaceChildren();
  product.moments.forEach((moment, index) => {
    const button = element('button', 'year-option');
    const thumb = element('img', 'year-thumbnail');
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    thumb.src = moment.nodes[moment.entry].image;
    const date = element('span', 'year-option-date');
    date.append(element('span', 'year-option-title', monthLabel(moment)));
    if (moment.localeLabel) date.append(element('span', 'year-option-locale', moment.localeLabel));
    button.append(thumb, date, element('span', 'year-current', 'Current'));
    button.type = 'button';
    button.dataset.index = String(index);
    button.addEventListener('click', event => showMoment(index, event.detail === 0));
    stops.append(button);
  });
}

function chooseProduct(id, date, requestedNode, { focusScreen = false, motion = null } = {}) {
  const product = history.find(item => item.id === id) || history[0];
  const saved = selections.get(product.id);
  const index = momentIndex(product, date || saved?.date);
  const moment = product.moments[index];
  const preferred = requestedNode || moment.entry;
  const exists = Object.hasOwn(moment.nodes, preferred);
  const nodeKey = exists ? preferred : moment.entry;
  const trail = [];
  return showSelection({ product, moment, index, nodeKey, trail }, { fallback: !exists, focusScreen, motion });
}

async function initialize() {
  const request = ++requestNumber;
  retry.hidden = true;
  capture.hidden = true;
  hotspots.hidden = true;
  backButton.disabled = true;
  resetButton.disabled = true;
  setStatus('Loading captured history…', true);
  try {
    const response = await fetch('mobile-history.json', { redirect: 'error', cache: 'no-store' });
    if (!response.ok) throw new Error('History unavailable');
    const data = normalizeHistory(await response.json());
    if (request !== requestNumber) return;
    history = data;
    const route = readRoute();
    chooseProduct(route.product, route.date, route.node);
  } catch {
    if (request !== requestNumber) return;
    setStatus('The captured history couldn’t load.', false);
    retry.hidden = false;
  }
}

function advanceSelection(event) {
  if (!committed || pending || !primaryStep) return;
  showSelection({ ...committed, nodeKey: primaryStep.to, trail: [...committed.trail, committed.nodeKey] }, { focusScreen: event.detail === 0 });
}
nextButton.addEventListener('click', advanceSelection);
backButton.addEventListener('click', event => {
  if (!committed || pending || !committed.trail.length) return;
  showSelection({ ...committed, nodeKey: committed.trail.at(-1), trail: committed.trail.slice(0, -1) }, { focusScreen: event.detail === 0 });
});
resetButton.addEventListener('click', event => {
  if (!committed || pending) return;
  showSelection({ ...committed, nodeKey: committed.moment.entry, trail: [] }, { focusScreen: event.detail === 0 });
});
retry.addEventListener('click', () => failedSelection ? showSelection(failedSelection, { fallback: failedSelection.fallback }) : initialize());
window.addEventListener('hashchange', () => {
  if (!history.length) return;
  const route = readRoute();
  chooseProduct(route.product, route.date, route.node);
});

initialize();
