import { DEFAULT_MODULE_LAYOUT, DEFAULT_SHORTCUTS, MODULES, ModuleLayout, Shortcut } from '../config';

type SearchEngine = 'google' | 'duckduckgo' | 'brave';
type Preferences = {
  searchEngine: SearchEngine;
  preferredDark: string;
  preferredLight: string;
  hiddenModules: string[];
  moduleLayout: Record<string, ModuleLayout>;
  layoutComputed: boolean;
};

const STORAGE_PREFS = 'custom_startpage_preferences_v1';
const STORAGE_SHORTCUTS = 'custom_startpage_shortcuts_v1';

const SEARCH_ENGINES: Record<SearchEngine, { label: string; url: string }> = {
  google: { label: 'Google', url: 'https://www.google.com/search?q=' },
  duckduckgo: { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  brave: { label: 'Brave Search', url: 'https://search.brave.com/search?q=' }
};

const defaults: Preferences = {
  searchEngine: 'google',
  preferredDark: 'dracula',
  preferredLight: 'alucard',
  hiddenModules: [],
  moduleLayout: structuredClone(DEFAULT_MODULE_LAYOUT),
  layoutComputed: false
};

const MOBILE_QUERY = window.matchMedia('(max-width:850px)');
const MODULE_MIN_WIDTH = 260;
const MODULE_MIN_HEIGHT = 120;

let prefs = loadPrefs();
let shortcuts = loadShortcuts();
let editingLayout = false;

function isMobileLayout(): boolean { return MOBILE_QUERY.matches; }
function clamp(value: number, min: number, max: number): number { return Math.min(Math.max(value, min), Math.max(min, max)); }

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS);
    if (!raw) return structuredClone(defaults);
    const saved = JSON.parse(raw) as Partial<Preferences>;
    const mergedLayout: Record<string, ModuleLayout> = {};
    Object.keys(DEFAULT_MODULE_LAYOUT).forEach(id => {
      const savedLayout = saved.moduleLayout?.[id];
      mergedLayout[id] = savedLayout && typeof savedLayout.xFrac === 'number'
        ? { ...DEFAULT_MODULE_LAYOUT[id], ...savedLayout }
        : structuredClone(DEFAULT_MODULE_LAYOUT[id]);
    });
    return {
      ...defaults,
      ...saved,
      searchEngine: saved.searchEngine && SEARCH_ENGINES[saved.searchEngine] ? saved.searchEngine : defaults.searchEngine,
      hiddenModules: Array.isArray(saved.hiddenModules) ? saved.hiddenModules : [],
      moduleLayout: mergedLayout,
      layoutComputed: saved.layoutComputed === true
    };
  } catch { return structuredClone(defaults); }
}

function loadShortcuts(): Shortcut[] {
  try {
    const raw = localStorage.getItem(STORAGE_SHORTCUTS);
    if (!raw) return structuredClone(DEFAULT_SHORTCUTS);
    const parsed = JSON.parse(raw) as Shortcut[];
    return Array.isArray(parsed) ? parsed : structuredClone(DEFAULT_SHORTCUTS);
  } catch { return structuredClone(DEFAULT_SHORTCUTS); }
}

function savePrefs(): void { localStorage.setItem(STORAGE_PREFS, JSON.stringify(prefs)); }
function saveShortcuts(): void { localStorage.setItem(STORAGE_SHORTCUTS, JSON.stringify(shortcuts)); }

function showToast(text: string): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 1700);
}

function applyTheme(): void {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? prefs.preferredDark : prefs.preferredLight;
}

function initClock(): void {
  const tick = () => {
    const now = new Date();
    const h = document.getElementById('clock-hours');
    const s = document.getElementById('clock-seconds');
    const day = document.getElementById('clock-day');
    const date = document.getElementById('clock-date');
    if (h) h.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (s) s.textContent = ':' + now.toLocaleTimeString('fr-FR', { second: '2-digit' });
    if (day) day.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long' });
    if (date) date.textContent = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  tick(); window.setInterval(tick, 1000);
}

function initSearch(): void {
  const form = document.getElementById('search-form') as HTMLFormElement | null;
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (!form || !input) return;
  updateSearchUI();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    if (/^https?:\/\//i.test(value)) { window.location.href = value; return; }
    if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value) && !value.includes(' ')) { window.location.href = 'https://' + value; return; }
    window.location.href = SEARCH_ENGINES[prefs.searchEngine].url + encodeURIComponent(value);
  });
  document.addEventListener('keydown', event => {
    if (event.altKey && event.code === 'Space') { event.preventDefault(); input.focus(); input.select(); }
  });
}

function updateSearchUI(): void {
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  const label = document.getElementById('search-engine-label');
  const engine = SEARCH_ENGINES[prefs.searchEngine];
  if (input) input.placeholder = `Rechercher avec ${engine.label}…`;
  if (label) label.textContent = engine.label;
}

async function fetchPublicIp(): Promise<void> {
  const value = document.getElementById('public-ip');
  const status = document.getElementById('public-ip-status');
  if (value) value.textContent = 'chargement…';
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal, cache: 'no-store' });
    window.clearTimeout(timer);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json() as { ip?: string };
    if (value) value.textContent = data.ip || 'inconnue';
    if (status) status.textContent = 'adresse Internet actuelle';
  } catch {
    if (value) value.textContent = 'indisponible';
    if (status) status.textContent = 'échec de la requête externe';
  }
}

function cleanIp(ip: string): string {
  return ip.replace(/^::ffff:/, '').replace(/^\[|\]$/g, '');
}

async function localIpFromBackend(): Promise<{ ip: string; source?: string } | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1800);
    const response = await fetch('/api/client-ip', { signal: controller.signal, cache: 'no-store' });
    window.clearTimeout(timer);
    if (!response.ok) return null;
    const data = await response.json() as { ip?: string; source?: string };
    const ip = data.ip ? cleanIp(data.ip) : '';
    if (!ip) return null;
    return { ip, source: data.source };
  } catch { return null; }
}

async function localIpFromWebRtc(): Promise<string | null> {
  if (!('RTCPeerConnection' in window)) return null;
  return new Promise(resolve => {
    const found = new Set<string>();
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('ip');
    const finish = () => { pc.close(); resolve([...found][0] || null); };
    const timer = window.setTimeout(finish, 1600);
    pc.onicecandidate = event => {
      const candidate = event.candidate?.candidate || '';
      const match = candidate.match(/(?:\d{1,3}\.){3}\d{1,3}/);
      if (match && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(match[0])) found.add(match[0]);
      if (!event.candidate) { window.clearTimeout(timer); finish(); }
    };
    pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => { window.clearTimeout(timer); finish(); });
  });
}

async function fetchLocalIp(): Promise<void> {
  const value = document.getElementById('local-ip');
  const status = document.getElementById('local-ip-status');
  if (value) value.textContent = 'détection…';
  const backend = await localIpFromBackend();
  if (backend) {
    if (value) value.textContent = backend.ip;
    if (status) {
      status.textContent = backend.source === 'host-fallback' ? 'interface privée de la machine hôte' : backend.source === 'forwarded' ? 'IP transmise par le reverse proxy' : 'IP du navigateur vue par la startpage';
    }
    return;
  }
  const rtc = await localIpFromWebRtc();
  if (rtc) {
    if (value) value.textContent = rtc;
    if (status) status.textContent = 'détectée via WebRTC';
  } else {
    if (value) value.textContent = 'non exposée';
    if (status) status.textContent = 'lance npm run start pour une détection fiable';
  }
}

function faviconFor(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/favicon.ico`;
  } catch { return ''; }
}

function renderShortcuts(): void {
  const root = document.getElementById('shortcut-categories');
  if (!root) return;
  root.innerHTML = '';
  const categories: string[] = [];
  shortcuts.forEach(s => { if (!categories.includes(s.category)) categories.push(s.category); });
  categories.forEach(category => {
    const wrapper = document.createElement('section');
    wrapper.className = 'category';
    const title = document.createElement('h3');
    title.className = 'category-title';
    title.textContent = `~/${category.toLowerCase().replace(/\s+/g, '-')}`;
    const list = document.createElement('div');
    list.className = 'shortcut-list';
    list.dataset.category = category;
    shortcuts.filter(s => s.category === category).forEach(shortcut => {
      const a = document.createElement('a');
      a.className = 'shortcut';
      a.href = shortcut.url;
      a.dataset.id = shortcut.id;
      a.draggable = editingLayout;
      a.title = shortcut.url;
      a.addEventListener('click', event => { if (editingLayout) event.preventDefault(); });
      const img = document.createElement('img');
      img.className = 'favicon'; img.alt = ''; img.loading = 'lazy'; img.src = faviconFor(shortcut.url);
      img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
      const name = document.createElement('span'); name.className = 'shortcut-name'; name.textContent = shortcut.name;
      const mark = document.createElement('span'); mark.className = 'shortcut-edit-mark'; mark.textContent = '⠿';
      a.append(img, name, mark);
      bindShortcutDrag(a);
      list.appendChild(a);
    });
    wrapper.append(title, list); root.appendChild(wrapper);
  });
}

function bindShortcutDrag(el: HTMLElement): void {
  el.addEventListener('dragstart', event => {
    if (!editingLayout) { event.preventDefault(); return; }
    el.classList.add('dragging'); event.dataTransfer?.setData('text/shortcut', el.dataset.id || '');
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  el.addEventListener('dragover', event => { if (editingLayout) { event.preventDefault(); el.classList.add('drag-over'); } });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', event => {
    if (!editingLayout) return;
    event.preventDefault(); el.classList.remove('drag-over');
    const fromId = event.dataTransfer?.getData('text/shortcut'); const toId = el.dataset.id;
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = shortcuts.findIndex(s => s.id === fromId); const toIndex = shortcuts.findIndex(s => s.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = shortcuts.splice(fromIndex, 1); moved.category = shortcuts[toIndex]?.category || moved.category; shortcuts.splice(toIndex, 0, moved);
    saveShortcuts(); renderShortcuts(); renderShortcutEditor();
  });
}

function layoutFor(id: string): ModuleLayout {
  return prefs.moduleLayout[id] || DEFAULT_MODULE_LAYOUT[id] || { xFrac: 0, wFrac: 1, y: 0, h: null };
}

/** Empile les modules dans l'ordre du DOM et mesure leur hauteur réelle pour poser des positions par défaut sans chevauchement. */
function computeStackedLayout(): Record<string, ModuleLayout> {
  const dashboard = document.getElementById('dashboard');
  const layout: Record<string, ModuleLayout> = structuredClone(DEFAULT_MODULE_LAYOUT);
  if (!dashboard) return layout;
  const GAP = 14;
  let cursorY = 0;
  dashboard.querySelectorAll<HTMLElement>('.module').forEach(module => {
    const id = module.dataset.module || '';
    if (id === 'portrait') return; // position/taille fixes par défaut, ne participe pas à l'empilement
    const base = layout[id] || { xFrac: 0, wFrac: 1, y: 0, h: null };
    if (prefs.hiddenModules.includes(id)) { layout[id] = { ...base, y: cursorY, h: null }; return; }
    module.style.position = 'static';
    module.style.width = (base.wFrac * 100) + '%';
    module.style.height = 'auto';
    const height = module.offsetHeight;
    layout[id] = { ...base, y: cursorY, h: null };
    cursorY += height + GAP;
  });
  return layout;
}

function applyModuleLayout(): void {
  const dashboard = document.getElementById('dashboard'); if (!dashboard) return;
  const modules = dashboard.querySelectorAll<HTMLElement>('.module');
  const mobile = isMobileLayout();
  modules.forEach(module => {
    const id = module.dataset.module || '';
    module.classList.toggle('hidden-module', prefs.hiddenModules.includes(id));
    if (mobile) { module.style.cssText = ''; return; }
    const layout = layoutFor(id);
    module.style.position = 'absolute';
    module.style.left = (layout.xFrac * 100) + '%';
    module.style.width = (layout.wFrac * 100) + '%';
    module.style.top = layout.y + 'px';
    if (layout.h != null) { module.style.height = layout.h + 'px'; module.classList.add('has-fixed-height'); }
    else { module.style.height = 'auto'; module.classList.remove('has-fixed-height'); }
  });
  if (mobile) { dashboard.style.removeProperty('min-height'); return; }
  let maxBottom = 0;
  modules.forEach(module => {
    if (module.classList.contains('hidden-module')) return;
    maxBottom = Math.max(maxBottom, module.offsetTop + module.offsetHeight);
  });
  dashboard.style.minHeight = (maxBottom + 8) + 'px';
}

function persistModuleLayout(id: string, patch: Partial<ModuleLayout>): void {
  prefs.moduleLayout[id] = { ...layoutFor(id), ...patch };
  savePrefs();
}

function bindModuleMove(module: HTMLElement): void {
  const handle = module.querySelector<HTMLElement>('.drag-handle');
  const dashboard = document.getElementById('dashboard');
  if (!handle || !dashboard) return;
  handle.addEventListener('pointerdown', event => {
    if (!editingLayout || isMobileLayout()) return;
    event.preventDefault();
    const id = module.dataset.module || '';
    const layout = layoutFor(id);
    const cw = dashboard.clientWidth || 1;
    const startX = event.clientX; const startY = event.clientY;
    const startLeft = layout.xFrac * cw; const startTop = layout.y;
    const widthPx = layout.wFrac * cw;
    let pendingLeft = startLeft; let pendingTop = startTop;
    module.classList.add('dragging');
    handle.setPointerCapture(event.pointerId);
    const onMove = (e: PointerEvent) => {
      pendingLeft = clamp(startLeft + (e.clientX - startX), 0, Math.max(0, cw - widthPx));
      pendingTop = Math.max(0, startTop + (e.clientY - startY));
      module.style.left = pendingLeft + 'px';
      module.style.top = pendingTop + 'px';
    };
    const onUp = () => {
      handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener('pointermove', onMove);
      module.classList.remove('dragging');
      persistModuleLayout(id, { xFrac: pendingLeft / cw, y: pendingTop });
      applyModuleLayout();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp, { once: true });
  });
}

function bindModuleResize(module: HTMLElement): void {
  const handle = module.querySelector<HTMLElement>('.resize-handle');
  const dashboard = document.getElementById('dashboard');
  if (!handle || !dashboard) return;
  handle.addEventListener('pointerdown', event => {
    if (!editingLayout || isMobileLayout()) return;
    event.preventDefault(); event.stopPropagation();
    const id = module.dataset.module || '';
    const layout = layoutFor(id);
    const cw = dashboard.clientWidth || 1;
    const startX = event.clientX; const startY = event.clientY;
    const startWidth = layout.wFrac * cw; const startHeight = module.offsetHeight;
    const leftPx = layout.xFrac * cw;
    let pendingWidth = startWidth; let pendingHeight = startHeight;
    module.classList.add('resizing');
    handle.setPointerCapture(event.pointerId);
    const onMove = (e: PointerEvent) => {
      pendingWidth = clamp(startWidth + (e.clientX - startX), MODULE_MIN_WIDTH, Math.max(MODULE_MIN_WIDTH, cw - leftPx));
      pendingHeight = clamp(startHeight + (e.clientY - startY), MODULE_MIN_HEIGHT, 2000);
      module.style.width = pendingWidth + 'px';
      module.style.height = pendingHeight + 'px';
    };
    const onUp = () => {
      handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener('pointermove', onMove);
      module.classList.remove('resizing');
      persistModuleLayout(id, { wFrac: pendingWidth / cw, h: Math.round(pendingHeight) });
      applyModuleLayout();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp, { once: true });
  });
}

function ensureLayoutComputed(): void {
  if (prefs.layoutComputed || isMobileLayout()) return;
  prefs.moduleLayout = computeStackedLayout();
  prefs.layoutComputed = true;
  savePrefs();
}

function initModuleLayoutControls(): void {
  document.querySelectorAll<HTMLElement>('.module').forEach(module => { bindModuleMove(module); bindModuleResize(module); });
  let resizeTimer = 0;
  window.addEventListener('resize', () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(applyModuleLayout, 120); });
  MOBILE_QUERY.addEventListener('change', () => { ensureLayoutComputed(); applyModuleLayout(); });
}

function setEditMode(enabled: boolean): void {
  editingLayout = enabled;
  document.body.classList.toggle('layout-edit', enabled);
  const btn = document.getElementById('layout-toggle'); if (btn) btn.textContent = enabled ? 'terminer' : 'modifier';
  applyModuleLayout(); renderShortcuts();
  if (enabled) showToast('⠿ pour déplacer un bloc, coin ↘ pour le redimensionner');
}

function renderModuleToggles(): void {
  const root = document.getElementById('module-toggles'); if (!root) return; root.innerHTML = '';
  MODULES.forEach(module => {
    const label = document.createElement('label'); label.className = 'check-row';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = !prefs.hiddenModules.includes(module.id);
    checkbox.addEventListener('change', () => {
      prefs.hiddenModules = checkbox.checked ? prefs.hiddenModules.filter(id => id !== module.id) : [...new Set([...prefs.hiddenModules, module.id])];
      savePrefs(); applyModuleLayout();
    });
    label.append(checkbox, document.createTextNode(module.label)); root.appendChild(label);
  });
}

function renderShortcutEditor(): void {
  const root = document.getElementById('shortcut-editor'); if (!root) return; root.innerHTML = '';
  shortcuts.forEach((shortcut, index) => {
    const row = document.createElement('div'); row.className = 'shortcut-editor-row';
    const name = document.createElement('input'); name.value = shortcut.name; name.placeholder = 'Nom';
    const url = document.createElement('input'); url.value = shortcut.url; url.placeholder = 'https://…';
    const category = document.createElement('input'); category.value = shortcut.category; category.placeholder = 'Catégorie';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-btn'; remove.textContent = '×';
    const persist = () => { shortcuts[index] = { ...shortcuts[index], name: name.value.trim() || 'Sans nom', url: url.value.trim(), category: category.value.trim() || 'Autres' }; saveShortcuts(); renderShortcuts(); };
    name.addEventListener('change', persist); url.addEventListener('change', persist); category.addEventListener('change', persist);
    remove.addEventListener('click', () => { shortcuts.splice(index, 1); saveShortcuts(); renderShortcuts(); renderShortcutEditor(); });
    row.append(name, url, category, remove); root.appendChild(row);
  });
}

function initSettings(): void {
  const modal = document.getElementById('settings-modal') as HTMLDialogElement | null;
  const open = document.getElementById('settings-toggle'); const close = document.getElementById('settings-close');
  const engine = document.getElementById('search-engine-select') as HTMLSelectElement | null;
  const dark = document.getElementById('dark-theme-select') as HTMLSelectElement | null;
  const light = document.getElementById('light-theme-select') as HTMLSelectElement | null;
  if (!modal || !open || !close || !engine || !dark || !light) return;
  engine.value = prefs.searchEngine; dark.value = prefs.preferredDark; light.value = prefs.preferredLight;
  open.addEventListener('click', () => { renderModuleToggles(); renderShortcutEditor(); modal.showModal(); });
  close.addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  engine.addEventListener('change', () => { prefs.searchEngine = engine.value as SearchEngine; savePrefs(); updateSearchUI(); });
  dark.addEventListener('change', () => { prefs.preferredDark = dark.value; savePrefs(); applyTheme(); });
  light.addEventListener('change', () => { prefs.preferredLight = light.value; savePrefs(); applyTheme(); });
  document.getElementById('layout-toggle')?.addEventListener('click', () => setEditMode(!editingLayout));
  document.getElementById('reset-layout')?.addEventListener('click', () => { prefs.hiddenModules = []; prefs.moduleLayout = computeStackedLayout(); prefs.layoutComputed = true; savePrefs(); applyModuleLayout(); renderModuleToggles(); showToast('Disposition réinitialisée'); });
  document.getElementById('reset-shortcuts')?.addEventListener('click', () => { shortcuts = structuredClone(DEFAULT_SHORTCUTS); saveShortcuts(); renderShortcuts(); renderShortcutEditor(); showToast('Raccourcis rétablis'); });
  document.getElementById('add-shortcut')?.addEventListener('click', () => { shortcuts.push({ id: crypto.randomUUID(), name: 'Nouveau', url: 'https://', category: 'Autres' }); saveShortcuts(); renderShortcuts(); renderShortcutEditor(); });
}

function init(): void {
  applyTheme(); window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  initClock(); initSearch(); renderShortcuts();
  ensureLayoutComputed();
  applyModuleLayout(); initModuleLayoutControls(); initSettings();
  document.getElementById('refresh-ips')?.addEventListener('click', () => { void fetchPublicIp(); void fetchLocalIp(); });
  void fetchPublicIp(); void fetchLocalIp();
}

init();
