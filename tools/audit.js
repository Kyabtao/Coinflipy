#!/usr/bin/env node
/* TossMatch continuous audit harness (modular build).
   Run: node tools/audit.js
   Exits 0 when every check passes, 1 otherwise. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const files = ['tossmatch/index.html', 'tossmatch/admin.html'];
let failures = [];
function check(name, ok, detail) {
  if (ok) console.log('  \u2713 ' + name);
  else { console.log('  \u2717 ' + name + (detail ? ' \u2014 ' + detail : '')); failures.push(name + (detail ? ': ' + detail : '')); }
}

/* ── Modular layout ────────────────────────────────────────────── */
const APP = {
  'tossmatch/index.html': {
    app: 'player',
    modules: ['core','data','bots','crypto','state','helpers','render','theme','games','wallet','misc','sync','boot'],
    entry: 'js/player/main.js',
    css: ['css/player/app.css','css/shared/theme.css'],
  },
  'tossmatch/admin.html': {
    app: 'admin',
    modules: ['core','render','theme','engine','banking','sync','boot'],
    entry: 'js/admin/main.js',
    css: ['css/admin/app.css','css/shared/theme.css'],
  },
};
const MODULE_ORDERS = {
  player: ['core','data','bots','crypto','state','helpers','render','theme','games','wallet','misc','sync','boot'],
  admin: ['core','render','theme','engine','banking','sync','boot'],
};
function concatApp(f) {
  const cfg = APP[f];
  const parts = [
    path.join(root, 'tossmatch', 'js', 'shared', 'runtime.js'),
    path.join(root, 'tossmatch', 'js', 'shared', 'theme.js'),
  ];
  for (const m of MODULE_ORDERS[cfg.app]) parts.push(path.join(root, 'tossmatch', 'js', cfg.app, m + '.js'));
  return parts.map(p => fs.readFileSync(p, 'utf8')).join('\n');
}
function appCss(f) {
  const cfg = APP[f];
  return cfg.css.map(p => fs.readFileSync(path.join(root, 'tossmatch', p), 'utf8')).join('\n');
}
function extractScript(p) { // kept for regex-based checks; now returns concatenated module JS
  return { html: fs.readFileSync(path.join(root, p), 'utf8'), js: concatApp(p) };
}
function findIds(html) {
  const seen = new Map();
  for (const m of html.matchAll(/id="([^"]+)"/g)) {
    const id = m[1];
    if (id.includes('${')) continue;
    seen.set(id, (seen.get(id) || 0) + 1);
  }
  return seen;
}
function findRefs(js) {
  const set = new Set();
  for (const m of js.matchAll(/\$\("([^"]+)"\)/g)) set.add(m[1]);
  return set;
}
function existsRel(from, rel) {
  const p = path.resolve(path.dirname(from), rel);
  return fs.existsSync(p);
}
function checkAssets() {
  const exts = /\.(png|jpe?g|webp|gif|svg|ico|css|js|json|webmanifest|woff2?|ttf|mp3)$/i;
  const assetsChecked = [];
  const scan = [ ...files, 'tossmatch/sw.js', 'tossmatch/manifest.webmanifest', 'tossmatch/api/openapi.json',
    ...APP['tossmatch/index.html'].css.map(p=>path.join(root,'tossmatch',p)),
    ...APP['tossmatch/admin.html'].css.map(p=>path.join(root,'tossmatch',p)) ];
  for (const f of scan) {
    if (!fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, 'utf8');
    for (const m of txt.matchAll(/["']([^"']+\.(?:png|jpe?g|webp|gif|svg|ico|css|js|json|webmanifest|woff2?|ttf|mp3))["']/gi)) {
      const u = m[1].split('?')[0];
      if (/^(https?:|data:|mailto:|tel:)/i.test(u)) continue;
      if (/^(tossmatch-|\.\/tossmatch-)/.test(u)) continue;
      assetsChecked.push([f, u]);
      if (!existsRel(f, u)) return { ok: false, detail: `${path.relative(root,f)} -> ${u}` };
    }
  }
  return { ok: true, count: assetsChecked.length };
}
function checkSwCache() {
  const sw = fs.readFileSync(path.join(root, 'tossmatch/sw.js'), 'utf8');
  const m = sw.match(/const CORE=\[([^\]]+)\]/);
  if (!m) return { ok: false, detail: 'CORE array missing' };
  const items = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  let bad = [];
  for (const u of items) {
    const rel = u.replace(/^\.\//, '');
    if (!fs.existsSync(path.join(root, 'tossmatch', rel))) bad.push(u);
  }
  return { ok: bad.length === 0, detail: bad.join(', ') };
}
function checkMixedNullish() {
  let bad = [];
  for (const f of files) {
    const js = extractScript(f).js;
    const lines = js.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (raw.includes('`')) continue;
      const line = raw.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, '');
      if (!line.includes('??')) continue;
      const chunks = line.split(/[,;]/);
      for (const chunk of chunks) {
        if (!chunk.includes('??')) continue;
        let d = 0, last = null, mixed = false;
        for (const t of chunk.match(/[()]|\?\?|\|\|/g) || []) {
          if (t === '(') d++;
          else if (t === ')') d = Math.max(0, d - 1);
          else if (t === '??' || t === '||') {
            if (last && last !== t && d === 0) { mixed = true; break; }
            last = t;
          }
        }
        if (mixed) { bad.push(`${f}:${i + 1}`); break; }
      }
    }
  }
  return { ok: bad.length === 0, detail: bad.slice(0, 8).join(', ') };
}
function esmParse(file) {
  try {
    cp.execFileSync(process.execPath, ['--check', '--input-type=module'], { input: fs.readFileSync(file, 'utf8'), stdio: ['pipe','pipe','pipe'] });
    return { ok: true };
  } catch (e) { return { ok: false, detail: (e.stderr || e.message).toString().slice(0, 240) }; }
}
function moduleStructure() {
  let bad = [];
  const allJs = [];
  for (const f of files) {
    const cfg = APP[f];
    if (!fs.existsSync(path.join(root, 'tossmatch', cfg.entry))) bad.push(f + ' entry missing');
    if (!/type="module"/.test(fs.readFileSync(path.join(root, f), 'utf8'))) bad.push(f + ' not type=module');
    if (/<script>[\s\S]*?<\/script>/.test(fs.readFileSync(path.join(root, f), 'utf8'))) bad.push(f + ' still has inline script');
    for (const m of cfg.modules) {
      const p = path.join(root, 'tossmatch', 'js', cfg.app, m + '.js');
      if (!fs.existsSync(p)) { bad.push(cfg.app + '/' + m + '.js missing'); continue; }
      allJs.push(p);
      const r = esmParse(p);
      if (!r.ok) bad.push(`${path.relative(root,p)} ESM parse: ${r.detail}`);
    }
  }
  for (const p of [path.join(root,'tossmatch','js','shared','runtime.js'), path.join(root,'tossmatch','js','shared','theme.js')]) {
    if (!fs.existsSync(p)) { bad.push(p + ' missing'); continue; }
    allJs.push(p);
    const r = esmParse(p);
    if (!r.ok) bad.push(`${path.relative(root,p)} ESM parse: ${r.detail}`);
  }
  // import/export resolution
  for (const p of allJs) {
    const txt = fs.readFileSync(p, 'utf8');
    for (const m of txt.matchAll(/from\s*["']([^"']+)["']/g)) {
      const target = path.resolve(path.dirname(p), m[1]);
      if (!fs.existsSync(target)) bad.push(`${path.relative(root,p)} bad import ${m[1]}`);
    }
    if (!/export\s+/m.test(txt) && path.basename(p) !== 'runtime.js') bad.push(`${path.relative(root,p)} has no exports`);
  }
  return { ok: bad.length === 0, detail: bad.slice(0, 8).join('; ') };
}

console.log('TossMatch audit');
/* 1. root/site config */
check('root index redirects into tossmatch/', /tossmatch\//.test(fs.readFileSync(path.join(root, 'index.html'), 'utf8')));
const cfgYml = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
check('_config.yml keeps tooling/docs out of the Pages build', /exclude:/.test(cfgYml) && /"doc"/.test(cfgYml) && /"tools"/.test(cfgYml));
check('workspace archives are gone from the tree', !fs.existsSync(path.join(root, 'old data')));

/* 2. per-app checks */
for (const f of files) {
  console.log('\n' + f);
  const { html, js } = extractScript(f);
  check('module structure + semantics', moduleStructure().ok, moduleStructure().detail);
  const ids = findIds(html);
  check('no duplicate static ids', [...ids.entries()].filter(([k, v]) => v > 1).length === 0, [...ids.entries()].filter(([k, v]) => v > 1).map(x => x[0]).join(','));
  const refs = findRefs(js);
  // With the modular build many elements are produced by JS template strings, so
  // ids can live in either the static HTML or in the module source.
  const jsIds = new Set([...js.matchAll(/id=["']([^"'$][^"']*)["']/g)].map(m => m[1]));
  const combined = new Set([...ids.keys(), ...jsIds]);
  const missing = [...refs].filter(id => !combined.has(id));
  check('all $() refs have an id (HTML or dynamic)', missing.length === 0, missing.slice(0, 20).join(', '));
  check('canonical house helpers present', ['houseGross', 'houseNet', 'reconcileHouse'].every(n => new RegExp('function ' + n + '\\(').test(js)));
}

/* 3. assets + sw */
console.log('\nassets');
const as = checkAssets();
check('static asset references exist', as.ok, as.detail);
const sw = checkSwCache();
check('sw.js CORE assets exist', sw.ok, sw.detail);

/* 4. nullish/boolean precedence sanity */
console.log('\njs hygiene');
const mixed = checkMixedNullish();
check('no unparenthesised ?? / || mixing on one expression', mixed.ok, mixed.detail);

/* 5. Feature directory codes unique in admin */
const adminHtml = fs.readFileSync(path.join(root, 'tossmatch/admin.html'), 'utf8');
const codes = [...adminHtml.matchAll(/\{cat:.*?code:'([A-Z0-9-]+)'/g)].map(m => m[1]);
const dupCodes = [...new Set(codes.filter((x, i) => codes.indexOf(x) !== i))];
check('admin Feature Directory codes unique', dupCodes.length === 0, dupCodes.join(', '));

/* 6. Real-world accounting model */
for (const f of files) {
  const { js } = extractScript(f);
  const net = js.match(/function houseNet\(\)\{[^}]+\}/);
  const okNet = !!net &&
    !/\(h\.(withdrawals|playerWithdrawals)[^)]*\)/.test(net[0]) &&
    /\(h\.promoCost\|\|0\)/.test(net[0]) && net[0].includes('comps');
  check(f + ' houseNet is real-world NGR (gross \u2212 promo \u2212 comps)', okNet);
  const hasCash = ['houseCashIn', 'houseCashOut', 'houseNetCash'].every(n => new RegExp('function ' + n + '\\(').test(js));
  check(f + ' cash-flow helpers present', hasCash);
  check(f + ' houseCashIn includes player and bot', /\(h\.deposits\|\|0\)\+\(h\.botDeposits\|\|0\)/.test(js));
  check(f + ' houseCashOut includes bot and player', /\(h\.withdrawals\|\|0\)\+\(h\.playerWithdrawals\|\|0\)/.test(js));
  check(f + ' reconcileHouse syncs netCash', /h\.netCash=(Math\.round\(houseNetCash\(\)\)|r\.netCash)/.test(js));
}
check('index deposit writes house.deposits', /cfg\(\)\.house\.deposits=\(cfg\(\)\.house\.deposits\|\|0\)\+a/.test(extractScript('tossmatch/index.html').js));
check('index bot top-up writes house.botDeposits', /cfg\(\)\.house\.botDeposits=\(cfg\(\)\.house\.botDeposits\|\|0\)\+base/.test(extractScript('tossmatch/index.html').js));
check('index bot withdrawal writes house.withdrawals', /cfg\(\)\.house\.withdrawals=\(cfg\(\)\.house\.withdrawals\|\|0\)\+amount/.test(extractScript('tossmatch/index.html').js));
check('index player withdrawal writes house.playerWithdrawals', /cfg\(\)\.house\.playerWithdrawals=\(cfg\(\)\.house\.playerWithdrawals\|\|0\)\+a/.test(extractScript('tossmatch/index.html').js));
const adminJs = extractScript('tossmatch/admin.html').js;
check('admin revenue export includes Net revenue (NGR)', /'Net revenue \(NGR\)'/.test(adminJs));
check('admin revenue export includes cash-flow rows', /'Cash in \u2014 player deposits'/.test(adminJs) && /'Net cash flow'/.test(adminJs));
check('admin P&L panel shows NGR + 4 cash-flow lines', /"Net revenue \(NGR\)"/.test(adminJs) && /"Cash in \u2014 player deposits"/.test(adminJs) && /"Cash in \u2014 bot deposits"/.test(adminJs) && /"Cash out \u2014 bot withdrawals"/.test(adminJs) && /"Cash out \u2014 player withdrawals"/.test(adminJs));
check('admin deposit-reversal decrements house.deposits', /house\.deposits=Math\.max\(0,\(cfg\(\)\.house\.deposits\|\|0\)-base\)/.test(adminJs));
check('admin withdraw-reversal decrements house.playerWithdrawals', /house\.playerWithdrawals=Math\.max\(0,\(cfg\(\)\.house\.playerWithdrawals\|\|0\)-\(rec\.amount\|\|0\)\)/.test(adminJs));
check('transaction origins record house cash flows', /house\.deposits=\(cfg\(\)\.house\.deposits\|\|0\)\+a/.test(extractScript('tossmatch/index.html').js));

/* 7. Theme engine present in both; ids resolve; css var coverage */
const THEME_IDS = ['paletteBtn','paletteBg','paletteContent','themePresetGrid','pcBg','pcCard','pcAccent','pcTxt','pcApply','pcReset','paletteClose'];
for (const f of files) {
  const { html, js } = extractScript(f);
  const ids = findIds(html);
  const missingTheme = THEME_IDS.filter(id => !ids.has(id));
  check(f + ' theme palette ids present', missingTheme.length === 0, missingTheme.join(', '));
  const engineOK = ['applyTheme', 'themeName', 'themePalette', 'openPalette', 'renderThemePresets'].every(n => new RegExp('function ' + n + '\\(').test(js));
  check(f + ' theme engine functions present', engineOK);
  check(f + ' theme applied in render', /applyTheme\(\);/.test(js));
  check(f + ' preset themes defined', ['midnight', 'royal', 'emerald', 'sunset', 'ocean', 'light'].every(id => new RegExp("id:'" + id + "'").test(js)));
  const css = appCss(f);
  check(f + ' theme CSS variable sets defined', (css.match(/body\[data-theme="[a-z]+"\]/g) || []).length >= 6);
  check(f + ' no hardcoded accent rgba left', !/(rgba\(\s*(246,196,83|192,132,252|52,211,153|96,165,250)\s*[,/])/.test(css));
}

/* 8. Runtime smoke of the shared theme engine (no browser required) */
console.log('\njs hygiene');
function themeEngineSmoke(file) {
  const engineFile = path.join(root, 'tossmatch', 'js', 'shared', 'theme.js');
  const js = fs.readFileSync(engineFile, 'utf8');
  const start = js.indexOf('const THEME_PRESETS=');
  if (start < 0) return { ok: false, detail: 'engine markers missing' };
  let eng = js.slice(start);
  eng = eng.split('\n').filter(l => !/^\s*(export\b|import\b|Object\.assign\(globalThis)/.test(l)).join('\n');
  const stubs = `
const S={settings:{themeName:'midnight',customPalette:null}};
const _els={};
function _el(id){if(!_els[id])_els[id]={style:{setProperty(){},removeProperty(){}},classList:{toggle(){},add(){},remove(){}},dataset:{},textContent:'',innerHTML:'',value:'',onclick:null,addEventListener(){}};return _els[id];}
const $=id=>_el(id);
function toast(){}
const document={body:{dataset:{},classList:{toggle(){},add(){},remove(){}},style:{setProperty(){}}},documentElement:{style:{setProperty(){},removeProperty(){}}},querySelectorAll(){return []}};
const localStorage={setItem(){}};
function clearThemeVars(){const cs=document.documentElement.style;['--bg','--card'].forEach(v=>cs.removeProperty(v));}
`;
  const body = stubs + eng + `
const _res={};
try{
  _res.presets=THEME_PRESETS.length;
  S.settings.themeName='ocean';applyTheme();_res.ocean=document.body.dataset.theme;
  S.settings.themeName='light';applyTheme();_res.light=document.body.dataset.theme;
  S.settings.themeName='custom';S.settings.customPalette={light:false,bg:'#101020',card:'#1a1a30',accent:'#ff7849',txt:'#eee'};applyTheme();_res.custom=document.body.dataset.theme;
  renderThemePresets();_res.presetRender=true;
  clearThemeVars();_res.clear=true;
  _res.ok=_res.presets===6&&_res.ocean==='ocean'&&_res.light==='light'&&_res.custom==='custom'&&_res.presetRender&&_res.clear;
}catch(e){_res.ok=false;_res.err=e.message}
_res;
`;
  const sandbox = { console };
  const vm = require('vm');
  try {
    vm.createContext(sandbox);
    const res = vm.runInContext(body, sandbox, { timeout: 3000 });
    return { ok: !!res.ok, detail: res.err || ('presets=' + res.presets) };
  } catch (e) { return { ok: false, detail: e.message }; }
}
for (const f of files) {
  const r = themeEngineSmoke(f);
  check(f + ' theme engine runtime smoke', r.ok, r.detail);
}


/* 9. Phase 3 — shared money module + ledger/concurrency simulation ───────── */
console.log('\nledger & money math');
const moneyFile = path.join(root, 'tossmatch', 'js', 'shared', 'money.js');
check('shared money module present', fs.existsSync(moneyFile));
for (const f of files) {
  const dir = path.dirname(path.join(root, 'tossmatch', 'js', f.includes('admin') ? 'admin' : 'player', 'x.js'));
  const entry = f === 'tossmatch/index.html' ? 'js/player' : 'js/admin';
  const folder = path.join(root, 'tossmatch', entry);
  const wired = fs.readdirSync(folder).some(m => /shared\/money\.js/.test(fs.readFileSync(path.join(folder, m), 'utf8')));
  check(f + ' imports the shared money module', wired);
}
const smokeFile = path.join(root, 'tools', 'boot-smoke.mjs');
if (fs.existsSync(smokeFile)) {
  let out = '', rep = null;
  try { out = cp.execFileSync(process.execPath, [smokeFile], { encoding: 'utf8', timeout: 180000 }); }
  catch (e) { out = String(e.stdout || '') + String(e.stderr || ''); }
  try { rep = JSON.parse(out); } catch (e) { /* fall through */ }
  if (!rep) check('headless boot smoke runs', false, out.slice(0, 240));
  else for (const c of rep.checks) check('boot · ' + c.name, c.ok, c.detail);
}
const simFile = path.join(root, 'tools', 'ledger-simulation.mjs');
check('ledger simulation harness present', fs.existsSync(simFile));
if (fs.existsSync(simFile)) {
  let out = '', rep = null;
  try { out = cp.execFileSync(process.execPath, [simFile], { encoding: 'utf8' }); }
  catch (e) { out = String(e.stdout || '') + String(e.stderr || ''); }
  try { rep = JSON.parse(out); } catch (e) { /* fall through */ }
  if (!rep) check('ledger simulation runs', false, out.slice(0, 200));
  else for (const c of rep.checks) check('ledger · ' + c.name, c.ok, c.detail);
}

/* 10. Phase 4.3 — targeted rendering ─────────────────────────────────────── */
console.log('\ntargeted rendering');
{
  const pj = concatApp('tossmatch/index.html');
  for (const fn of ['renderChrome', 'renderTab', 'renderTick']) {
    check('player defines ' + fn + '()', new RegExp('function ' + fn + '\\(').test(pj));
    check('player registers ' + fn + ' on globalThis', new RegExp('Object\\.assign\\(globalThis,\\{[^}]*\\b' + fn + '\\b').test(pj));
  }
  check('player tab switch uses renderTab()', /renderTab\(b\.dataset\.tab\)/.test(pj));
  check('background tick routes through renderTick()', /renderTick\(\);save\(\)/.test(pj));
  check('player renderChrome guards missing elements', /function el\(id\)\{/.test(pj));
  const aj = concatApp('tossmatch/admin.html');
  for (const fn of ['renderAdminChrome', 'renderAdminTab', 'renderAdminTick']) {
    check('admin defines ' + fn + '()', new RegExp('function ' + fn + '\\(').test(aj));
  }
  check('admin registers renderAdminTab on globalThis', /Object\.assign\(globalThis,\{[^}]*\brenderAdminTab\b/.test(aj));
  check('admin tab switch uses renderAdminTab()', /renderAdminTab\(b\.dataset\.tab\)/.test(aj));
  const chromeIds = ['mainVal', 'jpVal', 'jpMeter', 'maintBanner', 'broadcast', 'togSound', 'togInstant', 'togAuto', 'autoBetConfig', 'autoStopInput', 'togPrivate', 'coin', 'coinStage', 'skinLbl', 'feeNote', 'sessionInfo'];
  const pHtml = fs.readFileSync(path.join(root, 'tossmatch/index.html'), 'utf8');
  const missingChrome = chromeIds.filter(id => !new RegExp('id="' + id + '"').test(pHtml));
  check('every renderChrome element id exists in the DOM', missingChrome.length === 0, missingChrome.join(', '));
}

/* 11. Phase 1 — component library wired into the app ────────────────────── */
console.log('\ncomponent library');
{
  const compDir = path.join(root, 'tossmatch', 'src', 'components');
  const comps = ['button', 'card', 'modal', 'badge', 'input'];
  for (const c of comps) {
    const f = path.join(compDir, c, c + '.js');
    check('component ' + c + ' present with factories', fs.existsSync(f) && /export function create/.test(fs.readFileSync(f, 'utf8')));
  }
  const allAppJs = [];
  for (const d of ['player', 'admin', 'shared']) {
    for (const m of fs.readdirSync(path.join(root, 'tossmatch', 'js', d))) if (m.endsWith('.js')) allAppJs.push(path.join(root, 'tossmatch', 'js', d, m));
  }
  const srcImported = allAppJs.filter(f => /from\s+"[^"]*src\/(components|js\/utils)/.test(fs.readFileSync(f, 'utf8')));
  check('app modules import the reusable component/utils library', srcImported.length >= 2, srcImported.length + ' module(s)');
  let badImports = [];
  for (const f of allAppJs.concat([moneyFile])) {
    const txt = fs.readFileSync(f, 'utf8');
    for (const m of txt.matchAll(/from\s+["']([^"']+)["']/g)) {
      if (!fs.existsSync(path.resolve(path.dirname(f), m[1]))) badImports.push(path.basename(f) + ' → ' + m[1]);
    }
  }
  check('module imports (including src/) resolve', badImports.length === 0, badImports.slice(0, 4).join(', '));
}

/* 12. Phase 4.1 — zero user-visible internal codes ──────────────────────── */
console.log('\nhuman labels');
{
  const codeToken = /\b(?:B[1-4]|UX[1-4]|G\d{1,2}|CAT\d{1,2}|E[1-9]|S[1-7]|LIVE[1-4]|TRUST[1-4]|OPS\d|SEC\d|RG\d|T\d|RET-\d|WAL-\d|CORE-\d)\b\s?(?:·|–|—|-)/;
  for (const f of ['tossmatch/index.html', 'tossmatch/admin.html']) {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const visible = [...html.matchAll(/>([^<{]+)</g)].map(m => m[1]).join(' ');
    const hits = (visible.match(new RegExp(codeToken.source, 'g')) || []);
    check(f + ' shows no internal codes in visible copy', hits.length === 0, hits.slice(0, 4).join(', '));
  }
  for (const f of files) {
    const js = concatApp(f);
    // ${r.code} is allowed only as a private-room invite code (data, not a badge).
    let scan = js;
    const refs = [...scan.matchAll(/\$\{[a-z]\.code\}/g)];
    const stray = refs.filter(m => !/code\s*$|Invite code/.test(scan.slice(Math.max(0, m.index - 60), m.index)));
    check(f + ' renders no internal ${x.code} badges (invite codes excepted)', stray.length === 0, stray.length + ' stray reference(s)');
    const uiHits = (js.match(/<h3>[^`<]*\b(?:B[1-4]|UX[1-4]|G\d{1,2}|CAT\d{1,2}|E[1-9]) ·/g) || []);
    check(f + ' has no code-prefixed card headings', uiHits.length === 0, uiHits.slice(0, 3).join(' | '));
  }
  const dirJs = fs.readFileSync(path.join(root, 'tossmatch', 'js', 'admin', 'core.js'), 'utf8');
  check('feature directory search index ignores internal codes', !/`\$\{x\.code\} \$\{x\.name\}/.test(dirJs));
  check('feature directory badge shows the human category', /directory-code">\$\{x\.cat\}/.test(dirJs));
}

/* 13. Phase 2 — Admin ↔ Player alignment ─────────────────────────────────── */
console.log('\nadmin ↔ player alignment');
{
  const adminHtml = fs.readFileSync(path.join(root, 'tossmatch/admin.html'), 'utf8');
  for (const id of ['panel-revenue', 'revenueRoot', 'revenueRecon', 'cfgStakeMin', 'cfgStakeMax', 'cfgPayoutCap', 'cfgEdge', 'cfgAnim', 'cfgAutoStop', 'playerSessionMonitor']) {
    check('admin.html provides #' + id, new RegExp('id="' + id + '"').test(adminHtml));
  }
  const aj = concatApp('tossmatch/admin.html');
  check('revenue screen renders tiles + charts from the component library', /createStatGrid\(/.test(aj) && /revenueChartSVG\(/.test(aj));
  check('transaction log exports as CSV and JSON', /fliparena-transactions\.csv/.test(aj) && /fliparena-transactions\.json/.test(aj));
  check('reconciliation panel states the NGR formula', /Net platform profit = Gross revenue/.test(adminHtml));
  check('player management offers freeze / unfreeze', /function adminSetFreeze\(/.test(aj) && /data-unfreeze=/.test(aj));
  check('player management offers bet history', /function adminPlayerHistory\(/.test(aj) && /data-history=/.test(aj));
  const pj = concatApp('tossmatch/index.html');
  check('player enforces the Admin freeze flag', /S\.frozen&&S\.frozen\.you/.test(pj));
  check('player honours Admin stake bounds', /cfg\(\)\.stakeMin/.test(pj) && /cfg\(\)\.stakeMax/.test(pj));
  check('player honours the Admin payout cap', /cfg\(\)\.payoutCap/.test(pj));
  check('player honours the Admin animation speed', /cfg\(\)\.animMs/.test(pj));
  check('player honours the Admin house edge', /cfg\(\)\.edgePct/.test(pj));
  check('frozen simulated players leave every activity pool', /!b\.frozen/.test(pj));
  const stateJs = fs.readFileSync(path.join(root, 'tossmatch', 'js', 'player', 'state.js'), 'utf8');
  const adminCore = fs.readFileSync(path.join(root, 'tossmatch', 'js', 'admin', 'core.js'), 'utf8');
  for (const key of ['stakeMin', 'stakeMax', 'payoutCap', 'animMs', 'edgePct']) {
    check('game parameter "' + key + '" defaults exist in both apps', new RegExp(key + ':').test(stateJs) && new RegExp(key + ':').test(adminCore));
  }
}

/* 14. Phase 6 — repository hygiene ──────────────────────────────────────── */
console.log('\nrepository hygiene');
{
  const docFile = path.join(root, 'doc', 'CLEANUP_AND_ARCHITECTURE.md');
  if (fs.existsSync(docFile)) {
    const doc = fs.readFileSync(docFile, 'utf8');
    const rows = [...doc.matchAll(/^\|`([^`]+)`\|/gm)].map(m => m[1]);
    const leftovers = rows.filter(r => fs.existsSync(path.join(root, r)));
    check('every file in the deletion register is really gone', leftovers.length === 0, leftovers.slice(0, 4).join(', '));
  }
  const legacyDir = path.join(root, 'tossmatch', 'docs', 'legacy');
  const legacyLeft = fs.existsSync(legacyDir) ? fs.readdirSync(legacyDir).filter(f => /\.(html|json)$/.test(f)) : [];
  check('legacy single-file prototypes and mock data are purged', legacyLeft.length === 0, legacyLeft.join(', '));
  check('workspace archives are purged', !fs.existsSync(path.join(root, 'old data')));
}

if (failures.length) {
  console.log('\nFAIL \u2014 ' + failures.length + ' problem(s)');
  process.exit(1);
} else {
  console.log('\nPASS \u2014 all checks clean');
  process.exit(0);
}
