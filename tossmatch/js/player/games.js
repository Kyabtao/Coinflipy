/* FlipArena player module — games */
import "../shared/runtime.js";
import {STAKE_MIN} from "./core.js";
import {ACHIEVEMENTS,COS,FREE_EMOJIS,QUESTS_SEED,applyVipUnlocks,currentVipEntitlements,sessionStart} from "./bots.js";
import {randHex,shaHex} from "./crypto.js";
import {BOTS_SEED,VIP_DISC,VIP_SEED} from "./data.js";
import {$,addFeed,awardXp,beep,confettiFx,effectiveRakeback,filterSkillBots,fmt,maxStake,pushHistory,recordEngagement,recordPlayerMetrics,sfxFlip,sfxJp,sfxLose,sfxWin,subscriptionQuestMult,toast,vipFor} from "./helpers.js";
import {playerAviHTML,playerFlag,playerName,render} from "./render.js";
import {cfg,save} from "./state.js";
import {GAMES,catalogRandomPick,ensureBotFirstTopup,renderGamePanel,settleBotFlip,takeCatalogBet,topUpBot} from "./sync.js";

function selectSide(s){pickedSide=s;$("pickHeads").classList.toggle("sel",s==="HEADS");$("pickTails").classList.toggle("sel",s==="TAILS");}
function setAutoStop(v){v=Math.round(+v/50)*50;S.settings.autoRebetStop=Math.min(-50,Math.max(-10000,v||-200));save();render();toast(`Auto Bet stop set to ${S.settings.autoRebetStop}.`,"ok");}
function checkGuards(stake){
  if(cfg().features.maintenance)throw new Error("Maintenance mode — betting paused.");
  const now=Date.now(),rg=S.rg;if(rg.selfExPermanent||now<(rg.selfExUntil||0))throw new Error("Durable self-exclusion is active.");if(now<(rg.coolOffUntil||0))throw new Error(`Session cool-off active until ${new Date(rg.coolOffUntil).toLocaleTimeString()}.`);if((rg.sessionLimitMin||0)>0&&now-sessionStart>=rg.sessionLimitMin*60000){rg.coolOffUntil=Math.max(rg.coolOffUntil||0,now+(rg.coolOffMin||1)*60000);throw new Error(`Session time limit (${rg.sessionLimitMin}m) reached. Cool-off started.`);}betTimes=betTimes.filter(t=>now-t<60000);
  if(betTimes.length>=12)throw new Error("Slow down — max 12 bets per minute.");
  if(S.lossLimit>0 && sessionNet<=-S.lossLimit)throw new Error(`Session loss limit (−${S.lossLimit}) reached. Take a break.`);
  if(stake<STAKE_MIN)throw new Error("Minimum stake is 10.");
  if(stake>maxStake())throw new Error(`Max stake for level ${S.level} is ${maxStake()}.`);
  if(S.wallet.main+S.wallet.bonus+S.wallet.referral+S.wallet.rakeback<stake)throw new Error("Insufficient total balance.");
  betTimes.push(now);
}
function escrow(stake){
  const cap=Math.round(stake*cfg().nonMainCapPct/100);
  const split={main:0,bonus:0,referral:0,rakeback:0};let rem=cap;
  // Calculate first, then debit atomically. A failed MAIN-balance check must not
  // silently consume bonus/referral/rakeback funds.
  for(const seg of ["bonus","referral","rakeback"]){const take=Math.min(rem,S.wallet[seg]);split[seg]=take;rem-=take;}
  split.main=stake-(split.bonus+split.referral+split.rakeback);
  if(S.wallet.main<split.main)throw new Error(`Need ${fmt(split.main)} MAIN (you have ${fmt(S.wallet.main)}). Non-main capped at ${cfg().nonMainCapPct}%.`);
  for(const seg of ["main","bonus","referral","rakeback"])S.wallet[seg]-=split[seg];
  return split;
}
function refund(split){for(const k in split)S.wallet[k]+=split[k];}
async function postBet(side,stake,taunt,priv=false){
  if(busy)return;stake=Math.round(+stake);
  if(!side){toast("Pick HEADS or TAILS.","err");return;}
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  const ent=currentVipEntitlements(),bet={id:"w"+S.gid++,owner:"you",name:playerName(),side,stake,taunt:taunt||"",wait:0,split,privateLock:priv,kind:"toss",vipTier:ent.tier,priority:ent.queuePriority};
  S.waiting.push(bet);
  addFeed(`📨 <b>You</b> posted ${side} @ ${fmt(stake)}${taunt?' — "'+taunt+'"':''}${priv?' 🔒':''}`);
  render();
  if(!priv){$("matchStatus").innerHTML='<span class="spinner"></span> Waiting for opponent…';setTimeout(botMatchPlayer,ent.queuePriority?100+Math.random()*180:250+Math.random()*550);}
  else $("matchStatus").textContent="Private bet posted — only manual Take will match it.";
  return bet;
}
function botByName(n){const bot=S.bots.find(b=>b.name===n);if(bot)ensureBotFirstTopup(bot,'Required first top-up before direct interaction');return bot;}
function seedBotBets(){
  if(!cfg().features.bots)return;
  let have=S.waiting.filter(b=>b.owner!=="you"&&(b.kind||"toss")==="toss").length;
  const desired=12;
  let guard=0;
  while(have<desired&&guard++<20){
    const b=BOTS_SEED[Math.floor(Math.random()*BOTS_SEED.length)];const bot=botByName(b.name);
    if(!bot||bot.balance<50||S.waiting.some(w=>w.owner===b.name&&(w.kind||"toss")==="toss")){have++;continue;}
    const stake=[50,100,100,250,250,500,500,1000][Math.floor(Math.random()*8)];
    if(bot.balance<stake){have++;continue;}
    bot.balance-=stake;
    S.waiting.push({id:"b"+S.gid++,owner:b.name,name:b.name,avi:b.avi,flag:b.flag,kind:"toss",side:Math.random()<.5?"HEADS":"TAILS",stake,wait:Math.floor(1+Math.random()*15),botSplit:{main:stake},createdAt:Date.now()});
    have++;
  }
}
function seedBotCatalogBets(limit=8){
  if(!cfg().features.bots||typeof GAMES==="undefined")return;
  const missing=GAMES.filter(g=>!S.waiting.some(w=>w.kind==="catalog"&&w.catalogGame===g.id&&w.owner!=="you"));
  for(let i=missing.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[missing[i],missing[j]]=[missing[j],missing[i]];}
  missing.slice(0,limit).forEach(g=>{
    const stake=[50,100,100,200][Math.floor(Math.random()*4)],pool=S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=stake&&!S.waiting.some(w=>w.owner===b.name&&w.kind==="catalog"&&w.catalogGame===g.id));if(!pool.length)return;
    const bot=pool[Math.floor(Math.random()*pool.length)],pick=catalogRandomPick(g);bot.balance-=stake;
    S.waiting.push({id:"cb"+S.gid++,owner:bot.name,name:bot.name,avi:bot.avi,flag:bot.flag,kind:"catalog",catalogGame:g.id,gameName:g.name,pick:String(pick),side:String(pick),stake,wait:0,botEscrowed:true,createdAt:Date.now()});
    if(!window._suppressFeed&&Math.random()<0.3)addFeed(`📨 <b>${bot.name}</b> opened ${g.name} · pick 🎭 hidden @ ${fmt(stake)}`);
  });
}
async function autoMatchBotTossBet(open){
  if(!open||busy)return;const a=botByName(open.owner),pool=S.bots.filter(b=>b!==a&&b.balance>=open.stake);if(!a||!pool.length)return;const b=pool[Math.floor(Math.random()*pool.length)];
  S.waiting=S.waiting.filter(x=>x!==open);a.balance+=open.stake;await settleBotFlip(a,b,open.stake);
}
function botMatchPlayer(){
  const my=S.waiting.find(b=>b.owner==="you"&&(b.kind||"toss")==="toss"&&!b.privateLock);if(!my||busy)return;
  const avail=filterSkillBots(S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=my.stake));
  if(!avail.length){$("matchStatus").textContent="Waiting for an opponent…";return;}
  matchWithBot(my,avail[Math.floor(Math.random()*avail.length)]);
}
async function matchWithBot(pbet,bot){
  const side=pbet.side==="HEADS"?"TAILS":"HEADS";
  bot.balance-=pbet.stake;
  const bb={id:"b"+S.gid++,owner:bot.name,name:bot.name,avi:bot.avi,flag:bot.flag,side,stake:pbet.stake,botSplit:{main:pbet.stake}};
  S.waiting=S.waiting.filter(b=>b!==pbet);
  await settleFlip(pbet,bb,bot);
}
async function settleFlip(maker,taker,bot,opts={}){
  busy=true;
  const stake=maker.stake,pot=stake*2,fee=Math.round(pot*cfg().feePct/100),gameId=S.gid++;
  const makerSeed=randHex(),takerSeed=randHex(),serverSeed=randHex();
  const makerHash=await shaHex(`${makerSeed}:${gameId}:${stake}:${maker.side}`);
  const takerHash=await shaHex(`${takerSeed}:${gameId}:${stake}:${taker.side}`);
  const commit=await shaHex(serverSeed);
  const combined=(BigInt("0x"+makerHash)+BigInt("0x"+takerHash)+BigInt("0x"+commit)).toString(16);
  const finalHash=await shaHex(combined+":"+gameId);
  const fb=parseInt(finalHash.slice(0,2),16);
  const result=fb%2===0?"HEADS":"TAILS";
  const armed=S.jackpot>=cfg().jpArm;
  const jpHit=fb===0&&armed;
  const jpContrib=Math.max(0,Math.min(fee-1,Math.max(cfg().jpFloor,Math.round(fee*cfg().jpFundPct/100))));
  S.jackpot+=jpContrib;
  const vip=vipFor(S.monthWagered);
  const rbYou=Math.round((fee/2)*effectiveRakeback(vip.rakeback)/100);S.accruedRakeback+=rbYou;
  let payout=pot-fee,jpPayout=0;
  if(jpHit){jpPayout=Math.round(S.jackpot*cfg().jpPayPct/100);S.jackpot-=jpPayout;}
  const youSide=maker.owner==="you"?maker.side:taker.side;
  const youWin=result===youSide;
  const opp=taker.owner==="you"?maker:taker;
  let delta=0;
  if(youWin){S.wallet.main+=payout+jpPayout;delta=(payout+jpPayout)-stake;}
  else delta=-stake;
  if(bot){
    bot.games=(bot.games||0)+1;
    if(!youWin){
      bot.balance+=payout+jpPayout;
      bot.net+=(payout-stake+jpPayout);
      bot.wins=(bot.wins||0)+1;
      bot.streak=(bot.streak||0)+1;
      bot.bestStreak=Math.max(bot.bestStreak||0,bot.streak);
      bot.biggestWin=Math.max(bot.biggestWin||0,payout-stake+jpPayout);
      if(jpHit)bot.jackpots=(bot.jackpots||0)+1;
    }else{
      bot.losses=(bot.losses||0)+1;
      bot.streak=0;
      bot.net=(bot.net||0)-stake;
    }
  }
  const source=opts.source||"coin",gameLabel=source==='friend'?"Friend Challenge":source==='room'?"Private Room Coin Toss":"Coin Toss";
  const rec={id:gameId,t:Date.now(),game:gameLabel,source,result,stake,fee,payout:youWin?payout+jpPayout:0,jpHit,jpPayout,oppName:opp.name,oppFlag:opp.flag||"",playerPick:youSide,botPick:opp.side,winner:youWin?"you":"opp",delta,taunt:maker.taunt||taker.taunt||"",resultText:`${result} from byte ${fb}${jpHit?' · jackpot hit':''}`,
    proof:{serverSeed,makerSeed,takerSeed,makerHash,takerHash,commit,combined,finalHash,firstByte:fb,gameId},verified:true};
  S.games.unshift(rec);if(S.games.length>200)S.games.pop();recordPlayerMetrics({stake,payout:rec.payout,fee,source,result:youWin?'WIN':'LOSE'});
  if(source==='friend')pushHistory('friendChallenges',{title:'Friend Challenge',detail:`${opp.name} · ${youSide} vs ${opp.side} · ${result}`,amount:delta,payout:rec.payout,result:youWin?'WIN':'LOSE',gameId,opponent:opp.name});
  if(source==='room')pushHistory('roomGames',{title:opts.roomName||'Private Room',detail:`${opp.name} · ${youSide} vs ${opp.side} · ${result}`,amount:delta,payout:rec.payout,result:youWin?'WIN':'LOSE',gameId,roomId:opts.roomId});
  lastProof=rec.proof;
  S.stats.games++;S.global.totalGames++;
  if(result==="HEADS")S.global.heads++;else S.global.tails++;
  S.monthWagered+=stake;awardXp(stake);S.stats.biggestStake=Math.max(S.stats.biggestStake,stake);
  if(youWin){
    const wasComeback=(S.lossStreak||0)>=2;
    S.stats.wins++;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);S.stats.net+=delta;S.stats.bestWin=Math.max(S.stats.bestWin,payout+jpPayout-stake);S.quests.win=Math.min(1,(S.quests.win||0)+1);S.lossStreak=0;
    if(S.streak===3)unlockAch("onfire");if(S.streak===5)unlockAch("unstoppable");
    if(wasComeback)unlockAch("comeback");
  }else{S.stats.losses++;S.streak=0;S.stats.net+=delta;S.lossStreak++;}
  S.quests.settle=Math.min(3,(S.quests.settle||0)+1);recordEngagement("coin",youWin);
  if(stake>=500)unlockAch("bigballer");
  if(S.stats.games>=1)unlockAch("first");if(S.stats.games>=10)unlockAch("nightowl");if(S.stats.games>=25)unlockAch("frequent");
  if(S.stats.wins>=10)unlockAch("doubledigits");if(S.level>=5)unlockAch("highroller");
  if(jpHit){S.stats.jackpots++;S.global.jackpots++;unlockAch("jackpot");cfg().reviewFlags.unshift({t:Date.now(),game:gameId,type:"jackpot",amount:jpPayout});if(cfg().reviewFlags.length>80)cfg().reviewFlags.length=80;}
  if(payout+jpPayout>=400&&!jpHit)cfg().reviewFlags.unshift({t:Date.now(),game:gameId,type:"big-win",amount:payout+jpPayout-stake});if(cfg().reviewFlags.length>80)cfg().reviewFlags.length=80;
  sessionNet+=delta;
  // level up
  checkProgressAchievements();
  // house accounting
  cfg().house.fees+=fee-jpContrib;cfg().house.netRevenue+=fee-jpContrib;cfg().sinks+=fee;
  // referral 5%
  if(S.referredBy){/* in a 2-player system the referrer is another human; demo: credit to a virtual referrer pool not tracked here */}
  addFeed(`${youWin?'<span class="fw">🎉 You won</span>':'<span class="fl">You lost</span>'} ${result} vs <b>${opp.name}</b> ${opp.flag||""} @ ${fmt(stake)}${jpHit?` 🎰 <b>JACKPOT +${fmt(jpPayout)}!</b>`:""}`,jpHit);
  await animateFlip(result);
  showResult(rec,youWin,jpPayout,opp);
  if(jpHit){sfxJp();confettiFx();}else if(youWin){sfxWin();if(payout+jpPayout>=400)confettiFx();}else sfxLose();
  busy=false;
  // x2 / rematch actions
  showResultActions(rec,youSide,stake);
  render();
  if(S.settings.autoRebet&&!busy){
    if(sessionNet<=S.settings.autoRebetStop){S.settings.autoRebet=false;toast(`🛑 Auto Bet stopped — session reached ${S.settings.autoRebetStop}.`,"err");render();}
    else setTimeout(()=>{if(!busy&&S.settings.autoRebet)postBet(youSide,stake,"",false);},1500);
  }
  // maybe spawn bot reactions
  if(Math.random()<.35){const e=FREE_EMOJIS[Math.floor(Math.random()*3)];S.reactions[gameId]=S.reactions[gameId]||{};S.reactions[gameId][e]=(S.reactions[gameId][e]||0)+1;render();}
}
function unlockAch(id){
  if(S.achievements[id])return;
  const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return;
  S.achievements[id]=true;S.wallet.bonus+=a.rew;cfg().taps+=a.rew;
  toast(`${a.icon} <b>${a.name}</b> unlocked! +${a.rew} 🪙`,"ok");
  addFeed(`🏅 <b>You</b> unlocked "${a.name}"`);
}
function checkProgressAchievements(){
  applyVipUnlocks(true);const st=S.stats,vip=vipFor(S.monthWagered),catalogCount=Object.keys(S.catalogPlayed||{}).length;
  const ownedPaid=Object.entries(S.owned).reduce((n,[k,arr])=>n+(arr||[]).filter(id=>!['classic','none','default','confetti','midnight','standard'].includes(id)).length,0);
  if(st.games>=100)unlockAch("century");if(st.games>=250)unlockAch("veteran");if(st.wins>=25)unlockAch("winner25");if(st.wins>=100)unlockAch("winner100");
  if(S.bestStreak>=10)unlockAch("streak10");if(st.cupsWon>=5)unlockAch("cup5");if(st.trnysWon>=3)unlockAch("trny3");
  if(catalogCount>=5)unlockAch("catalog5");if(catalogCount>=33)unlockAch("catalog17");if(ownedPaid>=5)unlockAch("collector5");if(ownedPaid>=15)unlockAch("collector15");
  if(vip.tier>=2)unlockAch("silvervip");if(vip.tier>=3)unlockAch("goldvip");if(st.net>=1000)unlockAch("profit1000");if(S.level>=5)unlockAch("highroller");if(S.level>=10)unlockAch("level10");if(S.level>=20)unlockAch("level20");if((S.transferCount||0)>=5)unlockAch("transfer5");
  if((S.social.friends||[]).length>=5)unlockAch("friends5");if((S.social.friends||[]).length>=10)unlockAch("friends10");if((S.social.chat||[]).filter(x=>x.from==='You').length>=10)unlockAch("chat10");
  if((S.histories.rooms||[]).filter(x=>x.result==='CREATED').length>=3)unlockAch("rooms3");if((S.social.gifts||[]).length>=3)unlockAch("gifts3");if((st.arcadePlays||0)>=10)unlockAch("arcade10");if((st.arcadePlays||0)>=50)unlockAch("arcade50");
  if((st.maxPayout||0)>=1000)unlockAch("maxpay1000");if((st.lifetimeWagered||0)>=10000)unlockAch("wager10000");if((st.cupsWon||0)>=10)unlockAch("cup10");if((st.trnysWon||0)>=5)unlockAch("trny5");
  if(ownedPaid>=25)unlockAch("collector25");if(S.level>=30)unlockAch("level30");if(S.level>=40)unlockAch("level40");if(S.level>=50)unlockAch("level50");if((S.transferCount||0)>=10)unlockAch("transfer10");
  if(S.bestStreak>=15)unlockAch("streak15");if((st.catalogGames||0)>=50)unlockAch("catalog50");if((st.clanGames||0)>=5)unlockAch("clan5");
  if((st.catalogGames||0)>0&&(st.seriesPlayed||0)>0&&(st.tournamentEntries||0)>0&&(st.friendGames||0)>0&&(st.arcadePlays||0)>0)unlockAch("allrounder");
}
async function animateFlip(result){
  const coin=$("coin");$("matchStatus").innerHTML='<span class="spinner"></span> Flipping…';
  coin.style.transition="none";coin.style.transform="rotateY(0deg)";coin.offsetHeight;coin.style.transition="";
  coin.classList.add("flipping");
  const spins=5,target=result==="HEADS"?spins*360:spins*360+180;
  const dur=S.settings.instant?450:2300;
  coin.style.transition=`transform ${dur}ms cubic-bezier(.2,.7,.2,1.05)`;
  requestAnimationFrame(()=>coin.style.transform=`rotateY(${target}deg)`);
  sfxFlip();await new Promise(r=>setTimeout(r,dur+100));coin.classList.remove("flipping");
}
function showResult(rec,yw,jpP,opp){
  $("matchStatus").textContent="";
  const b=$("resultBanner");b.style.display="block";b.className="result-banner "+(jpP?"jp":(yw?"win":"lose"));
  b.innerHTML=yw?`🎉 WIN! +${fmt(rec.delta)} coins${jpP?` · 🎰 JACKPOT +${fmt(jpP)}!`:""}`:`😞 ${rec.result} — lost ${fmt(rec.stake)}.`;
  if(jpP)b.innerHTML+=`<br><small>Byte 0x00 — ${cfg().jpPayPct}% of pool paid, remainder rolls over</small>`;
  const p=rec.proof;$("proof").classList.add("show");
  $("proof").innerHTML=`<div class="ph">🔐 Proof — game #${p.gameId} ${rec.verified?'<span class="ok">✓ verified</span>':''}</div>
    <div><span class="pl">serverSeed:</span> <span class="pv">${p.serverSeed.slice(0,28)}…</span> <button class="btn btn-sm btn-ghost" id="copySeed" style="padding:2px 8px;font-size:10px">📋 Copy</button></div>
    <div><span class="pl">commitment:</span> ${p.commit.slice(0,24)}…</div>
    <div><span class="pl">maker/taker hash:</span> ${p.makerHash.slice(0,18)}… / ${p.takerHash.slice(0,18)}…</div>
    <div><span class="pl">finalHash:</span> <span class="pv">${p.finalHash.slice(0,28)}…</span></div>
    <div><span class="pl">firstByte:</span> <b>0x${p.firstByte.toString(16).padStart(2,"0")}</b> (${p.firstByte}) → parity ${p.firstByte%2} → <b>${rec.result}</b></div>`;
  setTimeout(()=>{const cs=$("copySeed");if(cs)cs.onclick=()=>{navigator.clipboard.writeText(p.serverSeed).then(()=>toast("Server seed copied.","ok"));};},10);
}
function showResultActions(rec,youSide,stake){
  const el=$("resultActions");el.style.display="flex";
  const x2stake=Math.min(stake*2,maxStake());
  el.innerHTML=`
    <button class="btn btn-primary btn-sm" id="x2Btn" ${x2stake>maxStake()||stake*2>S.wallet.main?'disabled':''}>×2 Double (${fmt(x2stake)})</button>
    <button class="btn btn-ghost btn-sm" id="againBtn">🔁 Again</button>
    <button class="btn btn-ghost btn-sm" id="closeResBtn">✕ Close</button>`;
  $("x2Btn").onclick=()=>postX2(youSide,x2stake);
  $("againBtn").onclick=()=>postBet(youSide,stake,"",false);
  $("closeResBtn").onclick=()=>{el.style.display="none";$("resultBanner").style.display="none";$("proof").classList.remove("show");};
}
function postX2(side,stake){
  if(busy)return;
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  const ch={id:"x"+S.gid++,owner:"you",name:playerName(),side,stake,split,expires:Date.now()+600000};
  S.x2room.push(ch);
  addFeed(`⚡ <b>You</b> posted a ×2 challenge: ${side} @ ${fmt(stake)}`);
  toast("×2 challenge posted — 10 min TTL.","ok");
  // bot accepts after delay (demo)
  setTimeout(()=>{if(!busy&&S.x2room.includes(ch))botAcceptX2(ch);},500+Math.random()*700);
  $("resultActions").style.display="none";$("resultBanner").style.display="none";$("proof").classList.remove("show");
  render();
}
async function botAcceptX2(ch){
  const avail=S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=ch.stake);if(!avail.length)return;
  const bot=avail[Math.floor(Math.random()*avail.length)];
  bot.balance-=ch.stake;
  const side=ch.side==="HEADS"?"TAILS":"HEADS";
  const pbet={id:"xw"+S.gid++,owner:"you",name:playerName(),side:ch.side,stake:ch.stake,split:ch.split};
  const bb={id:"xb"+S.gid++,owner:bot.name,name:bot.name,avi:bot.avi,flag:bot.flag,side,stake:ch.stake,botSplit:{main:ch.stake}};
  S.x2room=S.x2room.filter(x=>x!==ch);
  addFeed(`⚡ <b>${bot.name}</b> accepted your ×2 challenge!`);
  await settleFlip(pbet,bb,bot);
}
function makeCup(maker, stake, fmt, opts={}){
  return {id:"c"+S.gid++, fmt, stake, wait:0,
    entrants:[maker], reservedSeat:opts.reservedSeat!==false,
    createdBy:opts.createdBy||(maker.you?"you":"bot")};
}
async function botFillCup(cup){
  if(!cup||!S.cups.includes(cup)||cup.entrants.length>=2||busy)return;
  const avail=S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=cup.stake&&!cup.entrants.some(e=>e.name===b.name));
  if(!avail.length)return;
  const joiningBot=avail[Math.floor(Math.random()*avail.length)];
  joiningBot.balance-=cup.stake;
  cup.entrants.push({name:joiningBot.name,avi:joiningBot.avi,flag:joiningBot.flag,bot:joiningBot});
  addFeed(`⚔️ <b>${joiningBot.name}</b> ${joiningBot.flag} joined the ${cup.fmt.toUpperCase()} cup`);
  const maker=cup.entrants[0],taker=cup.entrants[1];
  S.cups=S.cups.filter(c=>c!==cup);
  await settleCup(maker,taker,joiningBot,cup);
}
async function settleCup(maker,taker,bot,cup){
  if(busy){console.warn("settleCup skipped: busy");return;}
  busy=true;
  try{
    const cupStake=(cup&&cup.stake)||maker.stake||taker.stake;
    const format=(cup&&cup.fmt)||maker.fmt||taker.fmt||"bo3";
    const rake=Math.round(cupStake*2*cfg().cupRakePct/100);
    const payout=cupStake*2-rake;
    const gameId=S.gid++;
    const youInvolved=!!(maker.you||taker.you);
    const entrantBot=e=>e&&!e.you?(botByName(e.name)||e.bot||null):null;
    const makerBot=entrantBot(maker),takerBot=entrantBot(taker);
    if(youInvolved)showCupModal(format,cupStake);
    const target=format==="bo3"?2:format==="bo5"?3:format==="bo7"?4:2;
    const advantage=format==="adv";
    let aWins=0,bWins=0,games=0,flips=[],maxGames=advantage?9:target*2-1;
    const makerHash=await shaHex(randHex()+":"+gameId),takerHash=await shaHex(randHex()+":"+gameId),commit=await shaHex(randHex());
    while(games<maxGames){
      games++;
      const combined=(BigInt("0x"+makerHash)+BigInt("0x"+takerHash)+BigInt("0x"+commit)).toString(16);
      const fh=await shaHex(combined+":"+gameId+":f"+games);
      const fb=parseInt(fh.slice(0,2),16),res=fb%2===0?"HEADS":"TAILS";
      if(res==="HEADS")aWins++;else bWins++;
      flips.push(res);
      if(youInvolved){
        updateCupModal(flips,aWins,bWins,target,format);sfxFlip();
        await new Promise(r=>setTimeout(r,S.settings.instant?200:550));
      }else await new Promise(r=>setTimeout(r,40));
      if(!advantage&&(aWins>=target||bWins>=target))break;
      if(advantage&&games>=3&&Math.abs(aWins-bWins)>=2)break;
    }
    const makerWins=aWins>bWins;
    S.global.totalGames++;
    cfg().house.cupRakes+=rake;cfg().house.netRevenue+=rake;cfg().sinks+=rake;

    // Bot-only Series Cups settle autonomously and never touch player stats.
    if(!youInvolved){
      const winner=makerWins?maker:taker,loser=makerWins?taker:maker;
      const winnerBot=makerWins?makerBot:takerBot,loserBot=makerWins?takerBot:makerBot;
      if(winnerBot){winnerBot.balance+=payout;winnerBot.games=(winnerBot.games||0)+1;winnerBot.wins=(winnerBot.wins||0)+1;winnerBot.net=(winnerBot.net||0)+payout-cupStake;winnerBot.streak=(winnerBot.streak||0)+1;winnerBot.bestStreak=Math.max(winnerBot.bestStreak||0,winnerBot.streak);winnerBot.biggestWin=Math.max(winnerBot.biggestWin||0,payout-cupStake);}
      if(loserBot){loserBot.games=(loserBot.games||0)+1;loserBot.losses=(loserBot.losses||0)+1;loserBot.net=(loserBot.net||0)-cupStake;loserBot.streak=0;}
      addFeed(`⚔️ <b>${winner.name}</b> ${winner.flag||""} beat <b>${loser.name}</b> ${loser.flag||""} in a ${format.toUpperCase()} bot Series Cup (${aWins}–${bWins})`);
      [winnerBot,loserBot].forEach(b=>topUpBot(b,"Series Cup balance"));
      return;
    }

    const makerIsYou=!!maker.you,takerIsYou=!!taker.you;
    const youWin=(makerIsYou&&makerWins)||(takerIsYou&&!makerWins);
    const delta=youWin?payout-cupStake:-cupStake;
    if(youWin)S.wallet.main+=payout;
    const opponentBot=makerIsYou?takerBot:makerBot;
    if(opponentBot){
      opponentBot.games=(opponentBot.games||0)+1;
      if(!youWin){opponentBot.balance+=payout;opponentBot.net=(opponentBot.net||0)+payout-cupStake;opponentBot.wins=(opponentBot.wins||0)+1;opponentBot.streak=(opponentBot.streak||0)+1;opponentBot.bestStreak=Math.max(opponentBot.bestStreak||0,opponentBot.streak);}
      else{opponentBot.net=(opponentBot.net||0)-cupStake;opponentBot.losses=(opponentBot.losses||0)+1;opponentBot.streak=0;}
    }
    S.monthWagered+=cupStake;awardXp(cupStake);S.stats.net+=delta;sessionNet+=delta;S.quests.cup=1;recordEngagement("series",youWin);
    const oppName=makerIsYou?taker.name:maker.name;
    const oppFlag=makerIsYou?(taker.flag||""):(maker.flag||"");
    if(youWin){S.stats.cupsWon++;unlockAch("cup");addFeed(`⚔️ <b>You</b> won a ${format.toUpperCase()} cup vs ${oppName} — +${fmt(payout-cupStake)}`);sfxWin();confettiFx();}
    else{addFeed(`⚔️ <b>${oppName}</b> ${oppFlag} beat you in the ${format.toUpperCase()} cup`);sfxLose();}
    checkProgressAchievements();
    S.games.unshift({id:gameId,t:Date.now(),game:`Series Cup ${format.toUpperCase()}`,result:youWin?"WIN":"LOSE",stake:cupStake,fee:rake,payout:youWin?payout:0,oppName,oppFlag,winner:youWin?"you":"opp",delta,verified:true,flips,resultText:`${aWins}-${bWins} · ${flips.map(f=>f[0]).join(' ')}`});recordPlayerMetrics({stake:cupStake,payout:youWin?payout:0,fee:rake,source:'series',result:youWin?'WIN':'LOSE'});
    if(S.games.length>200)S.games.pop();
    finishCupModal(youWin,payout,aWins,bWins,cupStake);
  }catch(err){console.warn("settleCup error:",err);}
  finally{busy=false;render();}
}
function showCupModal(format,stake){
  $("modalContent").innerHTML="";
  $("modalBg").classList.add("show");
  $("modalContent").innerHTML=`<h3>⚔️ ${format.toUpperCase()} Series Cup — ${fmt(stake)} entry</h3>
    <div class="muted">First to ${format==="bo3"?2:format==="bo5"?3:format==="bo7"?4:2} wins${format==="adv"?" (win by 2, max 9 flips)":""}. ${cfg().cupRakePct}% rake.</div>
    <div class="cup-flips" id="cupFlips"></div>
    <div id="cupScore" style="text-align:center;font-size:20px;font-weight:800;margin:10px 0">0 — 0</div>`;
}
function updateCupModal(flips,a,b){
  $("cupFlips").innerHTML=flips.map(f=>`<div class="cup-flip ${f.toLowerCase()[0]}">${f[0]}</div>`).join("");
  $("cupScore").innerHTML=`<span style="color:var(--heads)">${a}</span> — <span style="color:var(--tails)">${b}</span>`;
}
function finishCupModal(win,payout,a,b,stake){
  $("modalContent").innerHTML+=`<div class="result-banner ${win?'win':'lose'}" style="display:block;margin-top:12px">${win?`🏆 Cup won! +${fmt(payout-stake)}`:`Cup lost ${a}–${b}`}</div>
    <button class="btn btn-primary" style="margin-top:12px" onclick="document.getElementById('modalBg').classList.remove('show')">Close</button>`;
}
function createTournament(size,entry,rake,createdBy,format="single"){
  const tournament={id:"t"+S.gid++,size,entry,rake:rake||cfg().trnyRakePct,format,status:"open",
    entrants:[],reservedSeat:true,createdBy:createdBy||"admin",createdAt:Date.now()};
  fillTournamentBots(tournament,false);
  return tournament;
}
function fillTournamentBots(t,fillAll=false){
  t.entrants=Array.isArray(t.entrants)?t.entrants:[];t.format=t.format||"single";
  const hasPlayer=t.entrants.some(e=>e.you);
  const target=(hasPlayer||fillAll)?t.size:t.size-1; // short public join window, then bots fill all
  const used=new Set(t.entrants.map(e=>e.name));
  const pool=S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=t.entry&&!used.has(b.name));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  while(t.entrants.length<target&&pool.length){
    const bot=pool.pop();bot.balance-=t.entry;
    t.entrants.push({name:bot.name,avi:bot.avi,flag:bot.flag,bot});
  }
  t.reservedSeat=!hasPlayer&&t.entrants.length<t.size;
  return t;
}
async function runTournament(t){
  if(busy){console.warn("tournament skipped: busy");return;}
  busy=true;t.status="running";t.format=t.format||"single";
  try{
    let entrants=[...t.entrants];
    for(let i=entrants.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[entrants[i],entrants[j]]=[entrants[j],entrants[i]];}
    const rounds=[entrants.map(e=>({...e}))],youInvolved=t.entrants.some(e=>e.you);
    const serverSeed=randHex();let round=0,finalLoser=null;if(youInvolved)showTrnyModal(t,rounds);
    while(entrants.length>1){
      round++;
      const winners=[],roundMatches=[];
      for(let i=0;i<entrants.length;i+=2){
        const a=entrants[i],b=entrants[i+1];
        if(!b){winners.push(a);roundMatches.push({a,b,winner:a});continue;}
        const gid=S.gid++;
        const aHash=await shaHex(randHex()+gid),bHash=await shaHex(randHex()+gid),commit=await shaHex(serverSeed);
        const combined=(BigInt("0x"+aHash)+BigInt("0x"+bHash)+BigInt("0x"+commit)).toString(16);
        const need=t.format==="bo3"?2:1,maxFlips=t.format==="bo3"?3:1;
        let aw=0,bw=0,matchFlips=[];
        for(let f=1;f<=maxFlips&&aw<need&&bw<need;f++){
          const fh=await shaHex(combined+":"+gid+":f"+f),aWins=parseInt(fh.slice(0,2),16)%2===0;
          matchFlips.push(aWins?"H":"T");if(aWins)aw++;else bw++;
        }
        const winner=aw>bw?a:b,loser=aw>bw?b:a;
        if(entrants.length===2)finalLoser=loser;
        winners.push(winner);roundMatches.push({a,b,winner,score:`${aw}-${bw}`,flips:matchFlips});
        const wb=!winner.you?botByName(winner.name):null,lb=!loser.you?botByName(loser.name):null;
        if(wb){wb.games=(wb.games||0)+1;wb.wins=(wb.wins||0)+1;wb.streak=(wb.streak||0)+1;wb.bestStreak=Math.max(wb.bestStreak||0,wb.streak);}
        if(lb){lb.games=(lb.games||0)+1;lb.losses=(lb.losses||0)+1;lb.streak=0;}
        if(winner.you){S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);}else if(loser.you)S.streak=0;
        S.global.totalGames++;
        if(youInvolved){updateTrnyModal(rounds,roundMatches,round);sfxFlip();await new Promise(r=>setTimeout(r,S.settings.instant?200:600));}
        else await new Promise(r=>setTimeout(r,35));
      }
      rounds.push(winners.map(w=>({...w})));entrants=winners;
    }
    const champion=entrants[0],runnerUp=finalLoser;
    const pool=t.size*t.entry,rake=Math.round(pool*t.rake/100),champPrize=Math.round((pool-rake)*.75),ruPrize=(pool-rake)-champPrize;
    let youWon=false,youRU=false;
    if(champion.you){S.wallet.main+=champPrize;youWon=true;S.stats.trnysWon++;unlockAch("champ");addFeed(`👑 <b>You</b> won the ${t.size}-player ${t.format==="bo3"?'Bo3 ':''}tournament! +${fmt(champPrize)}`);sfxJp();confettiFx();}
    if(runnerUp&&runnerUp.you){S.wallet.main+=ruPrize;youRU=true;addFeed(`🥈 <b>You</b> placed runner-up — +${fmt(ruPrize)}`);}
    t.entrants.forEach(en=>{if(en.you)return;const b=botByName(en.name)||en.bot;if(!b)return;const prize=en===champion?champPrize:(en===runnerUp?ruPrize:0);b.balance+=prize;b.net=(b.net||0)+prize-t.entry;topUpBot(b,"Tournament balance");});
    cfg().house.trnyRakes+=rake;cfg().house.netRevenue+=rake;cfg().sinks+=rake;
    if(youInvolved){
      const playerEntrant=t.entrants.find(e=>e.you),playerEntry=(playerEntrant&&playerEntrant.entryPaid)||t.entry,delta=youWon?champPrize-playerEntry:(youRU?ruPrize-playerEntry:-playerEntry);S.stats.net+=delta;sessionNet+=delta;S.monthWagered+=playerEntry;awardXp(playerEntry);recordEngagement("tournament",youWon);
      S.games.unshift({id:S.gid++,t:Date.now(),game:`${t.size}P ${t.format==="bo3"?'Bo3 Series':'Single-Flip'} Tournament`,result:youWon?"WIN":youRU?"RUNNER-UP":"ELIMINATED",stake:playerEntry,fee:rake,payout:youWon?champPrize:youRU?ruPrize:0,oppName:champion.name,oppFlag:champion.flag||"",winner:youWon?"you":"opp",delta,verified:true,resultText:`Champion ${champion.name} · runner-up ${runnerUp&&runnerUp.name} · prizes ${champPrize}/${ruPrize}${playerEntry<t.entry?` · VIP entry ${playerEntry}`:''}`});if(S.games.length>200)S.games.pop();recordPlayerMetrics({stake:playerEntry,payout:youWon?champPrize:youRU?ruPrize:0,fee:rake,source:'tournament',result:youWon?'WIN':youRU?'RUNNER-UP':'LOSE'});checkProgressAchievements();
    }
    else addFeed(`🏟️ <b>${champion.name}</b> ${champion.flag||""} won a bot-only ${t.size}-player ${t.format==="bo3"?'Bo3 Series':'single-flip'} tournament — ${fmt(champPrize)} coins`,false);
    t.status="complete";t.champion=champion.name;t.runnerUp=runnerUp&&runnerUp.name;
    t.entrants=t.entrants.map(e=>({name:e.name,avi:e.avi,flag:e.flag,you:!!e.you}));
    t.rounds=rounds.map(r=>r.map(e=>({name:e.name,avi:e.avi,flag:e.flag,you:!!e.you})));
    if(youInvolved)finishTrnyModal(champion,runnerUp,champPrize,ruPrize);
  }catch(err){console.warn("tournament error:",err);t.status="open";}
  finally{busy=false;render();}
}
function showTrnyModal(t){
  $("modalContent").innerHTML="";
  $("modalBg").classList.add("show");
  $("modalContent").innerHTML=`<h3>🏟️ ${t.size}-Player ${t.format==="bo3"?'Bo3 Series':'Single-Flip'} Tournament</h3><div class="muted">Bots fill every open slot · ${t.rake}% rake · 75/25 payout</div><div id="bracket" class="bracket" style="margin-top:14px"></div><div id="trnyStatus" class="muted" style="margin-top:12px"></div>`;
  $("modalBg").classList.add("show");
}
function updateTrnyModal(rounds,matches,rnd){
  const b=$("bracket");b.innerHTML="";
  rounds.forEach((r,i)=>{
    const col=document.createElement("div");col.className="br-col";
    const h=document.createElement("div");h.className="br-round-h";h.textContent=i===0?"Round 1":(i===rounds.length-1?"Finals":"Round "+i);col.appendChild(h);
    r.forEach(p=>{const m=document.createElement("div");m.className="br-match";
      const won=matches&&i===rnd-1&&matches.some(x=>x.winner===p);
      m.innerHTML=`<div class="brp ${won?'win':''}">${p.avi||"🙂"} ${p.name}${p.you?' (you)':''}</div>`;col.appendChild(m);});
    b.appendChild(col);
  });
  $("trnyStatus").textContent=`Round ${rnd} in progress…`;
}
function finishTrnyModal(champ,ru,cp,rp){
  $("trnyStatus").innerHTML=`<div class="result-banner win" style="display:block;margin-top:8px">👑 Champion: <b>${champ.name}</b> wins ${fmt(cp)}!${ru?`<br>🥈 Runner-up: ${ru.name} wins ${fmt(rp)}`:""}</div>
    <button class="btn btn-primary" style="margin-top:12px" onclick="document.getElementById('modalBg').classList.remove('show')">Close</button>`;
}

export function bind(){
  $("pickHeads").onclick=()=>selectSide("HEADS");
  $("pickTails").onclick=()=>selectSide("TAILS");
  $("randomBtn").onclick=()=>{selectSide(Math.random()<.5?"HEADS":"TAILS");sfxFlip();};
  document.querySelectorAll(".qchip[data-stake]").forEach(c=>c.onclick=()=>$("stakeInput").value=c.dataset.stake);
  $("togPrivate").onclick=()=>{isPrivate=!isPrivate;render();};
  $("togSound").onclick=()=>{S.settings.sound=!S.settings.sound;if(S.settings.sound){audioCtx=null;beep(600,.1);}render();};
  $("togInstant").onclick=()=>{S.settings.instant=!S.settings.instant;render();};
  $("togAuto").onclick=()=>{S.settings.autoRebet=!S.settings.autoRebet;toast(S.settings.autoRebet?`🔁 Auto Bet ON · stops at ${S.settings.autoRebetStop}`:"🔁 Auto Bet OFF");render();};
  document.querySelectorAll("[data-auto-stop]").forEach(b=>b.onclick=()=>setAutoStop(b.dataset.autoStop));
  $("autoStopInput").onchange=e=>setAutoStop(e.target.value);
  $("cupFmt").addEventListener("click",e=>{const b=e.target.closest("[data-fmt]");if(!b)return;cupFmt=b.dataset.fmt;document.querySelectorAll("#cupFmt .qchip").forEach(x=>x.classList.remove("active"));b.classList.add("active");});
  $("postBtn").onclick=()=>postBet(pickedSide,$("stakeInput").value,$("tauntInput").value.trim(),isPrivate);
  $("waitList").addEventListener("click",async e=>{
    const canc=e.target.closest("[data-cancel]"),take=e.target.closest("[data-take]"),takeCatalog=e.target.closest("[data-takecatalog]");
    if(takeCatalog){await takeCatalogBet(takeCatalog.dataset.takecatalog);return;}
    if(canc){const b=S.waiting.find(x=>x.id===canc.dataset.cancel);if(b){refund(b.split);S.waiting=S.waiting.filter(x=>x!==b);toast("Cancelled — refunded.","ok");render();if(b.kind==="catalog")renderGamePanel();}return;}
    if(take&&!busy){
      const bot=S.waiting.find(x=>x.id===take.dataset.take);if(!bot||bot.owner==="you"||(bot.kind||"toss")!=="toss")return;
      const side=bot.side==="HEADS"?"TAILS":"HEADS";
      if(bot.stake>maxStake()){toast(`Stake ${bot.stake} above your level cap ${maxStake()}.`,"err");return;}
      try{checkGuards(bot.stake);}catch(e){toast(e.message,"err");return;}
      let split;try{split=escrow(bot.stake);}catch(e){toast(e.message,"err");return;}
      const pbet={id:"w"+S.gid++,owner:"you",name:playerName(),side,stake:bot.stake,split,kind:"toss"};
      S.waiting=S.waiting.filter(x=>x!==bot);
      selectSide(side);
      await settleFlip(pbet,bot,botByName(bot.owner));
    }
  });
  $("refreshWait").onclick=()=>{seedBotBets();render();toast("Refreshed.","ok");};
  $("x2List").addEventListener("click",async e=>{
    const canc=e.target.closest("[data-cancelx2]"),take=e.target.closest("[data-takex2]");
    if(canc){const ch=S.x2room.find(x=>x.id===canc.dataset.cancelx2);if(ch){refund(ch.split);S.x2room=S.x2room.filter(x=>x!==ch);toast("×2 cancelled — refunded.","ok");render();}return;}
    if(take&&!busy){
      const ch=S.x2room.find(x=>x.id===take.dataset.takex2);if(!ch||ch.owner==="you")return;
      try{checkGuards(ch.stake);}catch(e){toast(e.message,"err");return;}
      let split;try{split=escrow(ch.stake);}catch(e){toast(e.message,"err");return;}
      const side=ch.side==="HEADS"?"TAILS":"HEADS";
      const pbet={owner:"you",name:playerName(),side,stake:ch.stake,split};
      S.x2room=S.x2room.filter(x=>x!==ch);
      await settleFlip(pbet,ch);
    }
  });
  $("openCupBtn").onclick=async()=>{
    const stake=Math.round(+$("cupStake").value);
    try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
    let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
    const me={name:playerName(),avi:playerAviHTML(20),flag:playerFlag(),you:true,split};
    const cup=makeCup(me,stake,cupFmt,{reservedSeat:true,createdBy:"you"});
    S.cups.push(cup);
    addFeed(`⚔️ <b>You</b> opened a ${cupFmt.toUpperCase()} cup @ ${fmt(stake)} — a seat is open`);
    toast("Cup opened — waiting for an opponent…","ok");
    setTimeout(()=>botFillCup(cup),600+Math.random()*500);
    render();
  };
  $("cupList").addEventListener("click",async e=>{
    const canc=e.target.closest("[data-cancelcup]"),join=e.target.closest("[data-joincup]");
    if(canc){
      const c=S.cups.find(x=>x.id===canc.dataset.cancelcup);
      if(c){ (c.entrants[0]||{}).split && refund(c.entrants[0].split); S.cups=S.cups.filter(x=>x!==c); toast("Cup cancelled — refunded.","ok"); render(); }
      return;
    }
    if(join&&!busy){
      const c=S.cups.find(x=>x.id===join.dataset.joincup);
      if(!c||c.entrants.length>=2)return;
      if(c.entrants.some(e=>e.you))return;
      try{checkGuards(c.stake);}catch(e){toast(e.message,"err");return;}
      let split;try{split=escrow(c.stake);}catch(e){toast(e.message,"err");return;}
      const me={name:playerName(),avi:playerAviHTML(20),flag:playerFlag(),you:true,split};
      c.entrants.push(me);
      const maker=c.entrants[0], taker=me;
      const bot=maker.bot||S.bots.find(b=>b.name===maker.name);
      S.cups=S.cups.filter(x=>x!==c);
      await settleCup(maker,taker,bot,c);
    }
  });
  $("tourneyList").addEventListener("click",e=>{
    const j=e.target.closest("[data-jointrny]");if(!j||busy)return;
    const t=S.trnys.find(x=>x.id===j.dataset.jointrny);if(!t||t.status!=="open")return;
    if(t.entrants.some(en=>en.you))return;
    if(t.entrants.length>=t.size){toast("Bracket full.","err");return;}
    const ent=currentVipEntitlements(),entryPaid=Math.max(10,Math.round(t.entry*(1-ent.tournamentDiscount/100))),discountCoins=t.entry-entryPaid;
    try{checkGuards(entryPaid);}catch(e){toast(e.message,"err");return;}
    let split;try{split=escrow(entryPaid);}catch(e){toast(e.message,"err");return;}
    t.entrants.push({name:playerName(),avi:playerAviHTML(20),flag:playerFlag(),you:true,split,entryPaid,discountCoins,vipTier:ent.tier});
    if(discountCoins>0){cfg().house.promoCost+=discountCoins;cfg().taps+=discountCoins;}
    t.reservedSeat=false;fillTournamentBots(t,true);
    addFeed(`🏟️ <b>You</b> joined the ${t.size}-player ${t.format==="bo3"?'Bo3':'single-flip'} tournament for ${fmt(entryPaid)}${discountCoins?` (VIP saved ${discountCoins})`:''}!`);
    if(t.entrants.length===t.size)runTournament(t).catch(err=>console.warn(err));
    else render();
  });
  $("modalBg").addEventListener("click",e=>{if(e.target===$("modalBg"))$("modalBg").classList.remove("show");});
  $("recentGames").addEventListener("click",e=>{
    const b=e.target.closest(".react-btn");if(!b)return;
    const gid=+b.dataset.gid,emoji=b.dataset.e;
    const now=Date.now();if(now-(window._lastReact||0)<5000){toast("Reaction cooldown (5s).","err");return;}
    window._lastReact=now;
    S.reactions[gid]=S.reactions[gid]||{};S.reactions[gid][emoji]=(S.reactions[gid][emoji]||0)+1;render();
  });
  $("shopCats").addEventListener("click",e=>{const b=e.target.closest("[data-shopcat]");if(!b)return;shopCat=b.dataset.shopcat;render();});
  $("shopGrid").addEventListener("click",e=>{
    const buy=e.target.closest("[data-buy]"),eq=e.target.closest("[data-equip]");
    if(buy){
      const item=(COS[shopCat]||[]).find(x=>x.id===buy.dataset.buy);if(!item)return;
      if(item.vipOnly){toast("This cosmetic is unlocked permanently by reaching its VIP tier.","err");return;}
      const vip=vipFor(S.monthWagered),disc=VIP_DISC[vip.tier]||0;
      if(item.vip&&vip.tier<item.vip){toast(`Requires ${VIP_SEED.find(v=>v.tier===item.vip).name} VIP.`,"err");return;}
      const price=Math.round(item.price*(1-disc/100));
      if(S.wallet.main<price){toast("Not enough MAIN.","err");return;}
      S.wallet.main-=price;
      if(shopCat==="emojis"){S.owned.emojis.push(item.id);toast(`Bought ${item.ch} ${item.name}!`,"ok");}
      else{S.owned[shopCat].push(item.id);
        const eqKey={skins:"skin",flags:"flag",avatars:"avatar",frames:"frame",colours:"colour",fx:"fx",themes:"theme",sounds:"sound"}[shopCat];
        if(eqKey)S.equipped[eqKey]=item.id;
        toast(`Bought & equipped ${item.name}!`,"ok");
        if(shopCat==="sounds"){audioCtx=null;sfxWin();}
      }
      cfg().house.shop+=price;cfg().house.netRevenue+=price;cfg().sinks+=price;
      addFeed(`🛍️ <b>You</b> bought ${item.name}`);checkProgressAchievements();
      render();
    }
    if(eq){
      const eqKey={skins:"skin",flags:"flag",avatars:"avatar",frames:"frame",colours:"colour",fx:"fx",themes:"theme",sounds:"sound"}[shopCat];
      if(eqKey){S.equipped[eqKey]=eq.dataset.equip;toast("Equipped.","ok");render();}
    }
  });
  document.addEventListener("click",e=>{
    const q=e.target.closest("[data-quest]");if(!q)return;
    const id=q.dataset.quest,quest=QUESTS_SEED.find(x=>x.id===id);
    if(S.quests[id]>=quest.target&&!S.quests.claimed[id]){
      const reward=quest.reward*subscriptionQuestMult();S.quests.claimed[id]=true;S.wallet.bonus+=reward;cfg().taps+=reward;
      toast(`🎯 Claimed +${reward} → bonus${reward>quest.reward?' (subscription 2×)':''}`,"ok");render();
    }
  });
  $("claimRb").onclick=()=>{if(!S.accruedRakeback){toast("Nothing to claim.","err");return;}S.wallet.rakeback+=S.accruedRakeback;toast(`💸 Claimed ${fmt(S.accruedRakeback)} rakeback.`,"ok");S.accruedRakeback=0;render();};
  $("vfyBtn").onclick=async()=>{
    const sv=$("vSeed").value.trim(),mh=$("vMaker").value.trim(),th=$("vTaker").value.trim(),gid=$("vGid").value.trim();
    if(!sv||!mh||!th||!gid){toast("Fill all fields.","err");return;}
    try{
      const commit=await shaHex(sv);
      const combined=(BigInt("0x"+mh)+BigInt("0x"+th)+BigInt("0x"+commit)).toString(16);
      const fh=await shaHex(combined+":"+gid);
      const fb=parseInt(fh.slice(0,2),16),res=fb%2===0?"HEADS":"TAILS",jp=fb===0;
      $("vfyEmpty").style.display="none";const o=$("vfyOut");o.classList.add("show");
      o.innerHTML=`<div class="ph">Verification — game #${gid}</div>
        <div><span class="pl">commitment:</span> <span class="ok">${commit.slice(0,28)}… ✓</span></div>
        <div><span class="pl">combined:</span> ${combined.slice(0,28)}…</div>
        <div><span class="pl">finalHash:</span> <span class="pv">${fh.slice(0,36)}…</span></div>
        <div><span class="pl">firstByte:</span> <b>0x${fb.toString(16).padStart(2,"0")}</b> (${fb})</div>
        <div><span class="pl">result:</span> <b style="color:var(--gold)">${res}</b></div>
        <div><span class="pl">jackpot (00):</span> ${jp?'<span style="color:var(--gold)">🎰 YES</span>':'no'}</div>
        <div class="ok">✓ Recomputed locally</div>`;
    }catch(e){toast("Invalid input.","err");}
  };
  $("vfyLast").onclick=()=>{if(!lastProof){toast("Play a game first.","err");return;}const p=lastProof;$("vSeed").value=p.serverSeed;$("vMaker").value=p.makerHash;$("vTaker").value=p.takerHash;$("vGid").value=p.gameId;toast("Loaded last game.","ok");};
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{animateFlip,autoMatchBotTossBet,botAcceptX2,botByName,botFillCup,botMatchPlayer,checkGuards,checkProgressAchievements,createTournament,escrow,fillTournamentBots,finishCupModal,finishTrnyModal,makeCup,matchWithBot,postBet,postX2,refund,runTournament,seedBotBets,seedBotCatalogBets,selectSide,setAutoStop,settleCup,settleFlip,showCupModal,showResult,showResultActions,showTrnyModal,unlockAch,updateCupModal,updateTrnyModal});

export {animateFlip,autoMatchBotTossBet,botAcceptX2,botByName,botFillCup,botMatchPlayer,checkGuards,checkProgressAchievements,createTournament,escrow,fillTournamentBots,finishCupModal,finishTrnyModal,makeCup,matchWithBot,postBet,postX2,refund,runTournament,seedBotBets,seedBotCatalogBets,selectSide,setAutoStop,settleCup,settleFlip,showCupModal,showResult,showResultActions,showTrnyModal,unlockAch,updateCupModal,updateTrnyModal};
