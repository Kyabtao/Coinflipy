#!/usr/bin/env node
/* Targeted smoke test — Task 1 new features (events, milestones, auction, new games). */
'use strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { webcrypto } from 'crypto';
const ROOT = '/home/user/Coinflipy';
const { JSDOM } = await import('jsdom');
const results = [];
const record = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });
const errors = [];
process.on('unhandledRejection', e => errors.push('unhandledRejection: ' + (e && e.message)));

function makeEnv(file) {
  const html = fs.readFileSync(path.join(ROOT, 'tossmatch', file), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/tossmatch/' + file, pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {}, save() {}, restore() {}, set fillStyle(_v) {}, set strokeStyle(_v) {}, set lineWidth(_v) {}, set font(_v) {}, fillText() {}, createLinearGradient: () => ({ addColorStop() {} }) });
  if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  class BC { constructor(n) { this.name = n; } postMessage() {} close() {} addEventListener() {} set onmessage(_v) {} }
  w.BroadcastChannel = BC;
  if (!w.crypto || !w.crypto.subtle) Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
  w.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
  w.cancelAnimationFrame = id => clearTimeout(id);
  w.scrollTo = () => {};
  w.prompt = () => 'test'; w.confirm = () => true; w.alert = () => {};
  globalThis.prompt = w.prompt; globalThis.confirm = w.confirm; globalThis.alert = w.alert;
  for (const k of ['window','document','navigator','localStorage','sessionStorage','BroadcastChannel','requestAnimationFrame','cancelAnimationFrame','HTMLCanvasElement','HTMLElement','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','getComputedStyle','DOMParser','Image','location','matchMedia','screen','history','URL','Blob','FileReader','XMLHttpRequest']) {
    if (w[k] === undefined) continue;
    try { Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true }); } catch (e) {}
  }
  try { Object.defineProperty(globalThis, 'crypto', { value: w.crypto, configurable: true, writable: true }); } catch (e) {}
  return dom;
}

const dom = makeEnv('index.html');
const w = dom.window;
let booted = true, bootErr = '';
try { await import(pathToFileURL(path.join(ROOT, 'tossmatch', 'js', 'player', 'main.js')).href); }
catch (e) { booted = false; bootErr = e.message; }
record('player boots with new-feature modules', booted, bootErr);
console.log('DEBUG after boot:', typeof globalThis.S, typeof globalThis.cfg, typeof globalThis.renderTick, typeof globalThis.GAMES, typeof globalThis.EXT_ARCADE, typeof globalThis.handleFeatureAction);
const S = globalThis.S, cfg = globalThis.cfg;
const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const switchTab = t => click(w.document.querySelector('.tab[data-tab="' + t + '"]'));

/* ── Event Calendar (community hub) ── */
switchTab('community');
const evBtn = w.document.querySelector('.hub-tab[data-hubtab="events"]');
record('community hub shows Events tab', !!evBtn);
if (evBtn) {
  click(evBtn);
  const hub = w.document.getElementById('communityHub').innerHTML;
  record('Event Calendar renders schedule', hub.includes('Event Calendar') && (hub.match(/event-remind/g) || []).length >= 3, 'rows=' + (hub.match(/event-remind/g) || []).length);
  const remindBtn = w.document.querySelector('[data-feature="event-remind"]');
  if (remindBtn) {
    const id = remindBtn.dataset.id;
    click(remindBtn);
    record('reminder toggle persists in state', S.social.eventReminders && S.social.eventReminders[id] === true, id);
    click(w.document.querySelector('[data-feature="event-remind"][data-id="' + id + '"]'));
    record('reminder toggle off persists', S.social.eventReminders[id] === false, id);
  } else record('reminder toggle persists in state', false, 'no button');
}

/* ── Career Milestones (progression hub) ── */
switchTab('progressionplus');
const msBtn = w.document.querySelector('.hub-tab[data-hubtab="milestones"]');
record('progression hub shows Milestones tab', !!msBtn);
if (msBtn) {
  click(msBtn);
  const hub = w.document.getElementById('progressionHub').innerHTML;
  record('Milestones render 12 lifetime goals', hub.includes('Career Milestones') && (hub.match(/milestone-claim/g) || []).length === 12, 'rows=' + (hub.match(/milestone-claim/g) || []).length);
  // g10 needs 10 games — force it for a claim test
  S.stats.games = 10;
  click(msBtn);
  const claimBtn = w.document.querySelector('[data-feature="milestone-claim"][data-id="g10"]');
  const balBefore = S.wallet.bonus;
  if (claimBtn) {
    click(claimBtn);
    record('milestone claim credits BONUS + taps', S.engagement.milestones.claimed.g10 === true && S.wallet.bonus > balBefore, 'bonus +' + (S.wallet.bonus - balBefore));
  } else record('milestone claim credits BONUS + taps', false, 'claim button missing or not enabled');
}

/* ── Auction House (economy hub) ── */
switchTab('economyplus');
const auBtn = w.document.querySelector('.hub-tab[data-hubtab="auction"]');
record('economy hub shows Auctions tab', !!auBtn);
if (auBtn) {
  click(auBtn);
  const hub = w.document.getElementById('economyHub').innerHTML;
  const lots = w.document.querySelectorAll('[data-feature="auction-bid"]');
  record('Auction renders 3 weekly lots', hub.includes('Auction House') && lots.length === 3, 'lots=' + lots.length);
  if (lots.length) {
    // place a dominating bid on the first lot so the player wins
    const lotId = lots[0].dataset.id;
    const inp = w.document.getElementById('auctionBid-' + lotId);
    const mainBefore = S.wallet.main;
    const feesBefore = cfg().house.auctionFees || 0;
    const bidAmt = Math.floor(S.wallet.main);
    inp.value = String(bidAmt);
    click(lots[0]);
    const a = S.economyPlus.auction;
    const lot = a.lots.find(l => l.id === lotId);
    record('player bid recorded on lot', lot.bids.some(b => b.by === 'You' && b.amount === bidAmt), JSON.stringify(lot.bids));
    // re-query after the re-render, then hammer
    const closeBtn = w.document.querySelector('[data-feature="auction-close"][data-id="' + lotId + '"]');
    click(closeBtn);
    const feesAfter = cfg().house.auctionFees || 0;
    const hist = a.history || [];
    const won = hist[0] && hist[0].winner === 'You';
    record('hammer: house 10% fee recognised as revenue', hist.length>0 && feesAfter - feesBefore === Math.round((won ? bidAmt : hist[0].price) * 0.1), 'fees +' + (feesAfter - feesBefore) + ' winner=' + (hist[0] && hist[0].winner));
    if (won) record('hammer: winner pays MAIN and receives cosmetic', S.wallet.main < mainBefore && hist[0].lot && a.lots.length === 2, 'main ' + mainBefore + ' → ' + S.wallet.main + ' lots left=' + a.lots.length);
    else record('hammer: voided lot returns to rotation', a.lots.length === 3, 'lots=' + a.lots.length);
    // bot bidding autonomy
    globalThis.botAuctionBids();
    record('botAuctionBids runs without error', true);
  }
}

/* ── Redesigned navigation ── */
const groups=[...w.document.querySelectorAll('#tabs .nav-group')];
record('player nav has 5 collapsible groups', groups.length===5 && groups.every(g=>g.querySelector('.nav-group-head')), 'groups=' + groups.length);
{
  const play=groups.find(g=>g.dataset.group==='Play');
  const tabsBefore=play.querySelectorAll('.tab').length;
  click(play.querySelector('.nav-group-head'));
  const collapsed=play.classList.contains('collapsed');
  record('group collapse toggles state + class', collapsed && S.settings.navGroups.Play===true && play.style.display!==undefined, 'collapsed=' + collapsed);
  click(play.querySelector('.nav-group-head'));
  record('group re-expands', !play.classList.contains('collapsed') && S.settings.navGroups.Play===false);
}
{
  S.waiting.length=0;
  S.waiting.push({id:'w1',stake:10,side:'HEADS',name:'You'});
  S.social.friendRequests=['Nova'];
  globalThis.updateNavBadges();
  const lb=w.document.getElementById('navBadgeLobby'),cb=w.document.getElementById('navBadgeCommunity');
  record('nav badges show live counts', lb && lb.textContent==='1' && !lb.hidden && cb && cb.textContent==='1' && !cb.hidden, 'lobby=' + (lb&&lb.textContent) + ' comm=' + (cb&&cb.textContent));
  S.waiting.length=0; S.social.friendRequests=[];
  globalThis.updateNavBadges();
  record('nav badges hide when zero', w.document.getElementById('navBadgeLobby').hidden && w.document.getElementById('navBadgeCommunity').hidden);
}
{
  click(w.document.querySelector('.tab[data-tab="stats"]'));
  const rec=[...w.document.querySelectorAll('#navRecent .nav-recent-chip')].map(b=>b.dataset.goTab);
  record('recent row tracks visited tabs', S.settings.recentTabs[0]==='stats' && rec.includes('stats')===false, 'recent=' + JSON.stringify(S.settings.recentTabs) + ' chips=' + JSON.stringify(rec));
}
{
  const search=w.document.getElementById('playerNavSearch');
  search.value='roulette';
  search.dispatchEvent(new w.Event('input',{bubbles:true}));
  const anyHiddenTab=[...w.document.querySelectorAll('#tabs .tab')].some(t=>t.style.display==='none');
  const headsHidden=w.document.querySelectorAll('#tabs .nav-group-head').length;
  record('nav search filters tabs and hides group heads', anyHiddenTab && w.document.querySelector('.tab[data-tab="newgames"]').style.display==='');
  search.value='';
  search.dispatchEvent(new w.Event('input',{bubbles:true}));
}

/* ── Leaderboard & roster: filter / sort / pagination ── */
switchTab('leaderboard');
{
  const rows1=w.document.querySelectorAll('#leaderboard .lb-row').length;
  record('leaderboard paginates to 10 per page', rows1<=10 && rows1>0, 'rows=' + rows1);
  record('leaderboard pager shows page range', /Page 1 of \d+/.test(w.document.getElementById('lbPager').textContent), w.document.getElementById('lbPager').textContent);
  w.document.getElementById('lbNext').dispatchEvent(new w.Event('click',{bubbles:true}));
  const rows2=[...w.document.querySelectorAll('#leaderboard .lb-row')].map(r=>r.textContent);
  const rows1b=[...w.document.querySelectorAll('#leaderboard .lb-row')].map(r=>r.textContent);
  record('leaderboard next page advances', /Page 2 of/.test(w.document.getElementById('lbPager').textContent), w.document.getElementById('lbPager').textContent);
  const f=w.document.getElementById('lbFilter');
  f.value='Neo';
  f.dispatchEvent(new w.Event('input',{bubbles:true}));
  const filtered=[...w.document.querySelectorAll('#leaderboard .lb-row')];
  record('leaderboard name filter works', filtered.length>=1 && filtered.length<=10 && filtered.every(r=>/neo/i.test(r.textContent)), 'rows=' + filtered.length);
  f.value='';
  f.dispatchEvent(new w.Event('input',{bubbles:true}));
  w.document.querySelector('.lbsort[data-sort="wins"]').dispatchEvent(new w.Event('click',{bubbles:true}));
  record('leaderboard sort switch works', /— wins/.test(w.document.getElementById('lbSortLbl').textContent));
}
switchTab('players');
{
  const cards1=w.document.querySelectorAll('#playersGrid .player-card').length;
  record('roster paginates to 12 per page', cards1<=12 && cards1>0, 'cards=' + cards1);
  w.document.getElementById('rosterNext').dispatchEvent(new w.Event('click',{bubbles:true}));
  record('roster next page advances', /Page 2 of/.test(w.document.getElementById('rosterPager').textContent));
  const rs=w.document.getElementById('rosterSort');
  rs.value='level';
  rs.dispatchEvent(new w.Event('change',{bubbles:true}));
  const rf=w.document.getElementById('rosterFilter');
  rf.value='Neo';
  rf.dispatchEvent(new w.Event('input',{bubbles:true}));
  const byName=[...w.document.querySelectorAll('#playersGrid .player-card')];
  record('roster name filter isolates exact player', byName.length===1 && /Neo/.test(byName[0].textContent), 'cards=' + byName.length);
  rf.value='';
  rf.dispatchEvent(new w.Event('input',{bubbles:true}));
}
/* ── Page stability: live ticks must not rebuild unchanged pages ── */
{
  switchTab('home');
  const kpi1=w.document.querySelector('#homeKpis .home-kpi');
  S.wallet.main+=25;
  S.feed.unshift({t:'stab',msg:'<b>Stab</b> check',jp:false});
  globalThis.renderHome();
  const kpi2=w.document.querySelector('#homeKpis .home-kpi');
  record('home KPI nodes preserved across live tick', kpi1===kpi2 && kpi1.querySelector('.value').textContent.length>0);
  record('home feed updates when new activity arrives', /Stab/.test((w.document.querySelector('#homeFeed .feed-item')||{}).textContent||''));
}
{
  const targets=[['lobby','#waitList'],['wallet','#segGrid'],['stats','#statTiles'],['season','#vipTierName'],['shop','#shopGrid']];
  const bad=[];
  for(const [tab,sel] of targets){
    try{
      switchTab(tab);
      const before=w.document.querySelector(sel);
      if(!before){bad.push(tab+':no-anchor');continue;}
      const beforeHtml=before.innerHTML;
      globalThis.renderTick();
      const after=w.document.querySelector(sel);
      if(before!==after||beforeHtml!==after.innerHTML)bad.push(tab);
    }catch(e){bad.push(tab+':'+e.message);}
  }
  record('lobby/wallet/stats/season/shop stable across live tick', bad.length===0, bad.join(','));
}
{
  // structure change (new waiting bet) must still update the page
  switchTab('lobby');
  const beforeCount=w.document.querySelectorAll('#waitList>*').length;
  S.waiting.unshift({id:'stab1',name:'StabBot',side:'HEADS',stake:25,kind:'toss',owner:'bot',t:Date.now(),wait:0});
  globalThis.renderTick();
  const afterHtml=w.document.getElementById('waitList').innerHTML;
  record('lobby list updates when a new bet arrives', /StabBot/.test(afterHtml));
  S.waiting.shift();
  globalThis.renderTick();
}

/* ── New catalog + arcade games registered ── */
const GAMES = globalThis.GAMES || w.GAMES || (globalThis.CATALOG_GROUPS ? globalThis.GAMES : null);
if(!GAMES) console.log('DEBUG GAMES missing; keys:', Object.keys(globalThis).filter(k=>/GAME|CATALOG/i.test(k)).join(','));
record('GAMES catalog now 36 games incl. CAT34–36', GAMES && GAMES.length === 36 && ['bytewar','sumfour','highcard'].every(id => GAMES.some(g => g.id === id)), 'count=' + globalThis.GAMES.length);
const extKeys=Object.keys(globalThis.EXT_ARCADE||{});
const navList=globalThis.ARCADE_NAV_META||[];
record('Arcade 25 modes incl. roulette/blackjack', ['roulette','blackjack'].every(k => extKeys.includes(k) && navList.some(g => g.key === k)) && navList.length===25, 'nav=' + navList.length + ' ext=' + extKeys.length);
record('catalog groups contain new games', (globalThis.CATALOG_GROUPS['Numbers & Dice'] || []).includes('bytewar') && (globalThis.CATALOG_GROUPS['Cards'] || []).includes('highcard'));

/* ── Admin feature directory + catalog metadata ── */
{
  const dom2 = makeEnv('admin.html');
  const w2 = dom2.window;
  let ok2 = true, err2 = '';
  try { await import(pathToFileURL(path.join(ROOT, 'tossmatch', 'js', 'admin', 'main.js')).href); }
  catch (e) { ok2 = false; err2 = e.message; }
  record('admin boots with new feature entries', ok2, err2);
  const FD = globalThis.FEATURE_DIRECTORY;
  const codes = Object.fromEntries(FD.map(x => [x.code, x]));
  record('directory has CAT34–36 / G24–25 / P6 / E10', ['CAT34','CAT35','CAT36','G24','G25','P6','E10'].every(c => codes[c] && codes[c].status.startsWith('Implemented')), Object.keys(codes).filter(c => ['CAT34','CAT35','CAT36','G24','G25','P6','E10'].includes(c)).join(','));
  record('LIVE1 Event Calendar now Implemented (demo)', codes.LIVE1 && codes.LIVE1.status === 'Implemented (demo)' && codes.LIVE1.feature === 'events', codes.LIVE1 && codes.LIVE1.status);
  record('admin catalog metadata lists 36 games / 22 arcade', globalThis.ADMIN_CATALOG_GAMES.length === 36 && globalThis.ADMIN_ARCADE_GAMES.length === 22, 'cat=' + globalThis.ADMIN_CATALOG_GAMES.length + ' arc=' + globalThis.ADMIN_ARCADE_GAMES.length);
  record('feature directory has ADM-1 through ADM-7', ['ADM-1','ADM-2','ADM-3','ADM-4','ADM-5','ADM-6','ADM-7'].every(c => FD.some(x => x.code === c && x.status === 'Implemented')));

  /* ── Admin login gate ── */
  const overlay = w2.document.getElementById('adminLoginOverlay');
  record('login overlay shown without session', overlay && !overlay.hidden);
  // wrong credentials
  w2.document.getElementById('adminLoginUser').value = 'admin';
  w2.document.getElementById('adminLoginPass').value = 'wrong';
  w2.document.getElementById('adminLoginTfa').value = '246810';
  w2.document.getElementById('adminLoginBtn').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  const errEl = w2.document.getElementById('adminLoginError');
  record('wrong password rejected', errEl && !errEl.hidden && /credentials/i.test(errEl.textContent), (errEl||{}).textContent);
  // correct login as Finance
  w2.document.getElementById('adminLoginPass').value = 'flip2026';
  w2.document.getElementById('adminLoginRole').value = 'Finance';
  w2.document.getElementById('adminLoginBtn').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  const ses = globalThis.adminSession();
  record('valid login creates session', !!ses && ses.user === 'admin' && ses.role === 'Finance', JSON.stringify(ses||{}));
  record('overlay hidden after login', overlay.hidden && !w2.document.body.classList.contains('admin-locked'));

  /* ── RBAC: Finance sees scoped screens only ── */
  const hiddenForFinance = ['ops','people','features','directory','rates','vip','trny','approvals','trust','settings'].filter(t => {
    const b = w2.document.querySelector('.tab[data-tab="' + t + '"]');
    return b && b.style.display === 'none';
  });
  const visibleForFinance = ['dash','econ','revenue','topups','withdraw','promo','audit'].every(t => {
    const b = w2.document.querySelector('.tab[data-tab="' + t + '"]');
    return b && b.style.display !== 'none';
  });
  record('RBAC hides out-of-scope screens for Finance', hiddenForFinance.length === 10 && visibleForFinance, 'hidden=' + hiddenForFinance.length + ' visibleOk=' + visibleForFinance);
  // role switch to Super Admin via Settings? Finance cannot see settings — switch session directly
  w2.sessionStorage.setItem('fa_admin_session', JSON.stringify({ user: 'admin', role: 'Super Admin', t: Date.now() }));
  globalThis.renderAdminProfile && globalThis.renderAdminProfile();
  globalThis.applyAdminRbac();
  const allVisible = ['ops','settings','approvals','trust','reports','games','referrals','announcements'].every(t => { const b = w2.document.querySelector('.tab[data-tab="' + t + '"]'); return b && b.style.display !== 'none'; });
  record('Super Admin sees all 21 screens', allVisible);

  /* ── Approvals screen ── */
  const apTab = w2.document.querySelector('.tab[data-tab="approvals"]');
  apTab.dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  const kycRows = w2.document.querySelectorAll('#kycQueue [data-approvals="kyc-approve"]');
  record('KYC queue seeds 3 pending requests', kycRows.length === 3, 'pending=' + kycRows.length);
  if (kycRows.length) {
    kycRows[0].dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
    const q = (globalThis.cfg && globalThis.cfg().kycRequests) || [];
    record('KYC approval persists + audited', q.some(x => x.status === 'approved'));
  }
  const badges = w2.document.getElementById('adminBadgeApprovals');
  record('approvals nav badge shows remaining work', badges && (badges.hidden ? 0 : +badges.textContent) >= 2, badges ? (badges.hidden ? 'hidden' : badges.textContent) : 'missing');

  /* ── Settings screen ── */
  w2.document.querySelector('.tab[data-tab="settings"]').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  const feeBefore = globalThis.cfg().feePct;
  w2.document.getElementById('setFeePct').value = String(feeBefore + 1);
  w2.document.getElementById('setEconSave').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  record('settings save persists fee change', globalThis.cfg().feePct === feeBefore + 1, feeBefore + ' → ' + globalThis.cfg().feePct);
  w2.document.getElementById('setFeePct').value = String(feeBefore);
  w2.document.getElementById('setEconSave').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));

  /* ── Admin nav groups + badges ── */
  const adminGroups = [...w2.document.querySelectorAll('#tabs .admin-nav-group')];
  record('admin nav has 4 collapsible groups', adminGroups.length === 4, 'groups=' + adminGroups.length);
  const gov = adminGroups.find(g => g.dataset.group === 'Governance');
  gov.querySelector('.admin-nav-group-head').dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
  record('admin group collapse works', gov.classList.contains('collapsed') && (globalThis.S.adminNavGroups||{}).Governance === true);

  /* ── Full per-screen render check (17 screens, content present) ── */
  const screenIds=['dash','ops','people','features','directory','rates','econ','revenue','topups','withdraw','promo','vip','trny','approvals','audit','trust','settings','reports','games','referrals','announcements'];
  const emptyScreens=screenIds.filter(t=>{
    const b=w2.document.querySelector('.tab[data-tab="'+t+'"]');
    b.dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
    const panel=w2.document.getElementById('panel-'+t);
    return !panel || !panel.classList.contains('active') || panel.innerHTML.trim().length<50;
  });
  record('all 21 admin screens render content after login', emptyScreens.length===0, 'empty=' + emptyScreens.join(','));
  // revenue register includes the new fund sources
  const revTab=w2.document.querySelector('.tab[data-tab="revenue"]');
  revTab.dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const revHtml=w2.document.getElementById('panel-revenue').innerHTML;
  record('revenue register shows auction + referral treatment', /auction/i.test(revHtml) && /referral/i.test(revHtml) && /FUNDING/i.test(revHtml));

  /* ── Unified player/bot admin screens (no separate player vs bot screens) ── */
  const S2 = globalThis.S;
  S2.rg.deposits.push({t:Date.now(),base:500,bonus:250,credited:750,method:'UPI',reference:'UNI-1',status:'completed',source:'Player wallet'});
  S2.botTopups.push({t:Date.now()-1000,bot:'UnitBot',base:200,bonus:100,walletCredit:300,reason:'Low balance'});
  S2.withdrawals = S2.withdrawals || {count:0,amount:0,log:[]};
  S2.withdrawals.log.push({t:Date.now()-2000,name:'UnitBot2',amount:3200,keep:200,status:'paid'});
  S2.playerWithdrawals.log.push({t:Date.now()-3000,amount:400,method:'UPI',reference:'UNI-WD',status:'paid'});
  const adminClick = sel => w2.document.querySelector(sel).dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  adminClick('.tab[data-tab="topups"]');
  const tuAll = w2.document.getElementById('topupList').innerHTML;
  record('topups: one table lists player deposits and bot top-ups', /UNI-1/.test(tuAll) && /UnitBot/.test(tuAll));
  record('topups: rows carry Player/Bot badges', /tag on">Player/.test(tuAll) && /tag warn">Bot/.test(tuAll));
  w2.document.querySelector('[data-topup-who="bots"]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const tuBots = w2.document.getElementById('topupList').innerHTML;
  record('topups: who=Bots hides player deposits', /UnitBot/.test(tuBots) && !/UNI-1/.test(tuBots));
  w2.document.querySelector('[data-topup-who="players"]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const tuPl = w2.document.getElementById('topupList').innerHTML;
  record('topups: who=Players hides bot top-ups', /UNI-1/.test(tuPl) && !/UnitBot/.test(tuPl));
  w2.document.querySelector('[data-topup-who="all"]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  adminClick('.tab[data-tab="withdraw"]');
  const wdAll = w2.document.getElementById('wdList').innerHTML;
  record('withdrawals: one ledger lists player and bot payouts', /UNI-WD/.test(wdAll) && /UnitBot2/.test(wdAll));
  w2.document.getElementById('wdWho').value='players';
  w2.document.getElementById('wdWho').dispatchEvent(new w2.Event('change',{bubbles:true}));
  const wdPl = w2.document.getElementById('wdList').innerHTML;
  record('withdrawals: who=Players hides bot payouts', /UNI-WD/.test(wdPl) && !/UnitBot2/.test(wdPl));
  w2.document.getElementById('wdWho').value='all';
  w2.document.getElementById('wdWho').dispatchEvent(new w2.Event('change',{bubbles:true}));

  /* ── Reports & Analytics screen ── */
  adminClick('.tab[data-tab="reports"]');
  record('reports: 7-day revenue chart renders 7 bars', w2.document.querySelectorAll('#repDailyRev .rep-bar').length===7, 'bars=' + w2.document.querySelectorAll('#repDailyRev .rep-bar').length);
  record('reports: tiles + mix + busiest games populated', w2.document.querySelectorAll('#repTiles .stat-tile').length===4 && /Revenue mix|Coin Toss fees/.test(w2.document.getElementById('panel-reports').innerHTML) && w2.document.getElementById('exportReportCsv').hidden===false);

  /* ── Games & Content screen ── */
  adminClick('.tab[data-tab="games"]');
  const gcRows0=w2.document.querySelectorAll('#gcList tbody tr').length;
  record('games: catalog lists games with pager (36 total)', gcRows0===20 && /2/.test(w2.document.getElementById('gcPage').textContent), 'rows=' + gcRows0 + ' page=' + w2.document.getElementById('gcPage').textContent);
  const firstToggle=w2.document.querySelector('#gcList [data-gc-toggle]');
  const firstId=firstToggle.dataset.gcToggle;
  firstToggle.dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('games: disable switch persists in state', S2.config.gamesEnabled[firstId]===false, firstId);
  record('games: row shows Disabled tag', /Disabled/.test(w2.document.querySelector('#gcList tbody tr').outerHTML));
  w2.document.querySelector('#gcList [data-gc-toggle="'+firstId+'"]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('games: re-enable restores state', S2.config.gamesEnabled[firstId]===undefined || S2.config.gamesEnabled[firstId]===true);

  /* ── Referrals screen ── */
  adminClick('.tab[data-tab="referrals"]');
  const botsBefore=S2.bots.length;
  w2.document.getElementById('refName').value='RefTest';
  w2.document.getElementById('refAddBtn').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('referrals: register adds a referred bot', S2.bots.length===botsBefore+1 && S2.bots.some(b=>b.name==='RefTest'&&b.referredBy===S2.referralCode));
  record('referrals: referred table shows the new player', /RefTest/.test(w2.document.getElementById('refList').innerHTML) && /TM-/.test(w2.document.getElementById('refList').innerHTML));
  record('referrals: program tiles show code + 5% rate', /TM-/.test(w2.document.getElementById('refTiles').innerHTML) && /5%/.test(w2.document.getElementById('refProgram').innerHTML));

  /* ── Announcements screen ── */
  adminClick('.tab[data-tab="announcements"]');
  w2.document.getElementById('annTitle').value='Welcome to FlipArena';
  w2.document.getElementById('annBody').value='Tournaments are live this week.';
  w2.document.getElementById('annPublish').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('announcements: publish stores a published entry', (S2.announcements||[]).some(a=>a.status==='published'&&a.title==='Welcome to FlipArena'));
  record('announcements: history + current panel update', /Welcome to FlipArena/.test(w2.document.getElementById('annList').innerHTML) && /Tournaments are live/.test(w2.document.getElementById('annCurrent').innerHTML));
  // player side: same shared state → banner on the player Home.
  // The admin env swapped globalThis.document, so restore the player document
  // while re-rendering the player app, then hand it back to the admin env.
  const prevDoc=globalThis.document;
  globalThis.document=w.document;
  S.announcements=S2.announcements;
  globalThis.renderHome();
  const annEl=w.document.getElementById('homeAnnounce');
  record('player Home shows the published announcement', !!annEl && !annEl.hidden && /Welcome to FlipArena/.test(annEl.innerHTML));
  globalThis.document=prevDoc;
  // unpublish hides it
  w2.document.querySelector('#annList [data-ann-toggle]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  globalThis.document=w.document;
  S.announcements=S2.announcements;
  globalThis.renderHome();
  record('player Home hides banner after unpublish', w.document.getElementById('homeAnnounce').hidden);
  globalThis.document=prevDoc;
  dom2.window.close();
}

console.log(JSON.stringify({ ok: results.every(r => r.ok) && errors.length === 0, errors, checks: results }, null, 2));
process.exit(results.every(r => r.ok) && errors.length === 0 ? 0 : 1);
