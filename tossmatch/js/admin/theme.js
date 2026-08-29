/* TossMatch admin module — theme */
import "../shared/runtime.js";
import {$,DIRECTORY,SAVE_KEY,VIEWS,audit,fmt,render,renderAudit,renderCatalogHistory,renderFeatureDirectory,renderFlags,renderGameHistory,renderLevels,renderPeople,renderTopupAnalytics,renderTrny,renderWithdrawals,toast} from "./core.js";
import {THEME_PRESETS,applyTheme,clearThemeVars,closePalette,hexToRgb,openPalette,renderThemePresets,saveThemePrefs,shadeRgb,themeName,themePalette} from "../shared/theme.js";

function bindViewControls(){
  const bindInput=(id,view,key,fn)=>{$(id).oninput=e=>{view[key]=e.target.value;view.page=1;fn();};};
  const bindChange=(id,view,key,fn)=>{$(id).onchange=e=>{view[key]=e.target.value;view.page=1;fn();};};
  const pager=(prefix,view,fn)=>{$(prefix+"Prev").onclick=()=>{view.page=Math.max(1,view.page-1);fn();};$(prefix+"Next").onclick=()=>{view.page++;fn();};};
  bindInput("auditFilter",VIEWS.audit,"filter",renderAudit);bindChange("auditSort",VIEWS.audit,"sort",renderAudit);pager("audit",VIEWS.audit,renderAudit);
  bindInput("gameFilter",VIEWS.games,"filter",renderGameHistory);bindChange("gameSort",VIEWS.games,"sort",renderGameHistory);pager("game",VIEWS.games,renderGameHistory);
  bindInput("catFilter",VIEWS.catalog,"filter",renderCatalogHistory);bindChange("catResultFilter",VIEWS.catalog,"result",renderCatalogHistory);bindChange("catSort",VIEWS.catalog,"sort",renderCatalogHistory);pager("cat",VIEWS.catalog,renderCatalogHistory);
  bindInput("queueFilter",VIEWS.queue,"filter",render);bindChange("queueSort",VIEWS.queue,"sort",render);pager("queue",VIEWS.queue,render);
  bindInput("botXfFilter",VIEWS.transfers,"filter",render);bindChange("botXfSort",VIEWS.transfers,"sort",render);pager("botXf",VIEWS.transfers,render);
  bindInput("botTopupFilter",VIEWS.topups,"filter",render);bindChange("botTopupSort",VIEWS.topups,"sort",render);pager("botTopup",VIEWS.topups,render);
  bindInput("playerTopupFilter",VIEWS.playerTopups,"filter",renderTopupAnalytics);bindChange("playerTopupSort",VIEWS.playerTopups,"sort",renderTopupAnalytics);pager("playerTopup",VIEWS.playerTopups,renderTopupAnalytics);
  bindInput("levelFilter",VIEWS.levels,"filter",renderLevels);bindChange("levelSort",VIEWS.levels,"sort",renderLevels);pager("level",VIEWS.levels,renderLevels);
  bindChange("flagFilter",VIEWS.flags,"filter",renderFlags);bindChange("flagSort",VIEWS.flags,"sort",renderFlags);pager("flag",VIEWS.flags,renderFlags);
  bindChange("trnyStatusFilter",VIEWS.tournaments,"status",renderTrny);bindChange("trnySort",VIEWS.tournaments,"sort",renderTrny);pager("trny",VIEWS.tournaments,renderTrny);
  bindInput("wdFilter",VIEWS.withdrawals,"filter",renderWithdrawals);bindChange("wdSort",VIEWS.withdrawals,"sort",renderWithdrawals);pager("wd",VIEWS.withdrawals,renderWithdrawals);
  bindInput("peopleFilter",VIEWS.people,"filter",renderPeople);bindChange("peopleSort",VIEWS.people,"sort",renderPeople);pager("people",VIEWS.people,renderPeople);
}
function openDrawer(title,html){$("drawerTitle").textContent=title;$("drawerContent").innerHTML=html;$("adminDrawer").classList.add("show");$("drawerBackdrop").classList.add("show");}
function closeDrawer(){$("adminDrawer").classList.remove("show");$("drawerBackdrop").classList.remove("show");}

export function bind(){
  $('paletteBtn')&&($('paletteBtn').onclick=openPalette);
  $('paletteClose')&&($('paletteClose').onclick=closePalette);
  $('paletteBg')&&($('paletteBg').onclick=e=>{if(e.target===$('paletteBg'))closePalette();});
  $('pcApply')&&($('pcApply').onclick=()=>{
    const bg=$('pcBg').value,card=$('pcCard').value,accent=$('pcAccent').value,txt=$('pcTxt').value;
    const br=hexToRgb(bg),ta=hexToRgb(txt),ca=hexToRgb(card),aa=hexToRgb(accent);
    const light=!!br&&br.r>200&&br.g>200&&br.b>200;
    const pal={light,bg,bg2:br?shadeRgb(br,-10):'#0e1526',card,card2:ca?shadeRgb(ca,-14):'#0e1a30',line:br?shadeRgb(br,28):'#22304f',line2:br?shadeRgb(br,44):'#2a3a60',txt,mut:ta?shadeRgb(ta,-40):'#93a0bd',mut2:ta?shadeRgb(ta,-70):'#6d7d9d',accent,accent2:aa?shadeRgb(aa,-24):'#e0a52e'};
    S.settings.themeName='custom';S.settings.customPalette=pal;
    applyTheme();saveThemePrefs();renderThemePresets();toast('Custom palette applied.','ok');
  });
  $('pcReset')&&($('pcReset').onclick=()=>{S.settings.themeName='midnight';S.settings.customPalette=null;applyTheme();saveThemePrefs();renderThemePresets();toast('Default theme restored.','ok');});
  bindViewControls();
  $("directorySearch").oninput=e=>{DIRECTORY.search=e.target.value;renderFeatureDirectory();};
  $("directoryCategory").onchange=e=>{DIRECTORY.category=e.target.value;renderFeatureDirectory();};
  $("directoryStatus").onchange=e=>{DIRECTORY.status=e.target.value;renderFeatureDirectory();};
  $("drawerClose").onclick=closeDrawer;
  $("drawerBackdrop").onclick=closeDrawer;
  document.addEventListener("click",e=>{
    const ag=e.target.closest("[data-admin-go]");if(ag){document.querySelector(`.tab[data-tab="${ag.dataset.adminGo}"]`)?.click();return;}
    const g=e.target.closest("[data-game-row]");if(g){const x=(S.games||[]).find(v=>String(v.id)===String(g.dataset.gameRow));if(x)openDrawer(x.game||"Game details",`<div class="grid2"><div class="stat-tile"><div class="v">${x.result}</div><div class="k">Result</div></div><div class="stat-tile"><div class="v">${x.delta>=0?'+':''}${fmt(x.delta||0)}</div><div class="k">Player delta</div></div></div><div class="kv"><span class="k">Game ID</span><b>#${x.id}</b></div><div class="kv"><span class="k">Opponent</span><b>${x.oppName||'—'} ${x.oppFlag||''}</b></div><div class="kv"><span class="k">Stake / fee</span><b>${fmt(x.stake||0)} / ${fmt(x.fee||0)}</b></div><div class="kv"><span class="k">Picks</span><b>${x.playerPick??'—'} vs ${x.botPick??'—'}</b></div><div class="catalog-note" style="margin-top:12px">${x.resultText||'No additional resolution detail.'}</div>${x.proof?`<pre style="white-space:pre-wrap">${JSON.stringify(x.proof,null,2)}</pre>`:''}`);return;}
    const c=e.target.closest("[data-cat-row]");if(c){const x=(S.catalogLog||[]).find(v=>String(v.id)===String(c.dataset.catRow));if(x)openDrawer(x.game,`<div class="result-banner win" style="display:block">${x.result}</div><div class="kv"><span class="k">Match</span><b>${x.playerA} [${x.pickA}] vs ${x.playerB} [${x.pickB}]</b></div><div class="kv"><span class="k">Stake / fee</span><b>${fmt(x.stake)} / ${fmt(x.fee)}</b></div><div class="catalog-note" style="margin-top:12px">${x.detail}</div><div class="proof show">${x.proof||'No proof'}</div>`);return;}
    const q=e.target.closest("[data-quick]");if(q){const a=q.dataset.quick;if(a==='maintenance')$("togMaint").click();else if(a==='seed')$("seedJp").click();else if(a==='tournament'){$("trnySize").value=8;$("trnyEntry").value=100;$("createTrny").click();}else if(a==='broadcast'){document.querySelector('.tab[data-tab="promo"]').click();setTimeout(()=>$("broadcastInput").focus(),50);}else if(a==='export')$("exportState").click();return;}
    const fa=e.target.closest("[data-feature-admin]");if(fa){const a=fa.dataset.featureAdmin;if(a==='seed-social'){S.social=S.social||{friends:[],chat:[],privateRooms:[],gifts:[]};const n=S.bots[0]?.name;if(n&&!S.social.friends.includes(n))S.social.friends.push(n);}else if(a==='grant-pass'){S.engagement=S.engagement||{};S.engagement.battlePass=S.engagement.battlePass||{claimedFree:[],claimedPremium:[]};S.engagement.battlePass.premium=true;}else if(a==='expire-sub'){if(S.economyPlus?.subscription)S.economyPlus.subscription.expires=0;}else if(a==='advance-stake'){if(S.economyPlus?.staking)S.economyPlus.staking.lastClaim-=604800000;}else if(a==='clear-chat'){if(S.social)S.social.chat=[];}else if(a==='reset-features'&&confirm('Reset all B1–B4 feature state?')){S.social={friends:[],blocked:[],muted:[],chat:[],privateRooms:[],gifts:[],clan:null,clanScore:0};S.featureGames={wheel:{lastFreeDay:'',spins:0,lastPrize:''},scratch:[],dice:[],raffle:{week:'',playerTickets:0,botTickets:80,pool:0,lastWinner:''},ladder:[],war:[]};S.engagement={battlePass:{month:'',xp:0,premium:false,claimedFree:[],claimedPremium:[]},weekly:{key:'',wins:0,games:0,gameTypes:{},bestStreak:0,claimed:[]},prestige:0,skillOnly:false};S.economyPlus={cratesOpened:0,tradingListings:[],staking:{balance:0,lastClaim:Date.now()},subscription:{tier:'none',expires:0,lastDropMonth:''},boosters:{xpUntil:0,rakeUntil:0}};}audit('feature-admin',a);toast('Feature action completed.');render();return;}
  });
  /* theme UI wiring (was the tail of the shared engine block) */
  $('paletteBtn')&&($('paletteBtn').onclick=openPalette);
  $('paletteClose')&&($('paletteClose').onclick=closePalette);
  $('paletteBg')&&($('paletteBg').onclick=e=>{if(e.target===$('paletteBg'))closePalette();});
  $('pcApply')&&($('pcApply').onclick=()=>{
    const bg=$('pcBg').value,card=$('pcCard').value,accent=$('pcAccent').value,txt=$('pcTxt').value;
    const br=hexToRgb(bg),ta=hexToRgb(txt),ca=hexToRgb(card),aa=hexToRgb(accent);
    const light=!!br&&br.r>200&&br.g>200&&br.b>200;
    const pal={light,bg,bg2:br?shadeRgb(br,-10):'#0e1526',card,card2:ca?shadeRgb(ca,-14):'#0e1a30',line:br?shadeRgb(br,28):'#22304f',line2:br?shadeRgb(br,44):'#2a3a60',txt,mut:ta?shadeRgb(ta,-40):'#93a0bd',mut2:ta?shadeRgb(ta,-70):'#6d7d9d',accent,accent2:aa?shadeRgb(aa,-24):'#e0a52e'};
    S.settings.themeName='custom';S.settings.customPalette=pal;
    applyTheme();saveThemePrefs();renderThemePresets();toast('Custom palette applied.','ok');
  });
  $('pcReset')&&($('pcReset').onclick=()=>{S.settings.themeName='midnight';S.settings.customPalette=null;applyTheme();saveThemePrefs();renderThemePresets();toast('Default theme restored.','ok');});
  
}

export {THEME_PRESETS} from "../shared/theme.js";
export {applyTheme} from "../shared/theme.js";
export {clearThemeVars} from "../shared/theme.js";
export {closePalette} from "../shared/theme.js";
export {hexToRgb} from "../shared/theme.js";
export {openPalette} from "../shared/theme.js";
export {renderThemePresets} from "../shared/theme.js";
export {saveThemePrefs} from "../shared/theme.js";
export {shadeRgb} from "../shared/theme.js";
export {themeName} from "../shared/theme.js";
export {themePalette} from "../shared/theme.js";

/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{bindViewControls,closeDrawer,openDrawer});

export {bindViewControls,closeDrawer,openDrawer};
