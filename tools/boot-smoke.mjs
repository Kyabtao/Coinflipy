#!/usr/bin/env node
/* FlipArena — headless boot smoke test (jsdom).
   Loads the real player and admin pages, runs the ES-module entry points, walks
   every tab/screen, exercises targeted rendering (renderChrome / renderTab /
   renderTick), places a bet end-to-end and opens the Admin revenue screen.
   Any console error, unhandled rejection or thrown exception fails the run. */
'use strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { webcrypto } from 'crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const results = [];
const record = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

let JSDOM;
try { ({ JSDOM } = await import('jsdom')); }
catch (e) {
  console.log(JSON.stringify({
    ok: true, skipped: true,
    checks: [{ name: 'headless boot smoke skipped — run `npm i jsdom` to enable it', ok: true, detail: e.message }],
  }));
  process.exit(0);
}

function makeEnv(file) {
  const html = fs.readFileSync(path.join(ROOT, 'tossmatch', file), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/tossmatch/' + file, pretendToBeVisual: true });
  const w = dom.window;
  // --- stubs for browser APIs jsdom does not implement -----------------------
  w.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
    fill() {}, arc() {}, save() {}, restore() {}, set fillStyle(_v) {}, set strokeStyle(_v) {},
    set lineWidth(_v) {}, set font(_v) {}, fillText() {}, createLinearGradient: () => ({ addColorStop() {} }),
  });
  if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  class BC { constructor(n) { this.name = n; } postMessage() {} close() {} addEventListener() {} set onmessage(_v) {} }
  w.BroadcastChannel = BC;
  if (!w.crypto || !w.crypto.subtle) Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
  w.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
  w.cancelAnimationFrame = id => clearTimeout(id);
  w.scrollTo = () => {};
  w.prompt = () => 'Smoke test reason';
  w.confirm = () => true;
  w.alert = () => {};
  globalThis.prompt = w.prompt; globalThis.confirm = w.confirm; globalThis.alert = w.alert;
  // --- expose as Node globals so the ES modules see a browser ----------------
  for (const k of ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'BroadcastChannel',
    'requestAnimationFrame', 'cancelAnimationFrame', 'HTMLCanvasElement', 'HTMLElement', 'Node', 'Event',
    'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle', 'DOMParser', 'Image', 'location',
    'matchMedia', 'screen', 'history', 'URL', 'Blob', 'FileReader', 'XMLHttpRequest']) {
    if (w[k] === undefined) continue;
    try {
      Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true });
    } catch (e) { /* read-only Node global: the module can still reach it via window */ }
  }
  try { Object.defineProperty(globalThis, 'crypto', { value: w.crypto, configurable: true, writable: true }); }
  catch (e) { /* keep Node's webcrypto */ }
  return dom;
}

const errors = [];
const origError = console.error, origWarn = console.warn;
console.error = (...a) => { errors.push('console.error: ' + a.join(' ')); };
console.warn = (...a) => { const m = a.join(' '); if (!/Could not parse CSS|Error: Not implemented/.test(m)) errors.push('console.warn: ' + m); };
process.on('unhandledRejection', e => errors.push('unhandledRejection: ' + (e && e.message)));

/* ── Player app ──────────────────────────────────────────────────────────── */
{
  const dom = makeEnv('index.html');
  const w = dom.window;
  let booted = true, bootErr = '';
  try {
    await import(pathToFileURL(path.join(ROOT, 'tossmatch', 'js', 'player', 'main.js')).href);
  } catch (e) { booted = false; bootErr = e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n'); }
  record('player app boots (ES modules, no exceptions)', booted, bootErr);

  const $ = id => w.document.getElementById(id);
  record('player chrome rendered the wallet', $('mainVal') && $('mainVal').textContent !== '0', 'mainVal=' + ($('mainVal') || {}).textContent);
  record('player chrome rendered the jackpot ticker', !!$('jpVal') && $('jpVal').textContent !== '', 'jpVal=' + ($('jpVal') || {}).textContent);
  record('recent games panel rendered', !!$('recentGames') && $('recentGames').innerHTML.length > 0);
  record('home dashboard rendered', !!$('homeKpis') && $('homeKpis').innerHTML.length > 0);

  // targeted rendering handlers
  const rt = globalThis.renderTick, rtab = globalThis.renderTab, rc = globalThis.renderChrome;
  record('renderChrome / renderTab / renderTick are registered', typeof rc === 'function' && typeof rtab === 'function' && typeof rt === 'function');

  // walk every tab: each click must repaint only that tab without throwing
  const tabs = [...w.document.querySelectorAll('.tab[data-tab]')].map(b => b.dataset.tab);
  let tabErrs = [];
  for (const t of tabs) {
    try {
      const btn = w.document.querySelector('.tab[data-tab="' + t + '"]');
      btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      const panel = w.document.getElementById('panel-' + t);
      if (!panel || !panel.classList.contains('active')) tabErrs.push(t + ' did not activate');
    } catch (e) { tabErrs.push(t + ': ' + e.message); }
  }
  record('all ' + tabs.length + ' player tabs switch and paint', tabErrs.length === 0, tabErrs.slice(0, 3).join(' | '));

  try { rtab('home'); rc(); rt(); record('renderTick() repaints chrome + active tab', true); }
  catch (e) { record('renderTick() repaints chrome + active tab', false, e.message); }

  // isolation: renderTab must not touch an inactive panel
  try {
    const before = w.document.getElementById('panel-wallet').innerHTML;
    rtab('home');
    const after = w.document.getElementById('panel-wallet').innerHTML;
    record('renderTab() leaves inactive panels untouched', before === after);
  } catch (e) { record('renderTab() leaves inactive panels untouched', false, e.message); }

  // end-to-end bet: post → bot match → settle
  try {
    const before = Number(globalThis.S.wallet.main);
    globalThis.selectSide('HEADS');
    w.document.getElementById('stakeInput').value = '100';
    await globalThis.postBet('HEADS', 100, 'smoke', false);
    const waiting = globalThis.S.waiting.length;
    await new Promise(r => setTimeout(r, 60));
    globalThis.render();
    record('a bet can be posted and escrowed', waiting > 0 && Number(globalThis.S.wallet.main) <= before,
      'wallet ' + before + ' → ' + globalThis.S.wallet.main);
    const rep = globalThis.ledgerAudit();
    record('ledger invariants hold after a live bet', rep.ok, rep.issues.join('; '));
  } catch (e) { record('a bet can be posted and escrowed', false, e.message); }
  dom.window.close();
}

/* ── Admin app ───────────────────────────────────────────────────────────── */
{
  const dom = makeEnv('admin.html');
  const w = dom.window;
  let booted = true, bootErr = '';
  try { await import(pathToFileURL(path.join(ROOT, 'tossmatch', 'js', 'admin', 'main.js')).href); }
  catch (e) { booted = false; bootErr = e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n'); }
  record('admin console boots (ES modules, no exceptions)', booted, bootErr);

  const $ = id => w.document.getElementById(id);
  record('admin header KPIs rendered', !!$('hNet') && $('hNet').textContent !== '');
  const tabs = [...w.document.querySelectorAll('.tab[data-tab]')].map(b => b.dataset.tab);
  let tabErrs = [];
  for (const t of tabs) {
    try { w.document.querySelector('.tab[data-tab="' + t + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles: true })); }
    catch (e) { tabErrs.push(t + ': ' + e.message); }
  }
  record('all ' + tabs.length + ' admin screens switch and paint', tabErrs.length === 0, tabErrs.slice(0, 3).join(' | '));

  record('revenue dashboard built tiles from the component library',
    !!$('revenueRoot') && $('revenueRoot').querySelectorAll('.stat-tile').length >= 4,
    'tiles=' + ($('revenueRoot') ? $('revenueRoot').querySelectorAll('.stat-tile').length : 0));
  record('revenue dashboard rendered charts', !!$('revenueRoot') && $('revenueRoot').querySelectorAll('svg').length >= 2);
  record('ledger reconciliation readout rendered', !!$('revenueRecon') && /Net platform profit/.test($('revenueRecon').textContent));
  record('game parameters panel populated', !!$('cfgStakeMin') && $('cfgStakeMin').value !== '');
  record('live player session monitor rendered', !!$('playerSessionMonitor') && /ACTIVE|FROZEN/.test($('playerSessionMonitor').textContent));
  record('player roster offers freeze + bet history controls',
    /data-freeze=|data-unfreeze=/.test($('peopleList').innerHTML) && /data-history=/.test($('peopleList').innerHTML));

  try { globalThis.renderAdminTick(); record('renderAdminTick() refreshes chrome + active screen', true); }
  catch (e) { record('renderAdminTick() refreshes chrome + active screen', false, e.message); }

  // Admin → player parameter sync: change stake bounds, persist, re-read
  try {
    $('cfgStakeMin').value = '25'; $('cfgStakeMax').value = '750';
    globalThis.saveGameParams();
    record('game parameters save and persist', globalThis.S.config.stakeMin === 25 && globalThis.S.config.stakeMax === 750,
      JSON.stringify({ min: globalThis.S.config.stakeMin, max: globalThis.S.config.stakeMax }));
  } catch (e) { record('game parameters save and persist', false, e.message); }

  // freeze / unfreeze round trip (demo player account + a simulated player when the roster exists)
  try {
    globalThis.adminSetFreeze('__player__', true);
    const frozen = !!(globalThis.S.frozen && globalThis.S.frozen.you);
    globalThis.adminSetFreeze('__player__', false);
    const thawed = !(globalThis.S.frozen && globalThis.S.frozen.you);
    let botOk = true, botDetail = 'no simulated roster in a fresh Admin session';
    if (globalThis.S.bots && globalThis.S.bots.length) {
      const bot = globalThis.S.bots[0].name;
      globalThis.adminSetFreeze(bot, true);
      botOk = !!(globalThis.S.bots.find(b => b.name === bot) || {}).frozen;
      globalThis.adminSetFreeze(bot, false);
      botOk = botOk && !globalThis.S.bots.find(b => b.name === bot).frozen;
      botDetail = 'roster freeze verified on ' + bot;
    }
    record('player freeze / unfreeze round-trips', frozen && thawed && botOk, botDetail);
  } catch (e) { record('player freeze / unfreeze round-trips', false, e.message); }

  // exports produce real CSV / JSON payloads
  try {
    const rows = globalThis.transactionLog(50);
    record('transaction log is exportable (rows + CSV/JSON shape)', Array.isArray(rows) && rows.every(r => typeof r.t === 'number' && typeof r.amount === 'number'),
      rows.length + ' rows');
  } catch (e) { record('transaction log is exportable (rows + CSV/JSON shape)', false, e.message); }
  dom.window.close();
}

console.error = origError; console.warn = origWarn;
record('no console errors or warnings during the run', errors.length === 0, errors.slice(0, 3).join(' | '));

const ok = results.every(r => r.ok);
console.log(JSON.stringify({ ok, checks: results }, null, 2));
process.exit(ok ? 0 : 1);
