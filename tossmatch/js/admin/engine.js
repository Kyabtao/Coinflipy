/* FlipArena admin module — engine */
import "../shared/runtime.js";
import {$,adminAntiCheatScan,audit,cfg,fmt,readVip,reconcileHouse,render,save,toast} from "./core.js";
import {dl} from "./banking.js";

function bindTog(id,key){$(id).onchange=()=>{cfg().features[key]=$(id).checked;audit("feature-toggle",key+"="+$(id).checked);toast(key+" "+($(id).checked?"ON":"OFF"));render();};}

export function bind(){
  $("saveRates").onclick=()=>{
    cfg().feePct=+$("rngFee").value;cfg().cupRakePct=+$("rngCup").value;cfg().trnyRakePct=+$("rngTrny").value;cfg().transferFee=+$("rngXf").value;
    audit("rate-change",`fees ${cfg().feePct}% / cup ${cfg().cupRakePct}% / trny ${cfg().trnyRakePct}% / xf ${cfg().transferFee}%`);
    toast("Rates saved.");render();
  };
  $("resetRates").onclick=()=>{$("rngFee").value=5;$("rngCup").value=5;$("rngTrny").value=10;$("rngXf").value=2;$("saveRates").click();};
  $("saveJp").onclick=()=>{
    cfg().jpFundPct=+$("rngJpFund").value;cfg().jpFloor=+$("rngJpFloor").value;cfg().jpArm=+$("rngJpArm").value;cfg().jpPayPct=+$("rngJpPay").value;
    audit("jackpot-config",`fund ${cfg().jpFundPct}% / floor ${cfg().jpFloor} / arm ${cfg().jpArm} / pay ${cfg().jpPayPct}%`);
    toast("Jackpot config saved.");render();
  };
  $("seedJp").onclick=()=>{S.jackpot+=500;audit("jackpot-seed","+500");toast("Jackpot seeded +500.");render();};
  $("resetJp").onclick=()=>{if(confirm("Reset jackpot pool to 0?")){S.jackpot=0;audit("jackpot-reset","to 0");toast("Pool reset.");render();}};
  $("saveRules").onclick=()=>{
    cfg().nonMainCapPct=Math.max(10,Math.min(20,+$("cfgCap").value));
    cfg().transferCap=+$("cfgXfCap").value;cfg().transferMin=+$("cfgXfMin").value;
    const wdMin=Math.max(1000,+$("cfgWdMin").value,3000),wdMax=Math.max(wdMin,+$("cfgWdMax").value,5000);
    const wdTick=+$("cfgWdChance").value;cfg().wdMin=wdMin;cfg().wdMax=wdMax;cfg().wdTickChance=Number.isFinite(wdTick)?Math.max(0,Math.min(1,wdTick)):0.35;
    cfg().botArcadePerTick=Math.max(1,+$("cfgArcadeTick").value||2);
    cfg().seasonNumber=Math.max(1,+$("cfgSeason").value||1);
    cfg().house.capital=Math.max(0,+$("cfgHouseCap").value||0);
    audit("rules-change",`cap ${cfg().nonMainCapPct}% / xfCap ${cfg().transferCap} / xfMin ${cfg().transferMin} / wd ${wdMin}-${wdMax} / arcade ${cfg().botArcadePerTick} / season ${cfg().seasonNumber}`);
    reconcileHouse();toast("Rules saved.");render();
  };
  $("saveVip").onclick=()=>{readVip();audit("vip-table","updated");toast("VIP table saved.");render();};
  $("resetVip").onclick=()=>{if(confirm("Reset VIP to v8 defaults?")){S.config.vip=[{tier:1,name:"Starter",wagered:0,rakeback:0,color:"#8d6e63"},{tier:2,name:"Silver",wagered:1000,rakeback:4,color:"#c0c0c0"},{tier:3,name:"Gold",wagered:3000,rakeback:6,color:"#ffd700"},{tier:4,name:"Platinum",wagered:8000,rakeback:8,color:"#e5e4e2"},{tier:5,name:"Diamond",wagered:20000,rakeback:12,color:"#b9f2ff"},{tier:6,name:"Black Diamond",wagered:50000,rakeback:15,color:"linear-gradient(135deg,#111827,#f43f5e)"},{tier:7,name:"Royal",wagered:75000,rakeback:17,color:"linear-gradient(135deg,#f43f5e,#fbbf24)"},{tier:8,name:"Legend",wagered:100000,rakeback:20,color:"linear-gradient(135deg,#fbbf24,#f43f5e,#a855f7)"}];audit("vip-reset","defaults");toast("VIP reset.");render();}};
  $("endVipMonth").onclick=()=>{if(confirm("End VIP month now? Wagered counters reset to 0; accrued rakeback is preserved.")){S.monthWagered=0;audit("vip-month-end","manual reset");toast("VIP month ended.");render();}};
  $("saveLevels").onclick=()=>{
    document.querySelectorAll("[data-level]").forEach(inp=>{cfg().levelRewards[+inp.dataset.level]=Math.max(0,+inp.value);});
    audit("level-rewards","updated");toast("Level rewards saved.");render();
  };
  $("addLevel").onclick=()=>{
    const keys=Object.keys(cfg().levelRewards).map(Number);const next=Math.max(...keys)+1;
    cfg().levelRewards[next]=next*50;audit("level-add","level "+next);render();
  };
  $("saveBotConfig").onclick=()=>{const c=cfg();c.botTopupThreshold=Math.max(0,Math.min(10000,+$("botTopupThreshold").value||500));c.botGrowthMax=Math.max(99,Math.min(1000,+$("botGrowthMax").value||250));c.botGrowthIntervalSec=Math.max(5,Math.min(3600,+$("botGrowthInterval").value||15));c.botGrowthBatch=Math.max(1,Math.min(10,+$("botGrowthBatch").value||1));audit('bot-config',`top-up <${c.botTopupThreshold} · max ${c.botGrowthMax} · ${c.botGrowthBatch} every ${c.botGrowthIntervalSec}s`);toast('Bot economy and growth settings saved.');render();};
  $("addBotNow").onclick=()=>{const n=S.bots.length+1,name=`Admin Bot ${n}-${Math.floor(100+Math.random()*900)}`,places=[['India','🇮🇳'],['Brazil','🇧🇷'],['USA','🇺🇸'],['Japan','🇯🇵'],['UK','🇬🇧']],place=places[Math.floor(Math.random()*places.length)];S.bots.push({name,avi:'🤖',flag:place[1],balance:0,bonusBalance:1000,walletVersion:2,startingBonus:1000,startingBonusAccounted:false,startingBonusAt:0,level:2+Math.floor(Math.random()*20),country:place[0],title:'Admin-added player',about:'Created from Live Operations.',skin:'classic',joined:0,wins:0,losses:0,net:0,streak:0,bestStreak:0,biggestWin:0,jackpots:0,games:0,arcadeGames:0,shop:[],firstTopupDone:false,topupCount:0,topupTotal:0,autoCreated:true,createdAt:Date.now()});S.botActivity=S.botActivity||{createdBots:0,socialLog:[],arcadeLog:[]};S.botActivity.createdBots=(S.botActivity.createdBots||0)+1;S.botActivity.lastCreatedAt=Date.now();S.botActivity.socialLog=S.botActivity.socialLog||[];S.botActivity.socialLog.unshift({t:Date.now(),area:'Player network',icon:'🌐',detail:`${name} joined from Admin · ${S.bots.length+1} total players`});audit('bot-add',name);toast(`${name} added to the live player network.`);render();};
  $("createTrny").onclick=()=>{
    const size=+$("trnySize").value,entry=+$("trnyEntry").value,rake=+$("trnyRake").value||cfg().trnyRakePct,format=$("trnyFormat").value;
    if(entry<10){toast("Min entry 10.");return;}
    S.trnys=S.trnys||[];
    S.trnys.push({id:"t"+Date.now(),size,entry,rake,format,status:"open",entrants:[],reservedSeat:true,createdBy:"admin",createdAt:Date.now()});
    audit("tournament-create",`${size}P ${format} @ ${entry} rake ${rake}%`);
    toast(`🏟 ${size}-player ${format==="bo3"?'Bo3 Series':'single-flip'} tournament created.`);render();
  };
  $("createPromo").onclick=()=>{
    const type=$("promoType").value,amt=+$("promoAmt").value,sM=+$("promoStart").value,eM=+$("promoEnd").value;
    if(amt<=0){toast("Enter an amount.");return;}
    const start=Date.now()+sM*60000,end=eM>0?Date.now()+eM*60000:0;
    cfg().promotions=cfg().promotions||[];
    cfg().promotions.push({id:'promo-'+Date.now(),type,amount:amt,start,end,on:true,createdAt:Date.now()});
    audit("promo-create",`${type} ${amt} (${sM}→${eM}m)`);
    toast("Campaign created.");render();
  };
  $("promoList").addEventListener("click",e=>{
    const t=e.target.closest("[data-promo-toggle]"),d=e.target.closest("[data-promo-del]");
    if(t){const i=+t.dataset.promoToggle;cfg().promotions[i].on=!cfg().promotions[i].on;audit("promo-toggle",(cfg().promotions[i].on?"on":"off"));render();}
    if(d){const i=+d.dataset.promoDel;audit("promo-delete",cfg().promotions[i].type);cfg().promotions.splice(i,1);render();}
  });
  $("setBc").onclick=()=>{const v=$("broadcastInput").value.trim().slice(0,120);cfg().broadcast=v;audit("broadcast-set",v);toast("Broadcast set.");render();};
  $("clearBc").onclick=()=>{cfg().broadcast="";$("broadcastInput").value="";audit("broadcast-clear","");toast("Broadcast cleared.");render();};
  $("broadcastInput").addEventListener("input",e=>{const v=e.target.value;$("bcPreview").style.display=v?"block":"none";$("bcPreview").textContent="📣 "+v;});
  $("runSim").onclick=()=>{
    const games=+$("simGames").value,stake=+$("simStake").value,cups=+$("simCups").value,trnys=+$("simTrny").value,
      trnyPool=+$("simTrnyPool").value,shop=+$("simShop").value;
    const pot=stake*2;
    const feePerGame=Math.round(pot*cfg().feePct/100);
    const grossFee=games*feePerGame;
    const jpFund=Math.round(grossFee*cfg().jpFundPct/100);
    const cupRake=cups*Math.round(pot*cfg().cupRakePct/100);
    const trnyRake=trnys*Math.round(trnyPool*cfg().trnyRakePct/100);
    const gross=grossFee-jpFund+cupRake+trnyRake+shop;
    const rbCost=Math.round(grossFee*.08); // approx avg rakeback
    const net=gross-rbCost;
    $("simOut").innerHTML=`
      <div class="kv"><span class="k">Regular fees (gross)</span><span class="v">${fmt(grossFee)}</span></div>
      <div class="kv"><span class="k">− Jackpot funding</span><span class="v" style="color:var(--red)">−${fmt(jpFund)}</span></div>
      <div class="kv"><span class="k">Cup rake</span><span class="v">${fmt(cupRake)}</span></div>
      <div class="kv"><span class="k">Tournament rake</span><span class="v">${fmt(trnyRake)}</span></div>
      <div class="kv"><span class="k">Shop</span><span class="v">${fmt(shop)}</span></div>
      <div class="kv"><span class="k">− Est. rakeback cost</span><span class="v" style="color:var(--red)">−${fmt(rbCost)}</span></div>
      <div class="kv" style="border-top:2px solid var(--line);padding-top:8px;margin-top:4px"><span class="k" style="font-weight:800">Net / day</span><span class="v" style="color:var(--gold);font-size:15px">${fmt(net)}</span></div>
      <div class="kv"><span class="k">Net / month (30d)</span><span class="v" style="color:var(--green)">${fmt(net*30)}</span></div>`;
  };
  $("giveComp").onclick=()=>{
    const amt=+$("compAmt").value,reason=$("compReason").value||"goodwill";
    const net=cfg().house.netRevenue;
    if(amt>net){toast(`Refused — comp ${fmt(amt)} exceeds available net revenue ${fmt(net)}.`);return;}
    S.wallet.main+=amt;cfg().house.comps+=amt;cfg().taps+=amt;reconcileHouse();
    audit("comp",`${fmt(amt)} to player: ${reason}`);
    toast(`💚 Comped ${fmt(amt)} — "${reason}".`);render();
  };
  $("compPlayerBtn").onclick=()=>{const a=+$("compPlayerAmt").value;$("compAmt").value=a;$("giveComp").click();};
  bindTog("togMaint","maintenance");
  bindTog("togTopupPromo","topupPromo");
  bindTog("togAuto","autoMatch");
  bindTog("togBots","bots");
  bindTog("togBotGrowth","botGrowth");
  bindTog("togQuests","quests");
  bindTog("togLogin","dailyLogin");
  $("renameBtn").onclick=()=>toast("Rename applies to real player accounts in production (demo player is 'You').");
  $("savePlayerPrefs").onclick=()=>{
    S.settings=S.settings||{};
    S.settings.theme=$("adminTheme").value;S.settings.themeName=$("adminTheme").value==="light"?"light":"midnight";S.settings.customPalette=null;
    S.settings.language=$("adminLanguage").value;
    S.settings.sound=$("adminSound").value==="true";
    S.settings.instant=$("adminInstant").value==="true";
    const stop=Math.max(-10000,Math.min(-50,+$("adminStop").value||-200));S.settings.autoRebetStop=stop;
    const name=$("adminPlayerName").value.trim();S.playerName=name;
    audit("player-prefs",`theme ${S.settings.theme} · lang ${S.settings.language} · sound ${S.settings.sound?'on':'off'} · instant ${S.settings.instant?'on':'off'} · stop ${stop}`);
    if(name)audit("player-rename",name);
    toast("Player preferences saved.");save();render();
  };
  $("exclBtn").onclick=()=>{audit("admin-exclusion-refused","Admin cannot end or initiate Player durable exclusion");toast("Durable self-exclusion is Player-controlled and cannot be undone by Admin.");};
  $("runAntiCheat").onclick=()=>{const r=adminAntiCheatScan();toast(`Anti-cheat scan complete · risk ${r.score}/100`);render();};
  $("advanceRgDelay").onclick=()=>{if(S.rg?.pendingDepositLimits){S.rg.pendingDepositLimits.effectiveAt=Date.now();audit('rg-delay-advance','demo only');toast('Pending deposit-limit increase advanced for demo testing.');render();}else toast('No pending RG increase.');};
  $("exportAnalytics").onclick=()=>{dl('tossmatch-analytics.json',JSON.stringify(S.analytics||{},null,2),'application/json');toast('Analytics JSON exported.');};
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{bindTog});

export {bindTog};
