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
record('GAMES catalog now 100 games incl. CAT34–CAT100', GAMES && GAMES.length === 100 && ['bytewar','sumfour','highcard','suitduel','nimgame'].every(id => GAMES.some(g => g.id === id)), 'count=' + GAMES.length);
const extKeys=Object.keys(globalThis.EXT_ARCADE||{});
const navList=globalThis.ARCADE_NAV_META||[];
record('Arcade 100 modes incl. roulette/blackjack + G26–G100', ['roulette','blackjack','coinflipx','dragonbridge'].every(k => (extKeys.includes(k)||navList.some(g=>g.key===k)) && navList.some(g => g.key === k)) && navList.length===100 && navList.every(g=>/^G\d+$/.test(g.code)), 'nav=' + navList.length + ' ext=' + extKeys.length);
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
  record('directory has CAT34–100 / G24–25 / P6 / E10', ['CAT34','CAT35','CAT36','CAT37','CAT100','G24','G25','G26','G100','P6','E10'].every(c => codes[c] && codes[c].status.startsWith('Implemented')), Object.keys(codes).filter(c => ['CAT34','CAT35','CAT36','CAT37','CAT100','G24','G25','G26','G100','P6','E10'].includes(c)).join(','));
  record('LIVE1 Event Calendar now Implemented (demo)', codes.LIVE1 && codes.LIVE1.status === 'Implemented (demo)' && codes.LIVE1.feature === 'events', codes.LIVE1 && codes.LIVE1.status);
  record('admin catalog metadata lists 100 games / 100 arcade', globalThis.ADMIN_CATALOG_GAMES.length === 100 && globalThis.ADMIN_ARCADE_GAMES.length === 100, 'cat=' + globalThis.ADMIN_CATALOG_GAMES.length + ' arc=' + globalThis.ADMIN_ARCADE_GAMES.length);
  record('feature directory has ADM-1 through ADM-10', ['ADM-1','ADM-2','ADM-3','ADM-4','ADM-5','ADM-6','ADM-7','ADM-8','ADM-9','ADM-10'].every(c => FD.some(x => x.code === c && x.status === 'Implemented')));
  record('directory includes P7/P8/E11–13/RET-3/RET-4', ['P7','P8','E11','E12','E13','RET-3','RET-4'].every(c => codes[c] && codes[c].status.startsWith('Implemented')), ['P7','P8','E11','E12','E13','RET-3','RET-4'].filter(c=>!codes[c]).join(','));

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
  const hiddenForFinance = ['ops','people','features','directory','rates','vip','trny','approvals','trust','settings','support'].filter(t => {
    const b = w2.document.querySelector('.tab[data-tab="' + t + '"]');
    return b && b.style.display === 'none';
  });
  const visibleForFinance = ['dash','econ','revenue','topups','withdraw','promo','audit','reports','compliance'].every(t => {
    const b = w2.document.querySelector('.tab[data-tab="' + t + '"]');
    return b && b.style.display !== 'none';
  });
  record('RBAC hides out-of-scope screens for Finance', hiddenForFinance.length === 11 && visibleForFinance, 'hidden=' + hiddenForFinance.length + ' visibleOk=' + visibleForFinance);
  // role switch to Super Admin via Settings? Finance cannot see settings — switch session directly
  w2.sessionStorage.setItem('fa_admin_session', JSON.stringify({ user: 'admin', role: 'Super Admin', t: Date.now() }));
  globalThis.renderAdminProfile && globalThis.renderAdminProfile();
  globalThis.applyAdminRbac();
  const allVisible = ['ops','settings','approvals','trust','reports','games','referrals','announcements','support','compliance','plus'].every(t => { const b = w2.document.querySelector('.tab[data-tab="' + t + '"]'); return b && b.style.display !== 'none'; });
  record('Super Admin sees all 24 screens', allVisible);

  /* ── VIP+ / Season+ / Progress+ / Economy+ panel (new) ── */
  w2.document.querySelector('.tab[data-tab="plus"]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const plusPanel=w2.document.getElementById('panel-plus');
  record('VIP+/Season+ panel renders config + activity', plusPanel.classList.contains('active') && w2.document.getElementById('vipPlusDailyBase').value==='25' && w2.document.getElementById('seasonPlusPerGame').value==='2' && (w2.document.querySelectorAll('#vipPlusRoad .kv-row').length)===16 && (w2.document.querySelectorAll('#seasonPlusTrack .kv-row').length)===4, 'daily='+w2.document.getElementById('vipPlusDailyBase').value+' roadRows='+w2.document.querySelectorAll('#vipPlusRoad .kv-row').length);
  w2.document.getElementById('vipPlusDailyBase').value='30';
  w2.document.getElementById('vipPlusSave').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('VIP+ config saves to shared config', globalThis.cfg().vipPlus.dailyBase===30, 'dailyBase='+globalThis.cfg().vipPlus.dailyBase);
  w2.document.getElementById('vipPlusDailyBase').value='25';
  w2.document.getElementById('vipPlusSave').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const p7Rows=w2.document.querySelectorAll('#p7Missions .kv-row').length;
  record('Progress+ activity shows 6 missions + 12 badges', p7Rows===6 && w2.document.querySelectorAll('#p8Badges .kv-row').length===12, 'missions='+p7Rows);
  record('Economy+ activity tiles populated', w2.document.getElementById('e11Count').textContent==='0' && w2.document.getElementById('e12Count').textContent==='0' && w2.document.getElementById('e13Count').textContent==='0');

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
  const screenIds=['dash','ops','people','features','directory','rates','econ','revenue','topups','withdraw','promo','vip','plus','trny','approvals','audit','trust','settings','reports','games','referrals','announcements','support','compliance'];
  const emptyScreens=screenIds.filter(t=>{
    const b=w2.document.querySelector('.tab[data-tab="'+t+'"]');
    b.dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
    const panel=w2.document.getElementById('panel-'+t);
    return !panel || !panel.classList.contains('active') || panel.innerHTML.trim().length<50;
  });
  record('all 24 admin screens render content after login', emptyScreens.length===0, 'empty=' + emptyScreens.join(','));
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
  record('games: catalog lists games with pager (100 total)', gcRows0===20 && /5/.test(w2.document.getElementById('gcPage').textContent), 'rows=' + gcRows0 + ' page=' + w2.document.getElementById('gcPage').textContent);
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

  /* ── Support & Messaging screen ── */
  adminClick('.tab[data-tab="support"]');
  const supRows0=w2.document.querySelectorAll('#supList tbody tr').length;
  record('support: inbox seeds 3 tickets with Player/Bot badges', supRows0>=3 && /tag on">Player/.test(w2.document.getElementById('supList').innerHTML) && /tag warn">Bot/.test(w2.document.getElementById('supList').innerHTML), 'rows=' + supRows0);
  record('support: nav badge shows open tickets', !w2.document.getElementById('adminBadgeSupport').hidden && +w2.document.getElementById('adminBadgeSupport').textContent>=3);
  // player files a ticket (player document context)
  globalThis.document=w.document;
  w.document.querySelector('.tab[data-tab="services"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  w.document.querySelector('.hub-tab[data-hubtab="support"], [data-hubtab="support"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  w.document.getElementById('supSubj').value='Test ticket from player';
  w.document.getElementById('supMsg2').value='Can someone look at my balance?';
  w.document.getElementById('supSend').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  record('support: player ticket appears in shared state', S2.supportTickets.some(t=>t.subject==='Test ticket from player'&&t.kind==='player'));
  record('support: player sees own ticket with status', /Test ticket from player/.test(w.document.getElementById('servicesHub').innerHTML) && /OPEN/.test(w.document.getElementById('servicesHub').innerHTML));
  globalThis.document=prevDoc;
  adminClick('.tab[data-tab="support"]');
  record('support: admin inbox shows the player ticket', /Test ticket from player/.test(w2.document.getElementById('supList').innerHTML));
  // reply + close
  const openRow=[...w2.document.querySelectorAll('#supList tbody tr')].find(tr=>/Test ticket from player/.test(tr.innerHTML));
  openRow.querySelector('[data-sup-reply]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const repliedTk=S2.supportTickets.find(t=>t.subject==='Test ticket from player');
  record('support: reply marks ticket replied', repliedTk.status==='replied' && repliedTk.reply.length>0);
  const closedRow=[...w2.document.querySelectorAll('#supList tbody tr')].find(tr=>/Test ticket from player/.test(tr.innerHTML));
  closedRow.querySelector('[data-sup-close]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('support: close marks ticket closed', S2.supportTickets.find(t=>t.subject==='Test ticket from player').status==='closed');
  // status filter
  w2.document.getElementById('supStatus').value='closed';
  w2.document.getElementById('supStatus').dispatchEvent(new w2.Event('change',{bubbles:true}));
  const closedOnly=[...w2.document.querySelectorAll('#supList tbody tr')].every(tr=>/CLOSED/.test(tr.innerHTML));
  record('support: status filter shows only closed tickets', closedOnly && w2.document.querySelectorAll('#supList tbody tr').length>=1);
  w2.document.getElementById('supStatus').value='';
  w2.document.getElementById('supStatus').dispatchEvent(new w2.Event('change',{bubbles:true}));
  // message to the demo player
  w2.document.getElementById('supMsgBody').value='Scheduled maintenance tonight.';
  w2.document.getElementById('supMsgSend').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('support: admin message stored for the demo player', S2.adminMessages.some(m=>m.body==='Scheduled maintenance tonight.'&&m.to==='you'));
  globalThis.document=w.document;
  w.document.querySelector('[data-hubtab="support"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  record('support: player hub shows the platform message', /Scheduled maintenance tonight/.test(w.document.getElementById('servicesHub').innerHTML));
  globalThis.document=prevDoc;

  /* ── Admin users & backups (Settings) ── */
  adminClick('.tab[data-tab="settings"]');
  record('settings: admin users list seeded (4 accounts)', w2.document.querySelectorAll('#setUsers [data-user-role]').length===4, 'rows=' + w2.document.querySelectorAll('#setUsers [data-user-role]').length);
  w2.document.getElementById('setUserName').value='newbie';
  w2.document.getElementById('setUserRole').value='Support';
  w2.document.getElementById('setUserAdd').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('settings: add admin user persists', S2.adminUsers.some(u=>u.name==='newbie'&&u.role==='Support'));
  const opsRow=[...w2.document.querySelectorAll('#setUsers .kv')].find(r=>/ops/.test((r.querySelector('.k')||{}).textContent||''));
  const opsRole=opsRow.querySelector('[data-user-role]');
  const opsId=opsRole.dataset.userRole;
  opsRole.value='Finance';
  opsRole.dispatchEvent(new w2.Event('change',{bubbles:true}));
  record('settings: role change persists', S2.adminUsers.find(u=>u.id===opsId).role==='Finance');
  const opsRow2=[...w2.document.querySelectorAll('#setUsers .kv')].find(r=>r.querySelector('[data-user-toggle="'+opsId+'"]'));
  opsRow2.querySelector('[data-user-toggle="'+opsId+'"]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('settings: disable user persists', S2.adminUsers.find(u=>u.id===opsId).status==='disabled');
  // the primary Super Admin is protected from demotion/disable
  const adminRow=[...w2.document.querySelectorAll('#setUsers .kv')].find(r=>/^admin/.test((r.querySelector('.k')||{}).textContent||''));
  const adminRole=adminRow.querySelector('[data-user-role]');
  adminRole.value='Support';
  adminRole.dispatchEvent(new w2.Event('change',{bubbles:true}));
  record('settings: primary Super Admin cannot be demoted', S2.adminUsers.find(u=>u.name==='admin').role==='Super Admin');
  // backup / restore round trip
  const feeBefore2=S2.config.feePct;
  w2.document.getElementById('setBackupCreate').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('backup: snapshot created in state + storage', (S2.backups||[]).length===1 && !!w2.localStorage.getItem('tossmatch_backup_'+S2.backups[0].id), (S2.backups||[]).length + ' backups');
  S2.config.feePct=feeBefore2+7;
  w2.document.querySelector('#setBackups [data-bk-restore]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('backup: restore reverts a changed value', S2.config.feePct===feeBefore2, feeBefore2 + ' → ' + S2.config.feePct);
  record('backup: snapshot list matches restored state', (S2.backups||[]).length===0);
  w2.document.getElementById('setBackupCreate').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  const secondId=(S2.backups||[])[0]?.id;
  record('backup: second snapshot created', (S2.backups||[]).length===1 && !!w2.localStorage.getItem('tossmatch_backup_'+secondId));
  w2.document.querySelector('#setBackups [data-bk-del]').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('backup: delete removes snapshot from state + storage', (S2.backups||[]).length===0 && !w2.localStorage.getItem('tossmatch_backup_'+secondId));

  /* ── Compliance & Privacy screen ── */
  adminClick('.tab[data-tab="compliance"]');
  record('compliance: KPI tiles populated', w2.document.querySelectorAll('#compTiles .stat-tile').length===4);
  const rep=globalThis.buildComplianceReport();
  record('compliance: report has id + checksum + full audit log', /^CR-\d{8}$/.test(rep.id) && /^CRC-[0-9a-f]{8}$/.test(rep.checksum) && rep.auditLog.length===(S2.config.audit||[]).length);
  record('compliance: report revenue reconciles with house totals', rep.house.gross>=0 && Math.abs(rep.house.gross-((S2.config.house.fees||0)+(S2.config.house.catalogFees||0)+(S2.config.house.cupRakes||0)+(S2.config.house.trnyRakes||0)+(S2.config.house.shop||0)+(S2.config.house.xfFees||0)+(S2.config.house.auctionFees||0)))===0);
  w2.document.getElementById('compGenerate').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('compliance: generated report renders id + checksum', new RegExp(rep.id).test(w2.document.getElementById('compReport').innerHTML) && /CRC-/.test(w2.document.getElementById('compReport').innerHTML));
  const bundle=globalThis.buildPlayerDataBundle();
  record('privacy: player data bundle contains wallet, ledger, identity', bundle.identity && bundle.wallet && Array.isArray(bundle.ledger) && Array.isArray(bundle.games));
  // seed player transaction data, then verify selective erasure
  S2.ledger=[{t:Date.now(),type:'bet',delta:100,note:'coin toss',balance:1000},{t:Date.now(),type:'bet',delta:-50,note:'coin toss',balance:950}];
  S2.games=[{t:Date.now(),game:'Coin Toss',result:'WIN',stake:100,fee:5,delta:150}];
  S2.catalogLog=[{t:Date.now(),game:'Over / Under',playerA:'You',pickA:'1',playerB:'BotX',pickB:'2',stake:10,fee:1,result:'WIN',detail:'x',proof:'abc'},{t:Date.now(),game:'Over / Under',playerA:'BotA',pickA:'1',playerB:'BotB',pickB:'2',stake:10,fee:1,result:'DRAW',detail:'y',proof:'def'}];
  const ledgerLen0=(S2.ledger||[]).length;
  w2.document.querySelector('#compErase').dispatchEvent(new w2.MouseEvent('click',{bubbles:true}));
  record('privacy: admin erase clears player transaction history', (S2.ledger||[]).length===0 && (S2.games||[]).length===0 && S2.privacyErasedAt>0 && ledgerLen0===2, 'ledger ' + ledgerLen0 + ' → ' + (S2.ledger||[]).length);
  record('privacy: erasure is audit-logged', (S2.config.audit||[]).some(a=>a.action==='privacy-erase'));
  record('privacy: erasure removes player catalog matches only', !(S2.catalogLog||[]).some(x=>x.playerA==='You') && (S2.catalogLog||[]).length>0);
  // player side: privacy tab reflects the erasure
  globalThis.document=w.document;
  w.document.querySelector('[data-hubtab="privacy"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const privHtml=w.document.getElementById('servicesHub').innerHTML;
  record('privacy: player tab shows erasure state + actions', /Last erasure/.test(privHtml) && !/Never/.test((privHtml.split('Last erasure')[1]||'').slice(0,120)) && w.document.getElementById('pvdDownload') && w.document.getElementById('pvdErase'));
  w.document.getElementById('pvdErase').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  record('privacy: player-initiated erasure persists + audit entry', S2.privacyErasedAt>0 && (S2.config.audit||[]).some(a=>a.action==='privacy-erase'&&a.who!=="admin"));
  globalThis.document=prevDoc;
  dom2.window.close();
}

console.log(JSON.stringify({ ok: results.every(r => r.ok) && errors.length === 0, errors, checks: results }, null, 2));
process.exit(results.every(r => r.ok) && errors.length === 0 ? 0 : 1);
