/* FlipArena admin module — new feature panels (VIP+/Season+/Progress+/Economy+).
   Reads the same shared state as the player app, exposes:
   - Feature Hub quick actions for the new features
   - VIP+ config editor (daily bonus, monthly quest, rewards road)
   - Season+ config editor (points, factions, missions, prize track)
   - Progress+ telemetry (daily missions, badges, milestones)
   - Economy+ telemetry (bonds, mine, exchange)
   All actions are audit-logged and persisted through the shared state. */
import "../shared/runtime.js";
import {$,ADMIN_TAB_RENDERERS,cfg,fmt,save,audit,render,toast} from "./core.js";
import {DAILY_MISSIONS,BADGE_DEFS} from "../shared/progress.js";

/* ── VIP+ config editor ─────────────────────────────────────────────── */
function renderVipPlusEditor(){
  const vp=cfg().vipPlus||{dailyBase:25,dailyPerTier:10,questWager:2000,questRewardPerTier:50};
  $("vipPlusDailyBase").value=vp.dailyBase;
  $("vipPlusDailyPerTier").value=vp.dailyPerTier;
  $("vipPlusQuestWager").value=vp.questWager;
  $("vipPlusQuestRewardPerTier").value=vp.questRewardPerTier;
  const road=[[1,50,100],[2,100,200],[3,150,300],[4,200,400],[5,300,600],[6,400,800],[7,600,1000],[8,800,1000]];
  $("vipPlusRoad").innerHTML=road.map((r,i)=>`<div class="kv-row"><span>VIP tier ${r[0]} — main</span><b><input class="vip-road-main" data-tier="${r[0]}" type="number" value="${r[1]}" style="max-width:110px"/></b></div><div class="kv-row"><span>VIP tier ${r[0]} — bonus</span><b><input class="vip-road-bonus" data-tier="${r[0]}" type="number" value="${r[2]}" style="max-width:110px"/></b></div>`).join("");
  $("vipPlusState").innerHTML=`<div class="kv"><span class="k">Player VIP tier</span><b>${S.vipUnlockedTier||1}</b></div><div class="kv"><span class="k">Monthly wagered</span><b>${fmt(S.monthWagered||0)}</b></div><div class="kv"><span class="k">Daily claimed today</span><b>${S.vipPlus?.daily?.claimed?'Yes':'Not yet'}</b></div><div class="kv"><span class="k">Road claimed</span><b>${(S.vipPlus?.road?.claimed||[]).join(', ')||'None'}</b></div>`;
}
function saveVipPlus(){
  const c=cfg(),vp=c.vipPlus=c.vipPlus||{};
  vp.dailyBase=Math.max(0,Math.round(+$("vipPlusDailyBase").value||0));
  vp.dailyPerTier=Math.max(0,Math.round(+$("vipPlusDailyPerTier").value||0));
  vp.questWager=Math.max(0,Math.round(+$("vipPlusQuestWager").value||0));
  vp.questRewardPerTier=Math.max(0,Math.round(+$("vipPlusQuestRewardPerTier").value||0));
  audit("vip-plus-config",`daily ${vp.dailyBase}+${vp.dailyPerTier}/tier · quest ${vp.questWager} → ${vp.questRewardPerTier}/tier`);
  save();render();toast("VIP+ configuration saved.","ok");
}

/* ── Season+ config editor ──────────────────────────────────────────── */
function renderSeasonPlusEditor(){
  const sp=cfg().seasonPlus||{pointsPerGame:2,pointsPerWin:3,pointsPerCup:20,pointsPerTrny:50,prizeTrack:[]};
  $("seasonPlusPerGame").value=sp.pointsPerGame;
  $("seasonPlusPerWin").value=sp.pointsPerWin;
  $("seasonPlusPerCup").value=sp.pointsPerCup;
  $("seasonPlusPerTrny").value=sp.pointsPerTrny;
  const track=sp.prizeTrack?.length?sp.prizeTrack:[{pts:100,reward:100},{pts:250,reward:250},{pts:500,reward:550},{pts:1000,reward:1200}];
  $("seasonPlusTrack").innerHTML=track.map((p,i)=>`<div class="kv-row"><span>Prize ${i+1}</span><b>${fmt(p.pts)} pts → <input class="season-track-reward" data-i="${i}" type="number" value="${p.reward}" style="max-width:110px"/> 🪙</b></div>`).join("");
  const state=S.seasonPlus||{};
  $("seasonPlusState").innerHTML=`<div class="kv"><span class="k">Season number</span><b>#${cfg().seasonNumber||1}</b></div><div class="kv"><span class="k">Player points</span><b>${fmt(state.points||0)}</b></div><div class="kv"><span class="k">Faction</span><b>${state.faction||'None'}</b></div><div class="kv"><span class="k">Missions claimed</span><b>${(state.missions?.claimed||[]).length}/4</b></div><div class="kv"><span class="k">Prizes claimed</span><b>${(state.prizes?.claimed||[]).length}/${track.length}</b></div>`;
}
function saveSeasonPlus(){
  const c=cfg(),sp=c.seasonPlus=c.seasonPlus||{};
  sp.pointsPerGame=Math.max(0,Math.round(+$("seasonPlusPerGame").value||0));
  sp.pointsPerWin=Math.max(0,Math.round(+$("seasonPlusPerWin").value||0));
  sp.pointsPerCup=Math.max(0,Math.round(+$("seasonPlusPerCup").value||0));
  sp.pointsPerTrny=Math.max(0,Math.round(+$("seasonPlusPerTrny").value||0));
  const base=sp.prizeTrack?.length?sp.prizeTrack:[{pts:100,reward:100},{pts:250,reward:250},{pts:500,reward:550},{pts:1000,reward:1200}];
  sp.prizeTrack=base.map((p,i)=>({pts:p.pts,reward:Math.max(0,Math.round(+document.querySelector(`.season-track-reward[data-i="${i}"]`)?.value||p.reward))}));
  audit("season-plus-config",`pts ${sp.pointsPerGame}/${sp.pointsPerWin}/${sp.pointsPerCup}/${sp.pointsPerTrny} · ${sp.prizeTrack.length} prizes`);
  save();render();toast("Season+ configuration saved.","ok");
}

/* ── Progress+ panel ────────────────────────────────────────────────── */
function renderProgressPlusAdmin(){}
function renderDailyMissionsAdmin(){
  const m=S.engagement?.missions||{day:"",claimed:[]};
  $("p7Missions").innerHTML=`<div class="kv"><span class="k">Reset key</span><b>${m.day||'today'}</b></div><div class="kv"><span class="k">Claimed today</span><b>${(m.claimed||[]).length}/6</b></div>`+DAILY_MISSIONS.map((d,i)=>{
    const claimed=(m.claimed||[]).includes(i);
    return `<div class="kv-row"><span>${d.icon} ${d.label}</span><b>${claimed?'✓ Claimed':'—'}</b></div>`;
  }).join("");
}
function renderBadgeCaseAdmin(){
  const have=S.engagement?.badges||[];
  $("p8Badges").innerHTML=`<div class="kv"><span class="k">Unlocked</span><b>${have.length}/${BADGE_DEFS.length}</b></div>`+BADGE_DEFS.map(b=>`<div class="kv-row"><span>${b.icon} ${b.name}</span><b>${have.includes(b.id)?'✓':'🔒'}</b></div>`).join("");
}
function renderMilestonesAdmin(){
  const m=S.engagement?.milestones?.claimed||{};
  $("p6Milestones").innerHTML=`<div class="kv"><span class="k">Claimed</span><b>${Object.keys(m).length}/12</b></div>`+Object.keys(m).map(id=>`<div class="kv-row"><span>${id}</span><b>✓</b></div>`).join("")||'<div class="empty">No milestones claimed yet.</div>';
}

/* ── Economy+ panel ─────────────────────────────────────────────────── */
function renderBondAdmin(){
  const b=S.economyPlus?.bonds||{};
  $("e11Bonds").innerHTML=`<div class="kv"><span class="k">Principal locked</span><b>${fmt(b.principal||0)} MAIN</b></div><div class="kv"><span class="k">Coupon earned</span><b>${fmt(b.coupon||0)} BONUS</b></div><div class="kv"><span class="k">Bonds held</span><b>${(b.buys||[]).length}</b></div>`;
}
function renderMineAdmin(){
  const m=S.economyPlus?.mine||{};
  $("e12Mine").innerHTML=`<div class="kv"><span class="k">Energy today</span><b>${m.energy??20}/20</b></div><div class="kv"><span class="k">Digs</span><b>${m.digs||0}</b></div><div class="kv"><span class="k">Shards banked</span><b>${fmt(m.shards||0)}</b></div>`;
}
function renderExchangeAdmin(){
  const x=S.economyPlus?.exchange||{};
  $("e13Exchange").innerHTML=`<div class="kv"><span class="k">Converted today</span><b>${fmt(x.today||0)} / 500</b></div><div class="kv"><span class="k">Conversions</span><b>${(x.log||[]).length}</b></div>`;
}

/* ── panel renderer ─────────────────────────────────────────────────── */
const PANEL_RENDERERS={p7Missions:renderDailyMissionsAdmin,p8Badges:renderBadgeCaseAdmin,p6Milestones:renderMilestonesAdmin,e11Bonds:renderBondAdmin,e12Mine:renderMineAdmin,e13Exchange:renderExchangeAdmin};
function renderPlusPanel(){
  Object.values(PANEL_RENDERERS).forEach(fn=>{try{fn();}catch(e){}});
  $("p7Count").textContent=(S.engagement?.missions?.claimed||[]).length;
  $("p8Count").textContent=(S.engagement?.badges||[]).length;
  $("p6Count").textContent=Object.keys(S.engagement?.milestones?.claimed||{}).length;
  $("e11Count").textContent=fmt(S.economyPlus?.bonds?.principal||0);
  $("e12Count").textContent=(S.economyPlus?.mine?.digs||0);
  $("e13Count").textContent=(S.economyPlus?.exchange?.log||[]).length;
  renderVipPlusEditor();renderSeasonPlusEditor();
}
/* register the panel against the shared admin tab renderer map (core loads first) */
ADMIN_TAB_RENDERERS.plus=()=>renderPlusPanel();

export function bind(){
  $("vipPlusSave")?.addEventListener("click",saveVipPlus);
  $("seasonPlusSave")?.addEventListener("click",saveSeasonPlus);
  document.addEventListener("click",e=>{
    const t=e.target.closest("[data-feature-admin]");
    if(!t)return;
    const a=t.dataset.featureAdmin;
    if(a==="grant-vip-daily"){S.vipPlus=S.vipPlus||{daily:{day:"",claimed:0}};S.vipPlus.daily.claimed=0;S.vipPlus.daily.day=new Date().toDateString();audit("feature-admin","grant-vip-daily");toast("VIP daily bonus reset for today.","ok");}
    else if(a==="grant-vip-quest"){S.vipPlus=S.vipPlus||{quest:{month:"",claimed:0}};S.vipPlus.quest.month=new Date().toISOString().slice(0,7);S.vipPlus.quest.claimed=0;audit("feature-admin","grant-vip-quest");toast("VIP quest reset for this month.","ok");}
    else if(a==="grant-season-points"){S.seasonPlus=S.seasonPlus||{points:0};S.seasonPlus.points=(S.seasonPlus.points||0)+100;audit("feature-admin","grant-season-points");toast("+100 season points granted.","ok");}
    else if(a==="speed-mine"){S.economyPlus=S.economyPlus||{mine:{}};S.economyPlus.mine.energy=20;audit("feature-admin","speed-mine");toast("Mine energy refilled.","ok");}
    else if(a==="reset-progress-plus"&&confirm("Reset Progress+/VIP+/Season+ activity (missions, badges, road, season points)?")){
      S.engagement=S.engagement||{};S.engagement.missions={day:"",claimed:[]};S.engagement.badges=[];S.engagement.milestones={claimed:{}};
      S.vipPlus={daily:{day:"",claimed:0,tier:0},quest:{month:"",claimed:0,reward:0},road:{claimed:[]}};
      S.seasonPlus={faction:"",points:0,missions:{key:"",claimed:[]},prizes:{key:"",claimed:[]},history:[]};
      audit("feature-admin","reset-progress-plus");toast("Progress+ demo state reset.","ok");
    }
    save();render();
    Object.values(PANEL_RENDERERS).forEach(fn=>{try{fn();}catch(e){}});
  });
}

export {PANEL_RENDERERS,bind as _bind};
