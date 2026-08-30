/* FlipArena player module — render */
import "../shared/runtime.js";
import {applyTheme,renderNavTheme} from "../shared/theme.js";
import {bc} from "./boot.js";
import {ACHIEVEMENTS,COS,FREE_EMOJIS,HISTORY,QUESTS_SEED,SHOP_CATS,currentVipEntitlements,sessionStart} from "./bots.js";
import {VIP_BENEFITS,VIP_DISC,VIP_SEED} from "./data.js";
import {botByName} from "./games.js";
import {$,applyAccessibility,applyLanguage,closeNavDrawer,fmt,maxStake,playerTopupAnalytics,recordRecentTab,renderCommunityHub,renderNavRecent,renderEconomyHub,renderFeatureHubs,renderHome,renderNewGamesHub,renderProgressionHub,renderServicesHub,skillTier,syncPlayerNavigation,toast,updateNavBadges,vipFor} from "./helpers.js";
import {cfg,reconcileHouse,save} from "./state.js";
import {GAMES,renderGames} from "./sync.js";

/* Element lookup that never throws: targeted rendering must survive a panel
   that has not been mounted yet (e.g. a hub rendered lazily on first open). */
function el(id){const n=document.getElementById(id);if(!n&&!el._warned[id]){el._warned[id]=1;console.warn("renderChrome: missing element #"+id);}return n;}
el._warned={};

/* ── Targeted rendering ─────────────────────────────────────────────────────
   renderChrome() → header, wallet, coin and jackpot tickers only.
   renderTab(tab) → only the widgets that belong to the active tab.
   renderTick()   → chrome + active tab live widgets (used by background sync).
   render()       → full boot / theme / all-tab initialisation.              */
let activeTab="home";
const LB_VIEW={page:1,size:10};
let lbFilter="";
const ROSTER_VIEW={page:1,size:12,sort:"net"};
let rosterFilter="";
function pagerHTML(view,total,size,prev,next){
  const pages=Math.max(1,Math.ceil(total/size));
  if(pages<=1)return total?`<span class="muted">${total} shown</span>`:'';
  return `<button class="btn btn-sm btn-ghost" ${prev} ${view.page<=1?'disabled':''}>← Prev</button><span class="muted">Page ${view.page} of ${pages} · ${size} per page</span><button class="btn btn-sm btn-ghost" ${next} ${view.page>=pages?'disabled':''}>Next →</button>`;
}
function setActiveTab(tab){activeTab=tab;}

function renderChrome(){
  try{applyNavGroups();renderNavRecent();updateNavBadges();}catch(e){}
  const c=cfg();reconcileHouse();
  const mainVal=el("mainVal");if(mainVal)mainVal.textContent=fmt(S.wallet.main);
  const jpVal=el("jpVal");if(jpVal)jpVal.textContent=fmt(S.jackpot);
  const jpMeter=el("jpMeter");if(jpMeter)jpMeter.classList.toggle("armed",S.jackpot>=c.jpArm);
  const maintBanner=el("maintBanner");if(maintBanner)maintBanner.style.display=c.features.maintenance?"block":"none";
  if(c.broadcast){const b=el("broadcast");if(b){b.innerHTML="\uD83D\uDCE3 "+c.broadcast;b.classList.add("show");}}
  else{const b=el("broadcast");if(b)b.classList.remove("show");}
  applyTheme();
  try{renderNavTheme();}catch(e){}
  const togSound=el("togSound");if(togSound){togSound.classList.toggle("on",S.settings.sound);togSound.textContent=S.settings.sound?"\uD83D\uDD0A Sound":"\uD83D\uDD07 Muted";}
  const togInstant=el("togInstant");if(togInstant)togInstant.classList.toggle("on",S.settings.instant);
  const autoStop=Math.min(-50,Math.max(-10000,+(S.settings.autoRebetStop??-200)));S.settings.autoRebetStop=autoStop;
  const togAuto=el("togAuto");if(togAuto){togAuto.classList.toggle("on",S.settings.autoRebet);togAuto.textContent=S.settings.autoRebet?`\uD83D\uDD01 Auto Bet ON \u00B7 stop ${autoStop}`:`\uD83D\uDD01 Auto Bet \u00B7 stop ${autoStop}`;}
  const autoBetConfig=el("autoBetConfig");if(autoBetConfig)autoBetConfig.classList.toggle("active",S.settings.autoRebet);
  const autoStopInput=el("autoStopInput");if(autoStopInput&&document.activeElement!==autoStopInput)autoStopInput.value=autoStop;
  document.querySelectorAll("[data-auto-stop]").forEach(b=>b.classList.toggle("active",+b.dataset.autoStop===autoStop));
  const togPrivate=el("togPrivate");if(togPrivate){togPrivate.classList.toggle("on",isPrivate);togPrivate.textContent=isPrivate?"\uD83D\uDD12 Private":"\uD83D\uDD13 Public";}
  const coinEl=el("coin");if(coinEl)coinEl.className="coin skin-"+S.equipped.skin+(S.settings.instant?" fast":"");
  const coinStage=el("coinStage");if(coinStage)coinStage.style.background=COS.themes.find(t=>t.id===S.equipped.theme).bg||"";
  const skinLbl=el("skinLbl");if(skinLbl)skinLbl.textContent=(COS.skins.find(s=>s.id===S.equipped.skin)||{}).name||"";
  const vip=vipFor(S.monthWagered),vipEnt=currentVipEntitlements();
  const feeNote=el("feeNote");
  if(feeNote)feeNote.innerHTML=`${c.feePct}% fee \u00B7 jackpot from fee \u00B7 max stake <b>${maxStake()}</b> \u00B7 you: <span class="vip-dot" style="background:${vip.color}"></span>${vip.name} (${vip.rakeback}% rakeback${vipEnt.queuePriority?' \u00B7 priority queue':''})`;
  const mins=Math.floor((Date.now()-sessionStart)/60000);
  const sessionInfo=el("sessionInfo");
  if(sessionInfo)sessionInfo.textContent=`\u23F1 ${mins}m \u00B7 session ${sessionNet>=0?'+':''}${fmt(sessionNet)}`;
}

/* Tab → widget renderer map. Only the active tab's widgets are touched. */
const TAB_RENDERERS={
  home:()=>renderHome(),
  lobby:()=>{renderWait();renderFeed();},
  play:()=>renderRecent(),
  series:()=>renderSeries(),
  games:()=>{if(!gamesMounted){renderGames();gamesMounted=true;}},
  newgames:()=>renderNewGamesHub(),
  leaderboard:()=>renderLeaderboard(),
  players:()=>renderPlayers(),
  community:()=>renderCommunityHub(),
  progressionplus:()=>renderProgressionHub(),
  economyplus:()=>renderEconomyHub(),
  shop:()=>renderShop(),
  season:()=>renderSeason(),
  updates:()=>{},
  wallet:()=>renderWallet(),
  stats:()=>{renderStats();renderHistory();},
  services:()=>renderServicesHub(),
};

/** Render a single tab's widgets in isolation (no full-page reflow). */
function renderTab(tab){
  const key=tab||activeTab,fn=TAB_RENDERERS[key];
  if(!fn)return false;
  try{fn();}catch(e){console.warn("renderTab("+key+") error:",e);}
  return true;
}

/** Background/periodic refresh: chrome + the active tab only. */
function renderTick(){
  // Live data updates must never reflow the page: every innerHTML write below
  // merges in place when the structure is unchanged (no screen shake).
  withPatchedDom(()=>{
    renderChrome();
    updateNavBadges();
    renderTab(activeTab);
    if(activeTab==="games"&&S.waiting.some(b=>b.kind==="catalog"&&b.catalogGame===activeGame)){try{renderGamePanel();}catch(e){}}
  });
}

/** Full initialisation: chrome, every tab, hubs, theme, accessibility. */
function render(){
  renderChrome();
  for(const key in TAB_RENDERERS){try{TAB_RENDERERS[key]();}catch(e){console.warn("render("+key+") error:",e);}}
  renderHome();renderRecent();renderWait();renderFeed();renderLeaderboard();renderShop();renderSeason();renderWallet();renderStats();
  renderSeries();renderPlayers();renderHistory();
  // Mini-game panels contain live controls and animations. Mount them once;
  // each game updates its own panel so background refreshes never erase input.
  if(!gamesMounted){renderGames();gamesMounted=true;}
  if(!featureHubsMounted)renderFeatureHubs();
  if(!servicesMounted)renderServicesHub();
  applyLanguage();applyAccessibility();
  if((S.turbo||1)<=5) save();
}
function renderRecent(){
  const el=$("recentGames"),chat=COS.colours.find(c=>c.id===S.equipped.colour),chatStyle=chat&&chat.hex&&!['rainbow','glitch'].includes(chat.hex)?`color:${chat.hex};font-weight:700`:S.equipped.colour==="rainbow"?'color:var(--gold);font-weight:800':S.equipped.colour==="glitch"?'color:#f43f5e;font-weight:900;text-shadow:1px 0 #22d3ee':'';
  if(!S.games.length){el.innerHTML='<div class="empty">No games yet — place your first bet!</div>';return;}
  el.innerHTML=S.games.slice(0,12).map(g=>{
    const yw=g.winner==="you";
    const reacts=S.reactions[g.id]||{};
    const allRe=[...FREE_EMOJIS,...COS.emojis.filter(e=>S.owned.emojis.includes(e.id)).map(e=>e.ch)];
    return `<div class="hist-row">
      <span class="hist-res ${g.result.toLowerCase()}">${g.result} ${g.verified?'<span class="fair-chip">✓fair</span>':''}</span>
      <div><b>${g.oppName}</b> ${g.oppFlag||""} · stake ${fmt(g.stake)} · #${g.id}
        <div class="hist-meta">fee ${fmt(g.fee)}${g.jpPayout?' · 🎰 +'+fmt(g.jpPayout):''}${g.taunt?` · <span style="${chatStyle}">“${g.taunt}”</span>`:''}</div>
        <div class="react-bar">${allRe.map(e=>`<button class="react-btn" data-gid="${g.id}" data-e="${e}">${e}<span class="rc">${reacts[e]||0}</span></button>`).join("")}</div>
      </div>
      <span class="hist-amt ${yw?'win':'lose'}">${yw?'+':'−'}${fmt(Math.abs(g.delta))}</span>
    </div>`;
  }).join("");
}
function playerAviHTML(size){
  const av=S.equipped.avatar;
  const a=COS.avatars.find(x=>x.id===av);
  const ch=a?a.ch:"🫵";
  const fr=COS.frames.find(f=>f.id===S.equipped.frame)||COS.frames[0],frameClass=fr.cls&&fr.cls.startsWith("frame-")?`frame ${fr.cls}`:"frame",frameStyle=fr.id!=="none"&&fr.cls&&!fr.cls.startsWith("frame-")?fr.cls:"";
  return `<span class="avi-circle" style="width:${size}px;height:${size}px;font-size:${size*0.55}px">${ch}<span class="${frameClass}" style="${frameStyle}"></span></span>`;
}
function playerFlag(){return S.equipped.flag?(COS.flags.find(f=>f.id===S.equipped.flag)||{}).ch||"":"";}
function playerName(){return S.playerName||"You";}
function renderWait(){
  const el=$("waitList");
  const bets=[...S.waiting].sort((a,b)=>(S.social.friends.includes(b.owner)?1:0)-(S.social.friends.includes(a.owner)?1:0)||(b.priority?1:0)-(a.priority?1:0)||(b.wait||0)-(a.wait||0));
  if(!bets.length){el.innerHTML='<div class="empty">No open bets. Post one to be matched!</div>';return;}
  el.innerHTML=bets.map(b=>{
    const you=b.owner==="you",hidePick=b.kind==="catalog"&&!you,pick=hidePick?"🎭 hidden":String(b.side??b.pick??"AUTO"),sideClass=!hidePick&&["HEADS","TAILS"].includes(pick)?pick.toLowerCase():"";
    const avi=you?playerAviHTML(22):(b.avi||"🙂"),gameLabel=b.gameName||((b.kind||"toss")==="toss"?"Coin Toss":b.kind);
    return `<div class="wait-item">
      <span class="wi-avi">${avi}</span>
      <div class="wi-main">
        <div class="wi-name">${b.name} ${you?'<span style="color:var(--gold)">(you)</span>':''} ${S.social.friends.includes(b.owner)?'<span class="ttl">FRIEND</span>':''} ${b.priority?'<span class="ttl">VIP PRIORITY</span>':''} ${b.privateLock?'<span class="wi-lock">🔒</span>':''}</div>
        <div class="wi-meta">${gameLabel} · ${fmt(b.stake)} coins · ${b.wait||0}s waiting${!you?` · ${skillTier(botByName(b.owner)?.games||0,botByName(b.owner)?.wins||0)} skill`:''}</div>
      </div>
      <span class="wi-side ${sideClass}">${pick}</span>
      ${you?`<button class="btn btn-sm btn-danger" data-cancel="${b.id}">Cancel</button>`:
        b.kind==="toss"?(!b.privateLock?`<button class="btn btn-sm btn-primary" data-take="${b.id}">Take</button>`:`<button class="btn btn-sm btn-ghost" data-take="${b.id}">Take</button>`):b.kind==="catalog"?`<button class="btn btn-sm btn-primary" data-takecatalog="${b.id}">Take</button>`:'<span class="muted">auto-match</span>'}
    </div>`;
  }).join("");
}
function renderFeed(){
  const el=$("feed");
  if(!S.feed.length){el.innerHTML='<div class="empty">Activity appears here…</div>';return;}
  el.innerHTML=S.feed.slice(0,40).map(f=>`<div class="feed-item ${f.jp?'jp':''}"><span class="ft">${f.t}</span>${f.msg}</div>`).join("");
}
function botAvi(b,size){
  const skinCls=b.skin?("skin-"+b.skin):"skin-classic";
  // mini coin for the bot's equipped skin, plus its persona emoji
  return `<span style="display:inline-flex;align-items:center;gap:4px"><span class="mini-coin ${skinCls}" style="width:${size}px;height:${size}px"><span class="face heads">H</span></span><span style="font-size:${size*0.85}px">${b.avi}</span></span>`;
}
function renderLeaderboard(){
  const playerVip=vipFor(S.monthWagered),ent=currentVipEntitlements();
  const f=lbFilter.trim().toLowerCase();
  const players=[{name:playerName(),avi:playerAviHTML(18),flag:playerFlag(),level:S.level,wins:S.stats.wins,losses:S.stats.losses,streak:S.streak,net:S.stats.net,you:true,games:S.stats.games,vip:playerVip},
    ...S.bots.map(b=>({name:b.name,avi:botAvi(b,16),flag:b.flag,level:b.level,wins:b.wins||0,losses:b.losses||0,streak:b.streak,net:b.net,games:b.games||0,bot:b}))].filter(p=>!f||p.name.toLowerCase().includes(f));
  players.sort((a,b)=>(b[lbSort]||0)-(a[lbSort]||0));
  const total=players.length,pages=Math.max(1,Math.ceil(total/LB_VIEW.size));
  if(LB_VIEW.page>pages)LB_VIEW.page=pages;
  const med=["🥇","🥈","🥉"];
  $("leaderboard").innerHTML=total?players.slice((LB_VIEW.page-1)*LB_VIEW.size,LB_VIEW.page*LB_VIEW.size).map((p,off)=>{
    const i=(LB_VIEW.page-1)*LB_VIEW.size+off;
    const t=p.streak>=5?"⚡ UNSTOPPABLE":(p.streak>=3?"🔥 HOT":(S.stats.jackpots>0&&p.you?"🎰 LUCKY":(p.bot&&p.bot.jackpots>0?"🎰 JACKPOT":"")));
    const nameHtml=p.you?`<span class="${ent.goldName?'vip-name-legend':ent.title?'vip-name-royal':''}">${p.name}</span> <span class="ttl">💎 ${playerVip.name}${ent.title?' · '+ent.title:''}</span>`:p.name;
    return `<div class="lb-row ${p.you?'you':''}" ${p.bot?`data-bot="${p.bot.name}" style=cursor:pointer`:""} title="${p.bot?'View '+p.bot.name+' profile':''}">
      <span class="lb-rank">${i<3?med[i]:i+1}</span>
      <span class="lb-name">${p.avi}${nameHtml} ${p.flag}${t?`<span class="ttl">${t}</span>`:""}</span>
      <span class="lb-val">${p.net>=0?'+':''}${fmt(p.net)}</span>
      <span class="lb-sub">W${p.wins}${p.games?' · '+p.games+'g':''} · Lv${p.level}${p.streak>0?' · 🔥'+p.streak:''}</span>
    </div>`;
  }).join(""):'<div class="empty">No players match this filter.</div>';
  $("lbPager").innerHTML=pagerHTML(LB_VIEW,total,LB_VIEW.size,'id="lbPrev"','id="lbNext"');
  $("lbSortLbl").textContent="— "+({net:"net",wins:"wins",streak:"streak",games:"games",level:"level"})[lbSort];
}
let shopCatData=()=>COS[shopCat]||[];
function renderShop(){
  $("shopCats").innerHTML=SHOP_CATS.map(c=>`<button class="qchip ${shopCat===c.id?'active':''}" data-shopcat="${c.id}">${c.name}</button>`).join("");
  const items=COS[shopCat]||[];
  const vip=vipFor(S.monthWagered),disc=VIP_DISC[vip.tier]||0;
  const owned=S.owned[shopCat]||[],eq=S.equipped[shopCat==="emojis"?"":shopCat];
  $("shopGrid").innerHTML=items.map(it=>{
    const isOwn=owned.includes(it.id);
    const isEq = shopCat!=="emojis" && S.equipped[shopCat.slice(0,-1)||shopCat]===it.id;
    const price=it.price===0?0:Math.round(it.price*(1-disc/100));
    let visual="";
    if(shopCat==="skins")visual=`<div class="mini-coin skin-${it.id}"><div class="face heads">H</div></div>`;
    else if(shopCat==="flags")visual=`<div class="flag-emoji">${it.ch}</div>`;
    else if(shopCat==="avatars")visual=`<div class="mini-avi">${it.ch}</div>`;
    else if(shopCat==="frames")visual=`<div class="mini-avi"><span class="frame ${it.cls&&it.cls.startsWith('frame-')?it.cls:''}" style="${it.id!=='none'&&it.cls&&!it.cls.startsWith('frame-')?it.cls:''}"></span>👤</div>`;
    else if(shopCat==="colours")visual=`<div class="swatch" style="background:${it.hex==='rainbow'?'linear-gradient(135deg,#f87171,#fbbf24,#34d399,#60a5fa,#c084fc)':(it.hex==='glitch'?'repeating-linear-gradient(45deg,#f43f5e,#f43f5e 3px,#fff 3px,#fff 6px)':it.hex)}"></div>`;
    else if(shopCat==="fx")visual=`<div style="font-size:30px">${it.emojis[0]}</div>`;
    else if(shopCat==="themes")visual=`<div class="swatch" style="background:${it.bg||'#0b1020'};background-size:cover"></div>`;
    else if(shopCat==="sounds")visual=`<div style="font-size:30px">🎵</div>`;
    else if(shopCat==="emojis")visual=`<div style="font-size:32px">${it.ch}</div>`;
    const eqKey = {skins:"skin",flags:"flag",avatars:"avatar",frames:"frame",colours:"colour",fx:"fx",themes:"theme",sounds:"sound"}[shopCat];
    const equipped = eqKey && S.equipped[eqKey]===it.id;
    return `<div class="skin-card ${isOwn?'owned':''} ${equipped?'equipped':''}">
      ${visual}
      <div class="sn">${it.name}${it.vip?` <span class="ttl-badge">VIP ${VIP_SEED.find(v=>v.tier===it.vip).name}</span>`:""}</div>
      <span class="rarity ${it.rarity}">${it.rarity}</span>
      <div class="sp">${it.vipOnly?"VIP REWARD":it.price===0?"FREE":fmt(price)+" 🪙"}${disc>0&&it.price>0?` <span style="color:var(--green);font-size:10px">−${disc}%</span>`:""}</div>
      ${shopCat==="emojis"?(isOwn?`<button class="btn btn-sm btn-ghost" disabled>✓ Owned</button>`:`<button class="btn btn-sm btn-ghost" data-buy="${it.id}">Buy</button>`):
        equipped?`<button class="btn btn-sm btn-ghost" disabled>✓ Equipped</button>`:
        isOwn?`<button class="btn btn-sm btn-primary" data-equip="${it.id}">Equip</button>`:
        it.vipOnly?`<button class="btn btn-sm btn-ghost" disabled>🔒 Reach ${VIP_SEED.find(v=>v.tier===it.vip).name}</button>`:
        (it.vip&&vip.tier<it.vip)?`<button class="btn btn-sm btn-ghost" disabled>🔒 ${VIP_SEED.find(v=>v.tier===it.vip).name}+</button>`:
        `<button class="btn btn-sm btn-ghost" data-buy="${it.id}">Buy</button>`}
    </div>`;
  }).join("");
}
function renderSeason(){
  const vip=vipFor(S.monthWagered);
  $("vipTierName").innerHTML=`<span class="vip-dot" style="background:${vip.color}"></span>${vip.name} · ${vip.rakeback}% rakeback`;
  $("vipWagered").textContent=fmt(S.monthWagered);
  const next=cfg().vip.find(v=>v.wagered>S.monthWagered);
  if(next){const prev=cfg().vip[cfg().vip.indexOf(vip)];const span=next.wagered-prev.wagered;$("vipBar").style.width=Math.min(100,((S.monthWagered-prev.wagered)/span)*100)+"%";$("vipNext").textContent=`${fmt(next.wagered-S.monthWagered)} to ${next.name} (${next.rakeback}%) · resets 1st UTC`;}
  else{$("vipBar").style.width="100%";$("vipNext").textContent="Legend — max tier, 20% rakeback.";}
  const ent=currentVipEntitlements(),benefits=VIP_BENEFITS[vip.tier]||[],$max=cfg().vip.find(v=>v.tier===(S.vipUnlockedTier||1))||cfg().vip[0];
  $("vipBenefits").innerHTML=benefits.map(x=>`<div style="padding:3px 0">✓ ${x}</div>`).join('')+`<div style="padding-top:6px;color:var(--gold)">Shop −${ent.shopDiscount}% · Tournament −${ent.tournamentDiscount}%${ent.queuePriority?' · Priority queue':''}${ent.title?' · '+ent.title:''}</div>`;
  $("vipPermanent").innerHTML=`Highest VIP reached: <b>${$max.name}</b> · VIP cosmetic and emoji unlocks remain owned after monthly reset.`;
  $("vipList").innerHTML=cfg().vip.map(v=>`<div class="vip-tier ${v.tier===vip.tier?'cur':''}"><span class="vip-dot" style="background:${v.color}"></span><b>${v.name}</b><span class="muted" style="margin-left:auto">${fmt(v.wagered)}/mo · ${v.rakeback}% · ${(VIP_BENEFITS[v.tier]||[]).slice(1,3).join(' · ')}</span></div>`).join("");
  $("rakebackPending").textContent=fmt(S.accruedRakeback);
  const en=cfg().features.quests;
  $("quests").innerHTML = en ? QUESTS_SEED.map(q=>{
    const prog=Math.min(q.target,S.quests[q.id]||0),done=prog>=q.target,claimed=S.quests.claimed[q.id];
    return `<div class="quest"><div class="qt"><span>${q.icon} ${q.goal}</span><span class="qr">+${q.reward}🪙</span></div>
      <div class="qbar"><i style="width:${(prog/q.target)*100}%"></i></div><div class="muted" style="font-size:11px;margin-top:4px">${prog}/${q.target}</div>
      ${done&&!claimed?`<button class="btn btn-sm btn-primary qclaim" data-quest="${q.id}" style="margin-top:6px">Claim +${q.reward}</button>`:claimed?'<div class="muted" style="font-size:11px;margin-top:4px;color:var(--green)">✓ Claimed</div>':""}</div>`;
  }).join("") : '<div class="muted">Quests are currently disabled by the admin.</div>';
  $("streakDays").textContent=S.login.streak+" day"+(S.login.streak===1?"":"s");
  $("streakReward").textContent=fmt(Math.min(175,50+25*S.login.streak))+" 🪙";
  $("seasonNum").textContent="#"+cfg().seasonNumber;
  $("seasonEnds").textContent=new Date(cfg().seasonEnds).toUTCString().replace(":00 GMT"," UTC");
  // achievements
  $("achList").innerHTML=ACHIEVEMENTS.map(a=>{
    const u=S.achievements[a.id];
    return `<div class="ach ${u?'unlocked':''}"><div class="ai">${a.icon}</div><div><div class="an">${a.name}</div><div class="ad">${a.desc} · +${a.rew}</div></div></div>`;
  }).join("");
  // trophy cab
  $("trophyCab").innerHTML=`
    <div class="ach ${S.stats.cupsWon?'unlocked':''}"><div class="ai">⚔️</div><div><div class="an">Cup Wins</div><div class="ad">${S.stats.cupsWon} Series Cups won</div></div></div>
    <div class="ach ${S.stats.trnysWon?'unlocked':''}"><div class="ai">🏆</div><div><div class="an">Tournaments</div><div class="ad">${S.stats.trnysWon} tournament titles</div></div></div>
    <div class="ach ${S.stats.jackpots?'unlocked':''}"><div class="ai">🎰</div><div><div class="an">Jackpots</div><div class="ad">${S.stats.jackpots} jackpot hits</div></div></div>
    <div class="ach"><div class="ai">🔥</div><div><div class="an">Best Streak</div><div class="ad">${S.bestStreak} wins in a row</div></div></div>`;
}
function renderWallet(){
  const w=S.wallet;
  $("segGrid").innerHTML=`
    <div class="seg main"><div class="sl">🟢 MAIN</div><div class="sv">${fmt(w.main)}</div><div class="sd">Winnings, deposits, transfers</div></div>
    <div class="seg bonus"><div class="sl">🔵 BONUS</div><div class="sv">${fmt(w.bonus)}</div><div class="sd">Quests/levels · ≤${cfg().nonMainCapPct}% stake</div></div>
    <div class="seg referral"><div class="sl">🟣 REFERRAL</div><div class="sv">${fmt(w.referral)}</div><div class="sd">5% of friends' fees</div></div>
    <div class="seg rakeback"><div class="sl">🟡 RAKEBACK</div><div class="sv">${fmt(w.rakeback)}</div><div class="sd">VIP claims</div></div>
    <div class="seg bank"><div class="sl">🏦 BANK</div><div class="sv">${fmt(w.bank)}</div><div class="sd">Parked, not for betting</div></div>`;
  $("refCode").textContent=S.referralCode;
  $("refBy").textContent=S.referredBy||"—";
  $("refCount").textContent=Object.keys(S.referralBots||{}).length||S.referralCount;
  $("refEarned").textContent=fmt(S.referralEarned);
  $("firstDep").innerHTML=S.firstDepositDone?'<span style="color:var(--green)">✓ First deposit bonus already claimed.</span>':cfg().features.topupPromo===false?'<span style="color:var(--red)">First deposit +50% promo is paused by the admin. Regular deposits still work.</span>':'<span style="color:var(--gold)">First deposit bonus available: +50%!</span>';
  const tu=playerTopupAnalytics();$("walletTopupStats").innerHTML=[[fmt(tu.count),'Deposits'],[fmt(tu.base),'Base coins'],[fmt(tu.bonus),'Bonus coins'],[fmt(tu.credited),'Total credited']].map(x=>`<div class="service-status"><b>${x[0]}</b>${x[1]}</div>`).join('');
  const lastDep=(S.rg.deposits||[])[0],lastWd=(S.playerWithdrawals?.log||[])[0];
  if($("depositStatus"))$("depositStatus").innerHTML=lastDep?`<span style="color:var(--green)">✓ Last deposit ${fmt(lastDep.amount)} via ${lastDep.method||'wallet'} (${lastDep.reference||'—'}) · ${(lastDep.status||'COMPLETED').toUpperCase()}</span>`:`<span style="color:var(--mut)">No deposits yet — min ${fmt(100)}, payment method + receipt.</span>`;
  if($("withdrawStatus"))$("withdrawStatus").innerHTML=(S.kyc?.verified?`<span style="color:var(--green)">✓ KYC verified${S.kyc.name?' · '+S.kyc.name:''}</span>`:`<span style="color:var(--red)">KYC required before a withdrawal (demo).</span>`)+(lastWd?` · <span style="color:var(--green)">✓ Last withdrawal ${fmt(lastWd.amount)} via ${lastWd.method||'—'} (${lastWd.reference||'—'})</span>`:'');
  if($("withdrawableLbl"))$("withdrawableLbl").innerHTML=`Withdrawable MAIN <b>${fmt(w.main)}</b> · min ${fmt(100)} · payout to a ${$("withdrawMethod")?.value||'method'}`;
  $("lossLim").value=S.lossLimit;
  $("realityCheck").textContent=Math.floor((Date.now()-sessionStart)/60000)+"m";
}
function normalizeHistoryRow(x,source){
  if(source==='games')return {t:x.t||0,title:x.game||'Coin Toss',detail:`vs ${x.oppName||'—'} · stake ${fmt(x.stake||0)} · fee ${fmt(x.fee||0)}${x.resultText?' · '+x.resultText:''}`,amount:x.delta??0,result:x.result||'—',raw:x};
  return {t:x.t||0,title:x.title||x.type||source,detail:x.detail||x.item||x.description||'—',amount:x.amount??x.payout??x.reward??x.delta??0,result:x.result||x.status||'—',raw:x};
}
function historyRows(tab){
  if(tab==='games')return (S.games||[]).map(x=>normalizeHistoryRow(x,'games'));
  if(tab==='catalog')return (S.games||[]).filter(x=>x.gameId||String(x.game||'').includes('Catalog')||GAMES.some(g=>g.name===x.game)).map(x=>normalizeHistoryRow(x,'games'));
  if(tab==='friends')return (S.histories.friendChallenges||[]).map(x=>normalizeHistoryRow(x,'Friend Challenge'));
  if(tab==='rooms')return [...(S.histories.roomGames||[]),...(S.histories.rooms||[])].map(x=>normalizeHistoryRow(x,'Private Room'));
  if(tab==='clans')return (S.histories.clanGames||[]).map(x=>normalizeHistoryRow(x,'Clan'));
  if(tab==='arcade')return (S.histories.arcade||[]).map(x=>normalizeHistoryRow(x,'Arcade Zone'));
  if(tab==='progression')return (S.histories.progression||[]).map(x=>normalizeHistoryRow(x,'Progress+'));
  if(tab==='economy')return (S.histories.economy||[]).map(x=>normalizeHistoryRow(x,'Economy+'));
  return [...(S.histories.social||[]),...(S.social.gifts||[]).map(x=>({t:x.t,title:'Gift',detail:`To ${x.to} · ${x.item}`,amount:x.amount||0,result:'SENT'}))].map(x=>normalizeHistoryRow(x,'Social'));
}
function renderHistory(){
  const tabs=[['games','All Games'],['catalog','P2P Games'],['friends','Friend Challenges'],['rooms','Private Rooms'],['clans','Clan Games'],['arcade','Arcade Zone'],['progression','Progress+'],['economy','Economy+'],['social','Social']],st=S.stats;
  $("historyTabs").innerHTML=tabs.map(x=>`<button class="hub-tab ${HISTORY.tab===x[0]?'active':''}" data-history-tab="${x[0]}">${x[1]}</button>`).join('');
  $("historySearch").value=HISTORY.search;$("historySort").value=HISTORY.sort;
  let rows=historyRows(HISTORY.tab),q=HISTORY.search.toLowerCase();if(q)rows=rows.filter(x=>`${x.title} ${x.detail} ${x.result}`.toLowerCase().includes(q));rows.sort((a,b)=>HISTORY.sort==='time-asc'?a.t-b.t:HISTORY.sort==='amount-desc'?Math.abs(b.amount)-Math.abs(a.amount):b.t-a.t);
  const pages=Math.max(1,Math.ceil(rows.length/HISTORY.size));HISTORY.page=Math.max(1,Math.min(HISTORY.page,pages));const page=rows.slice((HISTORY.page-1)*HISTORY.size,HISTORY.page*HISTORY.size);
  $("historyKpis").innerHTML=[['🎮',fmt(st.games),'Games settled'],['💸',fmt(st.lifetimeWagered||0),'Lifetime wagered'],['🏆',fmt(st.maxPayout||0),'Maximum payout'],['📈',fmt(st.totalPayout||0),'Total payouts']].map(x=>`<div class="home-kpi"><div class="icon">${x[0]}</div><div class="value">${x[1]}</div><div class="label">${x[2]}</div></div>`).join('');
  $("historyList").innerHTML=page.length?page.map((x,i)=>`<div class="history-row" data-history-detail="${(HISTORY.page-1)*HISTORY.size+i}"><div><div class="time">${new Date(x.t).toLocaleDateString()}</div><div class="time">${new Date(x.t).toLocaleTimeString()}</div></div><div class="title">${x.title}</div><div class="detail">${x.detail}</div><div class="result"><span class="ttl-badge">${x.result}</span></div><div class="amount" style="color:${x.amount>=0?'var(--green)':'var(--red)'}">${x.amount>=0?'+':''}${fmt(x.amount)}</div></div>`).join(''):'<div class="history-empty">No records in this category yet.</div>';
  $("historyPage").textContent=`Page ${HISTORY.page} / ${pages} · ${rows.length} records`;$("historyPrev").disabled=HISTORY.page<=1;$("historyNext").disabled=HISTORY.page>=pages;window._historyRenderedRows=rows;
}
function renderStats(){
  const st=S.stats,wr=st.games?Math.round(st.wins/st.games*100):0,tu=playerTopupAnalytics();
  const tiles=[{v:st.games,k:"Games"},{v:st.wins,k:"Wins"},{v:wr+"%",k:"Win rate"},{v:fmt(st.net),k:"Net P/L"},{v:fmt(st.maxPayout||0),k:"Maximum payout"},{v:fmt(st.totalPayout||0),k:"Total payouts"},{v:S.bestStreak||0,k:"Best streak"},{v:fmt(st.biggestStake),k:"Biggest stake"},{v:fmt(tu.count),k:"Top-ups"},{v:fmt(tu.base),k:"Top-up volume"},{v:fmt(tu.bonus),k:"Top-up bonuses"},{v:fmt(tu.credited),k:"Top-up credited"}];
  $("statTiles").innerHTML=tiles.map(t=>`<div class="stat-tile"><div class="stv">${t.v}</div><div class="stk">${t.k}</div></div>`).join("");
  const vip=vipFor(S.monthWagered);
  $("careerList").innerHTML=`
    <div class="kv-row"><span class="k">Level</span><span class="v">${S.level} (${fmt(S.xp)} XP)</span></div>
    <div class="kv-row"><span class="k">VIP</span><span class="v"><span class="vip-dot" style="background:${vip.color}"></span>${vip.name} (${vip.rakeback}%)</span></div>
    <div class="kv-row"><span class="k">Monthly wagered</span><span class="v">${fmt(S.monthWagered)}</span></div>
    <div class="kv-row"><span class="k">Streak / best</span><span class="v">${S.streak} 🔥 / ${S.bestStreak}</span></div>
    <div class="kv-row"><span class="k">Cup wins</span><span class="v">${st.cupsWon} ⚔️</span></div>
    <div class="kv-row"><span class="k">Tournament wins</span><span class="v">${st.trnysWon} 🏆</span></div>
    <div class="kv-row"><span class="k">Jackpots</span><span class="v">${st.jackpots} 🎰</span></div>
    <div class="kv-row"><span class="k">Best win</span><span class="v" style="color:var(--green)">+${fmt(st.bestWin)}</span></div>`;
  const h=S.global.heads,t=S.global.tails,tot=h+t;
  $("totalGames").textContent=tot;$("totalJp").textContent=S.global.jackpots;
  if(tot>0){const hp=h/tot*100;$("biasBar").innerHTML=`<div class="h" style="width:${hp}%">H ${Math.round(hp)}%</div><div class="t" style="width:${100-hp}%">T ${Math.round(100-hp)}%</div>`;
    const z=(h-tot*.5)/Math.sqrt(tot*.25);$("zscore").textContent=z.toFixed(3)+(Math.abs(z)<3?" ✓ fair":" ⚠ drift");$("zscore").style.color=Math.abs(z)<3?"var(--green)":"var(--red)";
  }else{$("biasBar").innerHTML="";$("zscore").textContent="—";}
  const avgStake=st.games?Math.round((st.lifetimeWagered||0)/st.games):0,avgPayout=st.games?Math.round((st.totalPayout||0)/st.games):0,roi=st.lifetimeWagered?st.net/st.lifetimeWagered*100:0;
  $("overallStats").innerHTML=`<div class="kv-row"><span class="k">Lifetime wagered</span><span class="v stats-highlight">${fmt(st.lifetimeWagered||0)}</span></div><div class="kv-row"><span class="k">Total payouts received</span><span class="v">${fmt(st.totalPayout||0)}</span></div><div class="kv-row"><span class="k">Maximum single payout</span><span class="v" style="color:var(--green)">${fmt(st.maxPayout||0)}</span></div><div class="kv-row"><span class="k">Fees paid</span><span class="v">${fmt(st.feesPaid||0)}</span></div><div class="kv-row"><span class="k">Average stake</span><span class="v">${fmt(avgStake)}</span></div><div class="kv-row"><span class="k">Average payout / game</span><span class="v">${fmt(avgPayout)}</span></div><div class="kv-row"><span class="k">Return on wagered</span><span class="v" style="color:${roi>=0?'var(--green)':'var(--red)'}">${roi.toFixed(2)}%</span></div>`;
  $("gameBreakdown").innerHTML=`<div class="kv-row"><span class="k">P2P Games</span><span class="v">${st.catalogGames||0}</span></div><div class="kv-row"><span class="k">Series Cups played / won</span><span class="v">${st.seriesPlayed||0} / ${st.cupsWon||0}</span></div><div class="kv-row"><span class="k">Tournament entries / wins</span><span class="v">${st.tournamentEntries||0} / ${st.trnysWon||0}</span></div><div class="kv-row"><span class="k">Friend challenges</span><span class="v">${st.friendGames||0}</span></div><div class="kv-row"><span class="k">Private-room games</span><span class="v">${st.roomGames||0}</span></div><div class="kv-row"><span class="k">Clan games</span><span class="v">${st.clanGames||0}</span></div><div class="kv-row"><span class="k">Arcade Zone plays</span><span class="v">${st.arcadePlays||0}</span></div><div class="kv-row"><span class="k">Draws / carries</span><span class="v">${st.draws||0} / ${st.carries||0}</span></div>`;
  $("topupStatsTiles").innerHTML=[[fmt(tu.count),'Top-up count'],[fmt(tu.base),'Base volume'],[fmt(tu.bonus),'Promotional bonus'],[fmt(tu.credited),'Total credited'],[fmt(tu.average),'Average base'],[fmt(tu.largest),'Largest base'],[fmt(tu.last7),'Last 7 days'],[fmt(tu.last30),'Last 30 days']].map(x=>`<div class="service-status"><b>${x[0]}</b>${x[1]}</div>`).join('');
  $("topupStatsBreakdown").innerHTML=`<div class="kv-row"><span class="k">First-top-up bonuses</span><span class="v">${fmt(tu.firstBonus)}</span></div><div class="kv-row"><span class="k">Campaign bonuses</span><span class="v">${fmt(tu.campaignBonus)}</span></div><div class="kv-row"><span class="k">Bonus rate vs base</span><span class="v">${tu.base?(tu.bonus/tu.base*100).toFixed(1):'0.0'}%</span></div><div class="kv-row"><span class="k">Most recent top-up</span><span class="v">${tu.lastAt?new Date(tu.lastAt).toLocaleString():'—'}</span></div><div class="catalog-note" style="margin-top:10px">Base and bonus credits are demo taps. Neither is recognized as house revenue.</div>`;
  $("recentPlayerTopups").innerHTML=tu.rows.slice(0,8).map(x=>`<div class="kv-row"><span class="k">${new Date(x.t).toLocaleString()}${x.campaignId?' · '+x.campaignId:''}</span><span class="v">${fmt(x.base)}${x.bonus?` + ${fmt(x.bonus)} bonus`:''}</span></div>`).join('')||'<div class="empty">No player top-ups yet.</div>';
  const trend=(S.games||[]).slice(0,30).reverse(),max=Math.max(1,...trend.map(g=>Math.abs(g.payout??g.delta??0)));$("payoutTrend").innerHTML=trend.length?trend.map(g=>{const v=g.payout??g.delta??0,h=Math.max(4,Math.round(Math.abs(v)/max*145));return `<div class="payout-bar ${v<0?'loss':''}" style="height:${h}px" data-value="${v>=0?'+':''}${fmt(v)}"></div>`}).join(''):'<div class="empty">Play games to build a payout trend.</div>';
}
function renderSeries(){
  // cups
  const cl=$("cupList");
  if(!S.cups.length)cl.innerHTML='<div class="empty">No open cups. Open one — a bot will join you instantly!</div>';
  else cl.innerHTML=S.cups.map(c=>{
    const maker=(c.entrants&&c.entrants[0])||{};
    const you=!!maker.you;
    const youJoined=c.entrants&&c.entrants.some(e=>e.you);
    const reservedForYou=c.reservedSeat&&!youJoined;
    const publicBotCup=c.createdBy==="bot"&&!reservedForYou;
    return `<div class="wait-item">
      <span class="wi-avi">${you?playerAviHTML(22):(maker.avi||"🤖")}</span>
      <div class="wi-main"><div class="wi-name">${maker.name||"Open Cup"} ${you?'<span style="color:var(--gold)">(you)</span>':''} ${publicBotCup?'<span class="ttl">BOT-READY</span>':''}</div>
      <div class="wi-meta">${c.fmt.toUpperCase()} · ${fmt(c.stake)} entry · ${c.entrants?c.entrants.length:1}/2${publicBotCup?' · another bot may join':''}</div></div>
      ${you?`<button class="btn btn-sm btn-danger" data-cancelcup="${c.id}">Cancel</button>`:`<button class="btn btn-sm btn-primary" data-joincup="${c.id}">Join</button>`}
    </div>`;
  }).join("");
  // tournaments
  const tl=$("tourneyList");
  const openT=S.trnys.filter(t=>t.status==="open");
  if(!openT.length)tl.innerHTML='<div class="empty">No tournament lobby is open right now. Bot-only brackets are created and played automatically.</div>';
  else tl.innerHTML=openT.map(t=>{
    const joined=t.entrants.some(e=>e.you),ent=currentVipEntitlements(),vipEntry=Math.max(10,Math.round(t.entry*(1-ent.tournamentDiscount/100)));
    const seatOpen=t.entrants.length<t.size;
    return `<div class="wait-item"><span class="wi-avi">🏟️</span>
      <div class="wi-main"><div class="wi-name">${t.size}-player ${t.format==="bo3"?'Bo3 Series':'Single Flip'} · ${fmt(vipEntry)} entry ${vipEntry<t.entry?`<span class="ttl">VIP −${ent.tournamentDiscount}%</span>`:''} ${!joined&&seatOpen?'<span class="ttl" style="background:rgba(var(--green-rgb),.15);color:var(--green);border-color:rgba(var(--green-rgb),.4)">OPEN SEAT</span>':''}</div>
      <div class="wi-meta">${t.entrants.length}/${t.size} joined · bots fill remaining seats · base ${fmt(t.entry)} · rake ${t.rake}% · 75/25</div></div>
      ${joined?'<span class="muted" style="font-size:11px">✓ Joined</span>':seatOpen?`<button class="btn btn-sm btn-primary" data-jointrny="${t.id}">Join</button>`:'<span class="muted">Starting…</span>'}
    </div>`;
  }).join("");
  // x2
  const x2=$("x2List");
  const openX2=S.x2room.filter(x=>x.expires>Date.now());
  S.x2room=S.x2room.filter(x=>x.expires>Date.now() || !x.refunded);
  if(!openX2.length)x2.innerHTML='<div class="empty">No ×2 challenges. Win a game and press ×2 to post one.</div>';
  else x2.innerHTML=openX2.map(x=>{
    const you=x.owner==="you";const left=Math.max(0,Math.ceil((x.expires-Date.now())/1000));
    return `<div class="wait-item"><span class="wi-avi">${you?playerAviHTML(22):"⚡"}</span>
      <div class="wi-main"><div class="wi-name">${x.name} ${you?'<span style="color:var(--gold)">(you)</span>':''}</div>
      <div class="wi-meta">×2 ${fmt(x.stake)} · ${x.side} · ${left}s left</div></div>
      ${you?`<button class="btn btn-sm btn-danger" data-cancelx2="${x.id}">Cancel</button>`:`<button class="btn btn-sm btn-primary" data-takex2="${x.id}">Accept ×2</button>`}
    </div>`;
  }).join("");
}
function renderPlayers(){
  const el=document.getElementById("playersGrid");if(!el)return;
  const f=rosterFilter.trim().toLowerCase();
  const rows=S.bots.map(b=>({b,balance:b.balance||0,wr:b.games?Math.round((b.wins||0)/b.games*100):0}))
    .filter(x=>!f||x.b.name.toLowerCase().includes(f)||String(x.b.country||"").toLowerCase().includes(f))
    .sort((x,y)=>{
      const k=ROSTER_VIEW.sort;
      if(k==="wins")return (y.b.wins||0)-(x.b.wins||0);
      if(k==="games")return (y.b.games||0)-(x.b.games||0);
      if(k==="level")return (y.b.level||0)-(x.b.level||0);
      if(k==="balance")return y.balance-x.balance;
      return (y.b.net||0)-(x.b.net||0);
    });
  const total=rows.length,pages=Math.max(1,Math.ceil(total/ROSTER_VIEW.size));
  if(ROSTER_VIEW.page>pages)ROSTER_VIEW.page=pages;
  el.innerHTML=total?rows.slice((ROSTER_VIEW.page-1)*ROSTER_VIEW.size,ROSTER_VIEW.page*ROSTER_VIEW.size).map(({b,wr})=>{
    const skinCls=b.skin?("skin-"+b.skin):"skin-classic";
    return `<div class="player-card online" data-bot="${b.name}">
      <span class="dot-live"></span>
      <div class="pc-avi">
        <span class="mini-coin ${skinCls} pc-skin"><span class="face heads">H</span></span>
        ${b.avi}
      </div>
      <div class="pc-name">${b.name} ${b.flag}</div>
      <div class="pc-title">${b.title||""}</div>
      <div class="pc-stats"><span>W <b>${b.wins||0}</b></span><span>${wr}%</span><span>Lv <b>${b.level}</b></span></div>
    </div>`;
  }).join(""):'<div class="empty">No players match this filter.</div>';
  const bc=document.getElementById("botCount");if(bc)bc.textContent=S.bots.length;
  const pg=document.getElementById("rosterPager");if(pg)pg.innerHTML=pagerHTML(ROSTER_VIEW,total,ROSTER_VIEW.size,'id="rosterPrev"','id="rosterNext"');
}
function openBotProfile(name){
  const b=S.bots.find(x=>x.name===name);if(!b)return;
  const skinCls=b.skin?("skin-"+b.skin):"skin-classic";
  const g=b.games||0, w=b.wins||0, l=b.losses||0, wr=g?Math.round(w/g*100):0;
  const items=[...(b.shop||[])],sent=(S.botTransfers||[]).filter(x=>x.from===b.name).length,received=(S.botTransfers||[]).filter(x=>x.to===b.name).length;
  // show owned skin name
  const skinItem=COS.skins.find(x=>x.id===b.skin);
  const ownedNames=items.map(id=>{const it=COS.skins.find(x=>x.id===id)||COS.avatars.find(x=>x.id===id)||COS.frames.find(x=>x.id===id);return it?it.name:id;});
  if(skinItem&&!ownedNames.includes(skinItem.name))ownedNames.unshift(skinItem.name+" (equipped)");
  $("modalContent").innerHTML=`
    <h3>Bot profile</h3>
    <div class="profile-head">
      <span class="ph-avi">${b.avi}</span>
      <span class="mini-coin ${skinCls}" style="width:42px;height:42px"><span class="face heads">H</span></span>
      <div>
        <div class="ph-name">${b.name} ${b.flag}</div>
        <div class="ph-title">${b.title||""}${b.title2?" · "+b.title2:""}</div>
        <div class="muted" style="font-size:11px;margin-top:2px">${b.country||""} · Level ${b.level} · demo bot (starts 0 MAIN + 1,000 BONUS; top-ups are not house revenue)</div>
      </div>
    </div>
    <p class="muted" style="font-style:italic">"${b.about||""}"</p>
    <div class="prof-stat">
      <div class="ps"><div class="v">${g}</div><div class="k">Games</div></div>
      <div class="ps"><div class="v">${w}</div><div class="k">Wins</div></div>
      <div class="ps"><div class="v">${l}</div><div class="k">Losses</div></div>
      <div class="ps"><div class="v">${wr}%</div><div class="k">Win rate</div></div>
      <div class="ps"><div class="v">${b.bestStreak||0}</div><div class="k">Best streak</div></div>
      <div class="ps"><div class="v">${(b.net>=0?"+":"")+fmt(b.net||0)}</div><div class="k">Net P/L</div></div>
      <div class="ps"><div class="v">${fmt(b.balance)}</div><div class="k">MAIN balance</div></div>
      <div class="ps"><div class="v">${fmt(b.bonusBalance||0)}</div><div class="k">BONUS balance</div></div>
      <div class="ps"><div class="v">${fmt((b.balance||0)+(b.bonusBalance||0))}</div><div class="k">Total wallet</div></div>
      <div class="ps"><div class="v">${fmt(b.biggestWin||0)}</div><div class="k">Best win</div></div>
      <div class="ps"><div class="v">${b.jackpots||0}</div><div class="k">Jackpots</div></div>
      <div class="ps"><div class="v">${b.topupCount||0}</div><div class="k">Top-ups</div></div>
      <div class="ps"><div class="v">${sent}</div><div class="k">Transfers sent</div></div>
      <div class="ps"><div class="v">${received}</div><div class="k">Transfers received</div></div>
    </div>
    <div class="section-title" style="margin-top:14px">🛍️ Cosmetics owned (${ownedNames.length})</div>
    <div class="muted">${ownedNames.length?ownedNames.map(n=>`<span class="rarity uncommon" style="margin:2px;display:inline-block">${n}</span>`).join(""):"None yet — bots buy from the shop over time."}</div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="document.getElementById('modalBg').classList.remove('show')">Close</button>`;
  $("modalBg").classList.add("show");
}
function syncTurboBtn(){
  document.querySelectorAll(".turbo-ctrl button").forEach(b=>b.classList.toggle("on",+b.dataset.turbo===(S.turbo||1)));
}

export function bind(){
  document.addEventListener("click",e=>{
    const row=e.target.closest("[data-bot]");
    if(row){openBotProfile(row.dataset.bot);}
  });
  document.querySelectorAll(".turbo-ctrl button").forEach(btn=>{
    btn.onclick=()=>{
      S.turbo=+btn.dataset.turbo;
      document.querySelectorAll(".turbo-ctrl button").forEach(b=>b.classList.remove("on"));
      btn.classList.add("on");
      toast(S.turbo<=1?"🐢 Normal speed (~80 bot games/min)":`⚡ Turbo ${S.turbo}× — ${(S.turbo*27).toLocaleString()}+ bot games/minute`);
      save();
    };
  });
  $("tabs").addEventListener("click",e=>{
    const b=e.target.closest(".tab");if(!b)return;
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    b.classList.add("active");$("panel-"+b.dataset.tab).classList.add("active");
    // Targeted refresh: update the active tab's widgets only, then finish with a
    // cheap chrome pass so wallet/jackpot tickers stay live.
    activeTab=b.dataset.tab;recordRecentTab(b.dataset.tab);syncPlayerNavigation(b.dataset.tab);
    renderTab(b.dataset.tab);renderChrome();
    try{closeNavDrawer();}catch(e){}
  });
  $("themeBtn").onclick=()=>{S.settings.themeName=S.settings.themeName==="light"?"midnight":"light";S.settings.customPalette=null;applyTheme();render();};
  document.querySelectorAll(".lbsort").forEach(b=>b.onclick=()=>{document.querySelectorAll(".lbsort").forEach(x=>x.classList.remove("active"));b.classList.add("active");lbSort=b.dataset.sort;LB_VIEW.page=1;renderLeaderboard();});
  const lbF=$("lbFilter");if(lbF)lbF.oninput=()=>{lbFilter=lbF.value;LB_VIEW.page=1;renderLeaderboard();};
  document.addEventListener('click',e=>{
    if(e.target.id==='lbPrev'){LB_VIEW.page=Math.max(1,LB_VIEW.page-1);renderLeaderboard();}
    else if(e.target.id==='lbNext'){LB_VIEW.page++;renderLeaderboard();}
    else if(e.target.id==='rosterPrev'){ROSTER_VIEW.page=Math.max(1,ROSTER_VIEW.page-1);renderPlayers();}
    else if(e.target.id==='rosterNext'){ROSTER_VIEW.page++;renderPlayers();}
  });
  const rF=$("rosterFilter");if(rF)rF.oninput=()=>{rosterFilter=rF.value;ROSTER_VIEW.page=1;renderPlayers();};
  const rS=$("rosterSort");if(rS)rS.onchange=()=>{ROSTER_VIEW.sort=rS.value;ROSTER_VIEW.page=1;renderPlayers();};
  $("rulesBtn").onclick=()=>{
    $("modalContent").innerHTML=`<h3>📖 Rules & Fairness</h3>
      <p class="muted"><b>Matching:</b> Post HEADS or TAILS + stake. Your bet waits in the room; an opposite-side bet at the same amount auto-matches. Private bets (🔒) require a manual Take.</p>
      <p class="muted"><b>Escrow:</b> Stake is locked atomically on posting; cancelling refunds fully. 80–90% from MAIN, ≤${cfg().nonMainCapPct}% from bonus/referral/rakeback. Winnings → 100% MAIN.</p>
      <p class="muted"><b>Fee:</b> ${cfg().feePct}% of pot (regular), ${cfg().cupRakePct}% cups, ${cfg().trnyRakePct}% tournaments. A slice funds the jackpot.</p>
      <p class="muted"><b>Jackpot:</b> Armed at ${cfg().jpArm}+ coins; a <code>00</code> result byte (1/256) pays ${cfg().jpPayPct}% of the pool, rest rolls over.</p>
      <p class="muted"><b>Fairness:</b> 3-party merged hash — both players' seeds + a server seed committed pre-flip and revealed after. Verify any game in the Verify tab.</p>
      <p class="muted"><b>Responsible gaming:</b> Set a session loss limit, self-exclude 60s, and watch the reality-check timer. Play coins only — no real money.</p>
      <button class="btn btn-primary" style="margin-top:8px" onclick="document.getElementById('modalBg').classList.remove('show')">Got it</button>`;
    $("modalBg").classList.add("show");
  };
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{TAB_RENDERERS,botAvi,historyRows,normalizeHistoryRow,openBotProfile,playerAviHTML,playerFlag,playerName,render,renderChrome,renderFeed,renderHistory,renderLeaderboard,renderPlayers,renderRecent,renderSeason,renderSeries,renderShop,renderStats,renderTab,renderTick,renderWait,renderWallet,setActiveTab,shopCatData,syncTurboBtn});

export {TAB_RENDERERS,botAvi,historyRows,normalizeHistoryRow,openBotProfile,playerAviHTML,playerFlag,playerName,render,renderChrome,renderFeed,renderHistory,renderLeaderboard,renderPlayers,renderRecent,renderSeason,renderSeries,renderShop,renderStats,renderTab,renderTick,renderWait,renderWallet,setActiveTab,shopCatData,syncTurboBtn};
