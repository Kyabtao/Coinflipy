/* FlipArena player module — sync */
import "../shared/runtime.js";
import {add,allocate,coin,creditBot,creditWallet,debitBot,mul,numOr,pct,sub} from "../shared/money.js";
import {SAVE_KEY,SIM_LEADER_KEY,SIM_TAB_ID,TAB_KEY,botLiveChannel} from "./core.js";
import {COS,HUB,applyVipUnlocks,currentVipEntitlements} from "./bots.js";
import {randHex,shaHex} from "./crypto.js";
import {autoMatchBotTossBet,botByName,botFillCup,checkGuards,checkProgressAchievements,createTournament,escrow,fillTournamentBots,makeCup,refund,runTournament,seedBotBets,seedBotCatalogBets,unlockAch} from "./games.js";
import {$,EXT_ARCADE,addFeed,applyPendingDepositLimits,awardXp,checkRealityReminder,confettiFx,effectiveRakeback,filterSkillBots,fmt,pushHistory,recordAnalyticsSample,recordEngagement,recordPlayerMetrics,recordSessionPoint,renderNewGamesHub,toast,vipFor} from "./helpers.js";
import {checkVipMonthReset} from "./misc.js";
import {playerAviHTML,playerName,render,renderTick} from "./render.js";
import {cfg,initializeBotStartingWallet,load,save} from "./state.js";

function heartbeat(){localStorage.setItem(TAB_KEY,Date.now());}
function claimBotEngineLeadership(){const now=Date.now();let lock={};try{lock=JSON.parse(localStorage.getItem(SIM_LEADER_KEY)||'{}');}catch(e){}if(lock.id===SIM_TAB_ID||!lock.id||now-(lock.t||0)>6000){localStorage.setItem(SIM_LEADER_KEY,JSON.stringify({id:SIM_TAB_ID,t:now,role:'player'}));try{return JSON.parse(localStorage.getItem(SIM_LEADER_KEY)||'{}').id===SIM_TAB_ID;}catch(e){return true;}}return false;}
async function runCoordinatedBotTick(source='player-interval'){if(!claimBotEngineLeadership())return false;const activated=ensureAllBotsFirstTopups('Required first top-up before '+source);if(activated)save();await backgroundTick(source);return true;}
async function backgroundTick(source='player-interval'){
  if(busy||tickRunning)return;
  tickRunning=true;
  try{
    recordSessionPoint();checkRealityReminder();applyPendingDepositLimits();recordAnalyticsSample();
    S.waiting.forEach(b=>{b.wait=(b.wait||0)+1;});
    S.cups.forEach(c=>c.wait++);
    // bot-vs-bot flips — use the SAME fair merged-hash RNG as real games so
    // jackpots can actually trigger here (byte 00, 1/256 when pool armed).
    // S.turbo runs many flips per tick for the stress test (100,000+ games).
    // 1x = steady 3 flips/tick (normal); higher = stress-test multipliers
    growBotRoster();botSocialActivity();await botArcadeActivity();
    const flipsThisTick=(S.turbo&&S.turbo>1)?S.turbo:8;
    for(let fi=0; fi<flipsThisTick; fi++){
      if(true){
        const a=S.bots[Math.floor(Math.random()*S.bots.length)];
        let b=S.bots[Math.floor(Math.random()*S.bots.length)];while(b===a)b=S.bots[Math.floor(Math.random()*S.bots.length)];
        if(a&&b&&a.balance>=50&&b.balance>=50){
          const stake=[50,100,100,250,250,500,500][Math.floor(Math.random()*7)];
          if(a.balance>=stake&&b.balance>=stake){
            // suppress feed spam in high turbo
            window._suppressFeed = flipsThisTick>5 && fi%Math.max(1,Math.floor(flipsThisTick/4))!==0;
            await settleBotFlip(a,b,stake);
            if(fi>0&&fi%100===0)await new Promise(r=>setTimeout(r,0));
            window._suppressFeed=false;
          }
        }
      }
    }
    // Catalog activity now runs alongside Coin Toss activity: direct bot matches,
    // bot-posted waiting bets, player manual takes, and delayed bot auto-matches.
    const catalogRuns=(S.turbo||1)>1?Math.min(30,Math.ceil((S.turbo||1)/40)):8;
    for(let i=0;i<catalogRuns;i++)await botPlayGame();
    if(Math.random()<0.7)botTransferCoins();
    const topupTrigger=Math.max(0,+(cfg().botTopupThreshold??500));S.bots.filter(b=>b.balance<topupTrigger).slice(0,20).forEach(b=>topUpBot(b,"Background liquidity"));
    if(cfg().features.bots!==false&&Math.random()<(+(cfg().wdTickChance??0.35)))processBotWithdrawals();
    seedBotBets();seedBotCatalogBets(12);
    const queuedCatalog=S.waiting.find(b=>b.owner==="you"&&b.kind==="catalog");
    if(cfg().features.bots&&queuedCatalog)await botJoinCatalogBet(queuedCatalog.id);
    const botTossQueue=S.waiting.filter(b=>b.owner!=="you"&&(b.kind||"toss")==="toss"&&(b.wait||0)>=1).slice(0,4);
    for(const open of botTossQueue)await autoMatchBotTossBet(open);
    const botCatalogQueue=S.waiting.filter(b=>b.owner!=="you"&&b.kind==="catalog"&&(b.wait||0)>=1).slice(0,8);
    for(const open of botCatalogQueue)await autoMatchBotCatalogBet(open.id);
    // Series Cups have no real-player requirement: player cups get bot
    // opponents, while bot-created cups may be joined by the player or another bot.
    if(cfg().features.bots){
      const yourCup=S.cups.find(c=>c.createdBy==="you"&&c.entrants.length<2);
      if(yourCup)setTimeout(()=>botFillCup(yourCup),100+Math.random()*180);

      const botCup=S.cups.find(c=>c.createdBy==="bot"&&c.entrants.length<2);
      if(botCup&&botCup.wait>=1)await botFillCup(botCup);

      const openBotCups=S.cups.filter(c=>c.createdBy==="bot").length;
      if(openBotCups<3&&Math.random()<0.45){
        const opener=S.bots[Math.floor(Math.random()*S.bots.length)];
        if(opener&&opener.balance>=100&&!S.cups.some(c=>c.entrants[0]&&c.entrants[0].name===opener.name)){
          const stake=[50,100,250,500][Math.floor(Math.random()*4)];
          if(opener.balance>=stake){
            opener.balance-=stake;
            S.cups.push(makeCup(
              {name:opener.name,avi:opener.avi,flag:opener.flag,bot:opener},
              stake,["bo3","bo5","bo7","adv"][Math.floor(Math.random()*4)],
              {reservedSeat:false,createdBy:"bot"}));
            if(!window._suppressFeed)addFeed(`⚔️ <b>${opener.name}</b> opened a public bot Series Cup`);
          }
        }
      }
    }
    // Tournaments have no real-player requirement. A short public join window
    // is followed by complete bot fill and automatic bracket play.
    if(cfg().features.bots){
      const openTrny=S.trnys.find(t=>t.status==="open");
      if(openTrny){
        fillTournamentBots(openTrny,false);
        if(Date.now()-(openTrny.createdAt||0)>4500)fillTournamentBots(openTrny,true);
        if(openTrny.entrants.length===openTrny.size)await runTournament(openTrny);
      }else if(Math.random()<0.45){
        const size=[4,8,16][Math.floor(Math.random()*3)];
        const entry=[50,100,250][Math.floor(Math.random()*3)];
        const format=Math.random()<0.35?"bo3":"single";
        const t=createTournament(size,entry,cfg().trnyRakePct,"auto",format);
        if(t.entrants.length>=size-1){
          S.trnys.push(t);
          if(!window._suppressFeed)addFeed(`🏟️ A ${size}-player ${format==="bo3"?'Bo3 Series':'single-flip'} tournament opened — bots will fill every seat (${fmt(entry)} entry)`);
        }
      }
    }
  }catch(err){
    console.warn("backgroundTick error (recovered):",err);
  }finally{
    tickRunning=false;lastBotTickAt=Date.now();
    // Targeted refresh: background ticks only repaint chrome + the active tab,
    // so hidden panels (and any input the player is typing into) stay untouched.
    try{renderTick();save();}catch(e){console.warn("render error:",e);}
    if(botLiveChannel)botLiveChannel.postMessage({type:'bot-tick',id:SIM_TAB_ID,t:lastBotTickAt,source,games:S.global.totalGames,bots:S.bots.length,queue:S.waiting.length});
  }
}
async function settleBotFlip(a,b,stake){
  // Both stakes enter escrow before the winner is paid; without this debit,
  // every background match would mint a full payout into bot balances.
  a.balance-=stake;b.balance-=stake;
  const pot=stake*2,fee=Math.round(pot*cfg().feePct/100),gameId=S.gid++;
  const makerHash=await shaHex(randHex()+":"+gameId),takerHash=await shaHex(randHex()+":"+gameId),commit=await shaHex(randHex());
  const combined=(BigInt("0x"+makerHash)+BigInt("0x"+takerHash)+BigInt("0x"+commit)).toString(16);
  const finalHash=await shaHex(combined+":"+gameId);
  const fb=parseInt(finalHash.slice(0,2),16);
  const result=fb%2===0?"HEADS":"TAILS";
  const armed=S.jackpot>=cfg().jpArm;
  const jpHit=fb===0&&armed;
  const jpc=Math.max(0,Math.min(fee-1,Math.max(cfg().jpFloor,Math.round(fee*cfg().jpFundPct/100))));
  S.jackpot+=jpc;
  let payout=pot-fee,jpPayout=0;
  if(jpHit){jpPayout=Math.round(S.jackpot*cfg().jpPayPct/100);S.jackpot-=jpPayout;S.global.jackpots++;cfg().reviewFlags.unshift({t:Date.now(),game:gameId,type:"jackpot",amount:jpPayout});if(cfg().reviewFlags.length>80)cfg().reviewFlags.length=80;}
  const aWins=result==="HEADS";
  const w=aWins?a:b,l=aWins?b:a;
  w.balance+=payout+jpPayout;w.wins++;w.streak++;w.games=(w.games||0)+1;
  w.bestStreak=Math.max(w.bestStreak||0,w.streak);
  w.net+=(payout-stake)+jpPayout;w.biggestWin=Math.max(w.biggestWin||0,(payout-stake)+jpPayout);
  l.streak=0;l.losses=(l.losses||0)+1;l.games=(l.games||0)+1;l.net-=stake;
  if(jpHit){w.jackpots=(w.jackpots||0)+1;}
  S.global.totalGames++;if(result==="HEADS")S.global.heads++;else S.global.tails++;
  cfg().house.fees+=fee-jpc;cfg().house.netRevenue+=fee-jpc;cfg().sinks+=fee;
  if(!window._suppressFeed){
    if(jpHit){
      addFeed(`🎰 <b>${w.name}</b> ${w.flag} hit the JACKPOT on a bot flip — +${fmt(jpPayout)}! <b>${result}</b> @ ${fmt(stake)}`,true);
    }else if(Math.random()<0.22){
      addFeed(`⚡ <b>${w.name}</b> ${w.flag||""} beat <b>${l.name}</b> — ${result} @ ${fmt(stake)}`);
    }
  }
  // auto top-up any bot that ran low (demo liquidity — NOT house revenue)
  [a,b].forEach(bot=>topUpBot(bot,"Post-game liquidity"));
  // occasional bot shop purchase (drives shop sink; item recorded on profile)
  if(Math.random()<0.12)botBuyShop(w);
}
function botBuyShop(bot){
  if(!bot||bot.frozen)return;
  const catalog=[];for(const cat of ['skins','avatars','frames','colours','fx','themes','sounds','emojis'])for(const item of COS[cat]||[])if(item.price>0&&!item.vipOnly&&item.price<=Math.min(1200,bot.balance))catalog.push({cat,item});
  const choices=catalog.filter(x=>!(bot.shop||[]).includes(x.item.id)),pool=choices.length?choices:catalog,pick=pool[Math.floor(Math.random()*Math.max(1,pool.length))];if(!pick)return;
  const {cat,item}=pick;bot.balance-=item.price;bot.shop=bot.shop||[];if(!bot.shop.includes(item.id))bot.shop.push(item.id);if(cat==='skins')bot.skin=item.id;
  cfg().house.shop+=item.price;cfg().house.netRevenue+=item.price;cfg().sinks+=item.price;
  if(Math.random()<0.75)addFeed(`🛍️ <b>${bot.name}</b> bought ${item.name} from ${cat}`);
}
function botTransferCoins(){
  const senders=S.bots.filter(b=>!b.frozen&&ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=600);if(senders.length<2)return;
  const from=senders[Math.floor(Math.random()*senders.length)];let to=S.bots[Math.floor(Math.random()*S.bots.length)];while(to===from)to=S.bots[Math.floor(Math.random()*S.bots.length)];
  const amount=[50,100,250,500][Math.floor(Math.random()*4)];if(from.balance<amount)return;
  const fee=Math.max(1,Math.round(amount*cfg().transferFee/100)),received=amount-fee;
  from.balance-=amount;to.balance+=received;cfg().house.xfFees=(cfg().house.xfFees||0)+fee;cfg().house.netRevenue+=fee;cfg().sinks+=fee;
  S.botTransfers=S.botTransfers||[];S.botTransfers.unshift({t:Date.now(),from:from.name,to:to.name,amount,fee,received});if(S.botTransfers.length>100)S.botTransfers.length=100;
  if(!window._suppressFeed)addFeed(`💸 <b>${from.name}</b> transferred ${fmt(received)} to <b>${to.name}</b> · fee ${fee}`);
}
function accountBotStartingBonus(bot){if(!bot)return 0;initializeBotStartingWallet(bot);if(bot.startingBonusAccounted)return 0;const amount=1000;bot.bonusBalance=amount;bot.startingBonus=amount;bot.startingBonusAccounted=true;bot.startingBonusAt=Date.now();cfg().taps+=amount;cfg().house.promoCost+=amount;return amount;}
function withdrawAtFor(bot){
  const lo=Math.max(1000,+(cfg().wdMin??3000)),hi=Math.max(lo,+(cfg().wdMax??5000));
  if(bot&&bot.withdrawAt&&bot.withdrawAt>=lo&&bot.withdrawAt<=hi)return bot.withdrawAt;
  return lo+Math.floor(Math.random()*(hi-lo+1));
}
function requestBotWithdraw(bot){
  if(!bot||!bot.firstTopupDone)return null;
  const lo=Math.max(1000,+(cfg().wdMin??3000)),hi=Math.max(lo,+(cfg().wdMax??5000));
  if(!bot.withdrawAt)bot.withdrawAt=lo+Math.floor(Math.random()*(hi-lo+1));
  if((bot.balance||0)<bot.withdrawAt)return null;
  if(bot.wdCool&&Date.now()<bot.wdCool)return null;
  const keep=400+Math.floor(Math.random()*800);
  let amount=Math.floor((bot.balance-keep)/50)*50;
  if(amount<500)return null;
  bot.balance-=amount;
  cfg().house.withdrawals=(cfg().house.withdrawals||0)+amount;
  cfg().sinks=(cfg().sinks||0)+amount;
  if(!S.withdrawals)S.withdrawals={count:0,amount:0,log:[]};
  S.withdrawals.count=(S.withdrawals.count||0)+1;
  S.withdrawals.amount=(S.withdrawals.amount||0)+amount;
  bot.withdraws=(bot.withdraws||0)+1;
  bot.withdrawTotal=(bot.withdrawTotal||0)+amount;
  bot.withdrawAt=lo+Math.floor(Math.random()*(hi-lo+1));
  bot.wdCool=Date.now()+20000;
  S.withdrawals.log=S.withdrawals.log||[];
  S.withdrawals.log.unshift({t:Date.now(),botId:bot.id||bot.name,name:bot.name,amount,keep:bot.balance,trigger:bot.withdrawAt,status:"paid"});
  if(S.withdrawals.log.length>200)S.withdrawals.log.length=200;
  if(!window._suppressFeed)addFeed(`🏦 <b>${bot.name}</b> withdrew ${fmt(amount)} MAIN · revenue −${fmt(amount)}`);
  return {amount};
}
function processBotWithdrawals(){
  let n=0,coins=0;
  (S.bots||[]).forEach(b=>{const r=requestBotWithdraw(b);if(r){n++;coins+=r.amount;}});
  return {n,coins};
}
function topUpBot(bot,reason="low balance",forceFirst=false){
  const threshold=Math.max(0,+(cfg().botTopupThreshold??500));if(!bot)return 0;initializeBotStartingWallet(bot);const first=!bot.firstTopupDone;if(!first&&!forceFirst&&bot.balance>=threshold)return 0;if(first)accountBotStartingBonus(bot);
  const count=bot.topupCount||0,seed=[...bot.name].reduce((a,c)=>a+c.charCodeAt(0),0);
  let base=400+((seed+count*5+Math.floor(Math.random()*7))%13)*100;if(base===bot.lastTopupBase)base=base>=1600?400:base+100;bot.lastTopupBase=base; // 400–1,600 and never repeats consecutively for a bot
  const bonus=first&&cfg().features.topupPromo!==false?Math.round(base*.5):0;
  bot.balance+=base;bot.bonusBalance=(bot.bonusBalance||0)+bonus;bot.topupCount=count+1;bot.topupTotal=(bot.topupTotal||0)+base+bonus;bot.firstTopupDone=true;if(first)bot.firstTopupAt=Date.now();
  cfg().taps+=base+bonus;if(bonus)cfg().house.promoCost+=bonus;cfg().house.botDeposits=(cfg().house.botDeposits||0)+base;
  S.botTopups=S.botTopups||[];S.botTopups.unshift({t:Date.now(),bot:bot.name,base,bonus,startingBonus:first?(bot.startingBonus||1000):0,total:base+bonus,walletCredit:base+bonus+(first?(bot.startingBonus||1000):0),reason,count:bot.topupCount,requiredFirst:first,prePlay:first});if(S.botTopups.length>100)S.botTopups.length=100;
  if(!window._suppressFeed)addFeed(`💰 <b>${bot.name}</b> ${first?'started with 1,000 BONUS and completed required first top-up':'topped up'} ${fmt(base)} MAIN${bonus?` + ${fmt(bonus)} first-top-up promo`:''}`);
  return base+bonus;
}
function ensureBotFirstTopup(bot,reason="Required first top-up before play"){if(!bot)return false;if(!bot.firstTopupDone)topUpBot(bot,reason,true);return !!bot.firstTopupDone;}
function ensureAllBotsFirstTopups(reason="Required first top-up before activation"){const pending=S.bots.filter(b=>!b.firstTopupDone);if(!pending.length)return 0;const old=window._suppressFeed;window._suppressFeed=true;pending.forEach(b=>ensureBotFirstTopup(b,reason));window._suppressFeed=old;addFeed(`💳 <b>${pending.length} bot${pending.length===1?'':'s'}</b> started at 0 MAIN + 1,000 BONUS and completed required first top-up before play`);return pending.length;}
function readyBotPool(pool,reason="Required first top-up before matchmaking"){return (pool||[]).filter(b=>!b.frozen&&ensureBotFirstTopup(b,reason));}
function botActivityLog(kind,row){
  S.botActivity=S.botActivity||{socialActions:0,arcadePlays:0,createdBots:0,socialLog:[],arcadeLog:[],lastCreatedAt:0};const key=kind==='social'?'socialLog':'arcadeLog';S.botActivity[key]=S.botActivity[key]||[];S.botActivity[key].unshift({t:Date.now(),...row});if(S.botActivity[key].length>120)S.botActivity[key].length=120;
}
function botSocialActivity(){
  if(!cfg().features.bots||S.bots.length<2)return;S.social.friendRequests=S.social.friendRequests||[];S.social.botFriendships=S.social.botFriendships||[];
  const first=S.bots[Math.floor(Math.random()*S.bots.length)],second=S.bots[Math.floor(Math.random()*S.bots.length)];if(!first||!second||first===second)return;const z=Math.random();let row;
  if(z<.24){const pair=[first.name,second.name].sort(),key=pair.join('|');if(!S.social.botFriendships.some(x=>x.key===key)){S.social.botFriendships.unshift({t:Date.now(),key,a:pair[0],b:pair[1]});if(S.social.botFriendships.length>100)S.social.botFriendships.length=100;}row={area:'Friend network',icon:'🤝',detail:`${pair[0]} and ${pair[1]} connected`};}
  else if(z<.48){const phrases=['Anyone up for a quick match?','GG! That was close.','Arcade run starting now 🎮','Looking for a Series Cup rival.','The Catalog queue is moving fast!','Just unlocked a new shop item ✨','Good luck everyone!'],text=phrases[Math.floor(Math.random()*phrases.length)];if(!S.social.blocked.includes(first.name)){S.social.chat.push({t:Date.now(),from:first.name,text,bot:true});if(S.social.chat.length>160)S.social.chat.splice(0,S.social.chat.length-160);}row={area:'Lobby chat',icon:'💬',detail:`${first.name}: ${text}`};}
  else if(z<.66){if(!S.social.friends.includes(first.name)&&!S.social.friendRequests.includes(first.name))S.social.friendRequests.unshift(first.name);S.social.friendRequests=S.social.friendRequests.slice(0,12);row={area:'Friend request',icon:'🙋',detail:`${first.name} sent You a friend request`};}
  else if(z<.79)row={area:'Private rooms',icon:'🔒',detail:`${first.name} opened a ${Math.random()<.5?'Coin Toss':'Catalog'} room for ${second.name}`};
  else if(z<.90)row={area:'Clans',icon:'🛡️',detail:`${first.name}'s clan challenged ${second.name}'s team`};
  else row={area:'Gifting',icon:'🎁',detail:`${first.name} gifted a cosmetic to ${second.name}`};
  S.botActivity.socialActions=(S.botActivity.socialActions||0)+1;botActivityLog('social',row);
}
async function botArcadeActivity(){
  if(!cfg().features.bots||!S.bots.length)return;const runs=Math.max(0,Math.min(6,+(cfg().botArcadePerTick??2)));
  for(let run=0;run<runs;run++){
    const arcadeModes=['Lucky Wheel','Scratch Cards','Dice Roll','Weekly Raffle','Multiplier Ladder P2P','War Card Game','Crash','Hi-Lo','Mines',...Object.values(EXT_ARCADE).map(x=>x.title)],mode=arcadeModes[Math.floor(Math.random()*arcadeModes.length)],stake=mode==='Scratch Cards'?[25,100,250][Math.floor(Math.random()*3)]:mode==='Daily Trivia'?25:50;
    if(mode==='Weekly Raffle'){const bot=S.bots[Math.floor(Math.random()*S.bots.length)],tickets=1+Math.floor(Math.random()*5),cost=tickets*10;if(!bot||bot.balance<cost){if(bot)topUpBot(bot,'Arcade liquidity');continue;}bot.balance-=cost;S.featureGames.raffle.botTickets+=tickets;bot.arcadeGames=(bot.arcadeGames||0)+1;botActivityLog('arcade',{bot:bot.name,game:mode,detail:`Bought ${tickets} ticket${tickets>1?'s':''}`,delta:-cost});S.botActivity.arcadePlays++;continue;}
    if(mode==='Multiplier Ladder P2P'||mode==='War Card Game'){
      const pool=S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=stake);if(pool.length<2)continue;const x=pool[Math.floor(Math.random()*pool.length)],others=pool.filter(b=>b!==x),y=others[Math.floor(Math.random()*others.length)];x.balance-=stake;y.balance-=stake;const pot=stake*2,fee=Math.round(pot*cfg().feePct/100),payout=pot-fee,w=Math.random()<.5?x:y,l=w===x?y:x;w.balance+=payout;w.wins=(w.wins||0)+1;l.losses=(l.losses||0)+1;w.net=(w.net||0)+payout-stake;l.net=(l.net||0)-stake;w.games=(w.games||0)+1;l.games=(l.games||0)+1;w.arcadeGames=(w.arcadeGames||0)+1;l.arcadeGames=(l.arcadeGames||0)+1;cfg().house.catalogFees=(cfg().house.catalogFees||0)+fee;cfg().house.netRevenue+=fee;cfg().sinks+=fee;S.global.totalGames++;botActivityLog('arcade',{bot:w.name,game:mode,detail:`Beat ${l.name} · fee ${fee}`,delta:payout-stake});S.botActivity.arcadePlays++;topUpBot(l,'Arcade liquidity');continue;
    }
    const eligible=S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=stake),bot=eligible[Math.floor(Math.random()*Math.max(1,eligible.length))];if(!bot)continue;bot.balance-=stake;let payout=0,detail='';
    if(mode==='Lucky Wheel'){payout=[0,25,50,100,150,250][Math.floor(Math.random()*6)];detail=payout?`Landed a ${payout}-coin prize`:'Landed an empty slot';}
    else if(mode==='Scratch Cards'){payout=[0,0,stake*2,stake*5][Math.floor(Math.random()*4)];detail=payout?`Matched symbols for ${payout}`:'No matching set';}
    else if(mode==='Dice Roll'){const win=Math.random()<.42;payout=win?Math.round(stake*1.8):0;detail=win?'Range prediction won':'Range prediction missed';}
    else{const table=[0,0,Math.round(stake*.5),stake,Math.round(stake*1.5),stake*3,stake*5],ix=Math.floor(Math.random()*table.length);payout=table[ix];detail=`Completed ${mode} · simulated published-table payout ${payout}`;}
    bot.balance+=payout;bot.net=(bot.net||0)+payout-stake;bot.games=(bot.games||0)+1;bot.arcadeGames=(bot.arcadeGames||0)+1;cfg().house.shop+=stake;cfg().house.netRevenue+=stake;cfg().sinks+=stake;if(payout){cfg().taps+=payout;cfg().house.promoCost+=payout;}botActivityLog('arcade',{bot:bot.name,game:mode,detail,delta:payout-stake});S.botActivity.arcadePlays++;topUpBot(bot,'Arcade liquidity');
  }
}
function createAutoBot(reason='Automatic network growth'){
  const max=Math.max(99,Math.min(1000,+(cfg().botGrowthMax??250)));if(S.bots.length>=max)return null;const seq=S.bots.length+1,adjs=['Swift','Lucky','Nova','Royal','Pixel','Turbo','Cosmic','Golden','Mystic','Prime'],nouns=['Flipper','Rival','Player','Ace','Challenger','Duelist','Ranger','Captain','Knight','Star'];let name=`${adjs[seq%adjs.length]} ${nouns[(seq*3)%nouns.length]} ${seq}`;while(S.bots.some(b=>b.name===name))name+=String.fromCharCode(65+Math.floor(Math.random()*26));const places=[['India','🇮🇳'],['Brazil','🇧🇷'],['USA','🇺🇸'],['UK','🇬🇧'],['Japan','🇯🇵'],['Germany','🇩🇪'],['UAE','🇦🇪'],['Canada','🇨🇦'],['Australia','🇦🇺'],['Singapore','🇸🇬']],place=places[Math.floor(Math.random()*places.length)],avatars=['🤖','😎','🧑','👩','🥷','🧙','🦸','👽','🦊','🐼'],skins=['classic','silver','neon','arctic','ember','ruby','emerald','sapphire','obsidian','jade'];const bot={name,avi:avatars[Math.floor(Math.random()*avatars.length)],flag:place[1],balance:0,bonusBalance:1000,walletVersion:2,startingBonus:1000,startingBonusAccounted:false,startingBonusAt:0,level:2+Math.floor(Math.random()*24),country:place[0],title:'Network Newcomer',about:'Automatically joined the growing FlipArena demo network.',skin:skins[Math.floor(Math.random()*skins.length)],joined:0,wins:0,losses:0,net:0,streak:0,bestStreak:0,biggestWin:0,jackpots:0,games:0,arcadeGames:0,shop:[],title2:'',firstTopupDone:false,topupCount:0,topupTotal:0,autoCreated:true,createdAt:Date.now()};S.bots.push(bot);ensureBotFirstTopup(bot,'Required first top-up on bot creation');S.botActivity.createdBots=(S.botActivity.createdBots||0)+1;S.botActivity.lastCreatedAt=Date.now();botActivityLog('social',{area:'Player network',icon:'🌐',detail:`${bot.name} ${bot.flag} joined automatically · ${S.bots.length+1} total players`});if(!window._suppressFeed)addFeed(`🌐 <b>${bot.name}</b> joined the network automatically · ${S.bots.length+1} players online`);return bot;
}
function growBotRoster(){
  if(!cfg().features.bots||cfg().features.botGrowth===false)return;const interval=Math.max(5,Math.min(3600,+(cfg().botGrowthIntervalSec??15)))*1000;if(Date.now()-(S.botActivity.lastCreatedAt||0)<interval)return;const batch=Math.max(1,Math.min(10,+(cfg().botGrowthBatch??1)));for(let n=0;n<batch;n++)if(!createAutoBot())break;
}
const GAMES=[
 {id:"overunder",name:"⚖️ Over / Under",edge:"byte half",type:"options",options:["HIGH","LOW"],desc:"Pick HIGH (128–255) or LOW (0–127). One fair byte is revealed; the side containing that byte wins the pot. If both sides pick the same value it splits."},
 {id:"speed",name:"💨 Speed Round",edge:"5 flips",type:"options",options:["HEADS","TAILS"],desc:"Pick HEADS or TAILS. Five fair flips are shown; the side with the majority (3+) wins. Catching the majority is pure 50/50."},
 {id:"tug",name:"🪢 Tug of War",edge:"race to 3",type:"options",options:["LEFT","RIGHT"],desc:"Pick LEFT or RIGHT. Each fair flip pulls the rope one step. HEADS pulls LEFT, TAILS pulls RIGHT; the first side to reach three steps wins."},
 {id:"evenodd",name:"➕ Even / Odd Sum",edge:"sum parity",type:"options",options:["EVEN","ODD"],desc:"Pick EVEN or ODD. Two fair bytes are added; an even sum wins for EVEN and an odd sum wins for ODD. Matching parity takes the pot."},
 {id:"closest",name:"🎯 Closest Number",edge:"0–255",type:"number",min:0,max:255,desc:"Predict any byte 0–255. A fair byte is revealed; the pick with the smallest absolute distance wins. Equal distance splits; the result byte is shown."},
 {id:"luckybattle",name:"🎲 Lucky Number Battle",edge:"0–255",type:"number",min:0,max:255,desc:"Predict a byte 0–255. Hitting the revealed byte exactly wins instantly; otherwise the closest pick wins and equal distance carries the pot."},
 {id:"sumpredict",name:"📈 Sum Prediction",edge:"0–510",type:"number",min:0,max:510,desc:"Predict the sum of two fair bytes (0–510). The two bytes are revealed and summed; the closest prediction to that total wins, and equal distance splits."},
 {id:"higherbyte",name:"🔢 Higher Byte",edge:"no pick",type:"none",desc:"No pick is needed — each entrant receives an independent fair byte. The higher byte wins; equal bytes split the pot."},
 {id:"patternrace",name:"🔗 Pattern Race",edge:"first pattern",type:"pattern3",desc:"Pick a 3-flip pattern (HHH–TTT). Fair flips build a sequence; the first pattern to appear wins. Neither completing in the window carries the pot."},
 {id:"parlayduel",name:"🧩 Parlay Duel",edge:"most correct",type:"pattern3",desc:"Pick a 3-flip prediction. Three fair flips resolve; the prediction with the most correctly placed symbols wins. An exact match count carries."},
 {id:"prediction",name:"🎯 Prediction Streak",edge:"5 flips",type:"pattern5",desc:"Predict five flips (e.g. HHHHH or HTHTH). Five fair flips resolve; the most correct predictions win, and an equal count splits."},
 {id:"blind",name:"👁️ Blind Pick",edge:"hidden picks",type:"options",options:["HEADS","TAILS"],allowSame:true,desc:"True hidden-pick round. Both sides pick a side, then one fair flip decides. Identical picks split if they match the flip and carry if they don't; otherwise the side that matches the flip wins."},
 {id:"rangewar",name:"🔢 Range War",edge:"zones",type:"zones",desc:"Claim one of four quarters of 0–255. A fair byte landing inside your quarter wins, inside the bot's quarter loses, and landing between claimed quarters carries the pot."},
 {id:"bullseye",name:"🎯 Bullseye",edge:"wedges",type:"zones",desc:"Claim a target wedge; the bot claims a different wedge. A fair byte inside your wedge wins, inside the bot's wedge loses, and an unclaimed byte carries."},
 {id:"chain",name:"🔗 Chain Reaction",edge:"10 rounds",type:"options",options:["HEADS","TAILS"],desc:"Pick a side; entrants then call alternating flips for up to ten rounds. The first wrong caller loses. Both surviving all ten calls splits the pot."},
 {id:"ladder",name:"💨 Elimination Ladder",edge:"race to 3",type:"options",options:["HEADS","TAILS"],desc:"Pick a side. Each fair flip climbs your ladder one rung toward a three-rung finish; the first to reach the top with their side wins."},
 {id:"mirrored",name:"🪞 Mirrored Coins",edge:"2 coins",type:"options",options:["HEADS","TAILS"],desc:"Two fair coins flip. Matching results carry the pot; different results decide — your coin matching your pick wins."},
 {id:"rps",code:"CAT18",name:"✊ Rock Paper Scissors Duel",edge:"hidden picks",type:"options",options:["ROCK","PAPER","SCISSORS"],allowSame:true,desc:"Hidden simultaneous choices. ROCK beats SCISSORS, PAPER beats ROCK, SCISSORS beats PAPER; matching choices split the post-fee pot. Both picks are hidden until the match settles so neither side can react to the other."},
 {id:"closest21",code:"CAT19",name:"🃏 Closest to 21",edge:"2 cards",type:"none",desc:"Each entrant is dealt two proof-derived cards (1–11). The hand closest to 21 without exceeding wins; equal totals or double-bust split the pot."},
 {id:"triplecoin",code:"CAT20",name:"🪙 Triple Coin Majority",edge:"3 flips",type:"options",options:["HEADS","TAILS"],desc:"Pick a side. Three fair flips resolve; the majority side (2+) wins the pot."},
 {id:"sequencebuilder",code:"CAT21",name:"🧬 Sequence Builder",edge:"pattern race",type:"options",options:["HH","HT","TH","TT"],desc:"Choose a two-symbol starter distinct from the bot's. The first starter to appear in the proof sequence wins; if neither appears the pot carries."},
 {id:"dicesumduel",code:"CAT22",name:"🎲 Dice Sum Duel",edge:"2 dice each",type:"none",desc:"Each entrant receives two proof-derived dice. The higher total sum wins; equal sums split the pot."},
 {id:"colourspectrum",code:"CAT23",name:"🌈 Colour Spectrum Duel",edge:"byte bands",type:"zones",desc:"Claim a non-overlapping colour band. A fair byte inside either claimed band wins for that side; an unclaimed band carries the pot."},
 {id:"primecomposite",code:"CAT24",name:"🔢 Prime vs Composite",edge:"2–251",type:"options",options:["PRIME","COMPOSITE"],desc:"Pick PRIME or COMPOSITE. A proof-derived integer 2–251 is classified; the correct side wins the pot."},
 {id:"medianbattle",code:"CAT25",name:"📐 Median Number Battle",edge:"0–255",type:"number",min:0,max:255,desc:"You and the bot each pick a distinct number; a proof number joins them. The pick at or nearest the median wins; equal distance splits. Identical guesses split."},
 {id:"streaksurvivor",code:"CAT26",name:"🔥 Streak Survivor",edge:"first streak 4",type:"options",options:["HEADS","TAILS"],desc:"Opposite sides race through fair flips. The first side to produce four consecutive results wins; neither reaching it in the window carries the pot."},
 {id:"territory",code:"CAT27",name:"🗺️ Territory Capture",edge:"9 captures",type:"zones",desc:"Claim a non-overlapping map sector. Nine fair bytes capture sectors; the higher claimed count wins, equal counts split, and zero captures carry."},
 {id:"modulo4",code:"CAT28",name:"➗ Modulo Four Duel",edge:"remainder",type:"options",options:["0","1","2","3"],desc:"Choose a remainder 0–3 distinct from the bot's. A fair byte mod 4 decides; the matched remainder wins and an unclaimed remainder carries. Identical choices split."},
 {id:"pokerhigh",code:"CAT29",name:"♠️ Poker High Duel",edge:"5 cards",type:"none",desc:"Each entrant is dealt five proof-derived cards. Standard poker categories and deterministic kickers decide; exact ties split the pot."},
 {id:"threedicepoker",code:"CAT30",name:"🎲 Three Dice Poker",edge:"3 dice each",type:"none",desc:"Each entrant receives three proof dice. Triple beats pair, then higher total, then higher die; exact category/total ties split."},
 {id:"lastdigit",code:"CAT31",name:"🔟 Last Digit Duel",edge:"0–9",type:"options",options:["0","1","2","3","4","5","6","7","8","9"],desc:"Choose a digit 0–9 distinct from the bot's. The last digit of a proof number wins if claimed; an unclaimed digit carries. Identical digits split."},
 {id:"binaryduel",code:"CAT32",name:"🧬 Binary Code Duel",edge:"3 bits",type:"pattern3",desc:"Choose a three-bit H/T code distinct from the bot's. The code with the lowest Hamming distance to the proof code wins; equal distance splits."},
 {id:"coinbalance",code:"CAT33",name:"⚖️ Coin Balance Battle",edge:"10 flips",type:"number",min:2,max:8,desc:"Predict the number of HEADS in ten fair flips. The closest distinct prediction wins; equal distance splits the pot."}
];
const CATALOG_GROUPS={
 'Side Picks':['overunder','speed','tug','evenodd','blind','chain','ladder','mirrored','rps','triplecoin','primecomposite','streaksurvivor'],
 'Numbers & Dice':['closest','luckybattle','sumpredict','higherbyte','closest21','dicesumduel','medianbattle','modulo4','threedicepoker','lastdigit','coinbalance'],
 'Patterns & Territory':['patternrace','parlayduel','prediction','rangewar','bullseye','sequencebuilder','colourspectrum','territory','binaryduel'],
 'Cards':['pokerhigh']
};
const CATALOG_NAV={search:'',group:'',favorites:false};
function catalogGroup(id){return Object.keys(CATALOG_GROUPS).find(k=>CATALOG_GROUPS[k].includes(id))||'Other';}
const PATTERNS3=["HHH","HHT","HTH","HTT","THH","THT","TTH","TTT"];
const PATTERNS5=["HHHHH","HTHTH","HHTTH","HTTHT","THHTT","THTHT","TTHHT","TTTTT"];
const ZONES=["0-63","64-127","128-191","192-255"];
let gameState={catalogPicks:{},catalogResults:{},
 dice:{over:false,target:50},lucky:{pick:5},wheel:{},crash:{running:false,crashedAt:0,mult:1,bet:0,split:null,timer:null,cashed:false,autoCash:2},
 hilo:{current:null,next:null,pick:null,streak:0,bet:0,split:null,active:false},mines:{grid:[],mines:3,picked:0,bet:0,split:null,active:false,busted:false}};
async function gameOutcome(label,extra){
  const client=randHex(8),server=randHex(32),commit=await shaHex(server);
  const h=await shaHex(client+":"+label+":"+(extra||"")+":"+commit);
  return {client,server,commit,h,byte:parseInt(h.slice(0,2),16),jpByte:parseInt(h.slice(2,4),16),
    result:parseInt(h.slice(4,6),16),result2:parseInt(h.slice(6,8),16)};
}
/* House edge is Admin-configurable (Game parameters → house edge). The demo
   default of 2% matches the previously hard-coded 0.98 return-to-player. */
function houseEdge(){const e=Math.min(25,Math.max(0,numOr(cfg().edgePct,2)));return sub(1,e/100);}
function settleGameWin(gameId,stake,payout,label,oppName,resultText,proof,deltaOverride){
  const fee=0; // games use edge baked into multipliers; no extra fee
  stake=coin(stake);
  // Admin-configured payout cap (0 = unlimited) bounds any single arcade payout.
  const payCap=Math.round(cfg().payoutCap||0);
  let gross=coin(payout);if(payCap>0&&gross>payCap)gross=payCap;
  const won=gross>stake;
  const delta=won?sub(gross,stake):-stake;
  if(won){creditWallet({main:gross},"Payout · "+label);}
  S.stats.games++;S.global.totalGames++;S.monthWagered+=stake;awardXp(stake);
  S.stats.net+=delta;sessionNet+=delta;
  if(won){S.stats.wins++;S.stats.bestWin=Math.max(S.stats.bestWin,payout-stake);}else S.stats.losses++;
  const rec={id:proof.gameId,result:won?"WIN":"LOSE",stake,fee:0,oppName,oppFlag:"🎲",winner:won?"you":"house",delta,verified:true,game:label,proof,resultText};
  S.games.unshift(rec);if(S.games.length>200)S.games.pop();
  addFeed(`🎲 <b>You</b> ${won?"won":"lost"} ${label}: ${resultText} · ${won?"+":""}${fmt(delta)}`);
  return {won,delta,rec};
}
function catalogChoices(g){
  if(g.type==="pattern3")return PATTERNS3;
  if(g.type==="pattern5")return PATTERNS5;
  if(g.type==="zones")return ZONES;
  return g.options||[];
}
function catalogDefaultPick(g){
  if(g.type==="number")return Math.round((g.min+g.max)/2);
  if(g.type==="none")return "AUTO";
  return catalogChoices(g)[0];
}
function catalogWaitingHTML(g){
  const bets=S.waiting.filter(b=>b.kind==="catalog"&&b.catalogGame===g.id);
  if(!bets.length)return '<div class="empty" style="padding:12px">No open bets for this game.</div>';
  return bets.map(b=>`<div class="wait-item"><span class="wi-avi">${b.owner==="you"?playerAviHTML(22):(b.avi||"🤖")}</span>
    <div class="wi-main"><div class="wi-name">${b.name} ${b.owner==="you"?'<span style="color:var(--gold)">(you)</span>':'<span class="ttl">BOT BET</span>'} ${b.priority?'<span class="ttl">VIP PRIORITY</span>':''}</div><div class="wi-meta">${b.owner==="you"?`pick ${b.pick}`:'pick 🎭 hidden'} · ${fmt(b.stake)} coins · ${b.wait||0}s · ${b.owner==="you"?'auto-match pending':'open for manual take or auto-match'}</div></div>
    ${b.owner==="you"?`<button class="btn btn-sm btn-danger" data-catalog-cancel="${b.id}">Cancel</button>`:`<button class="btn btn-sm btn-primary" data-catalog-take="${b.id}">Take bet</button>`}</div>`).join("");
}
function catalogGameHTML(g){
  const pick=gameState.catalogPicks[g.id]??catalogDefaultPick(g);gameState.catalogPicks[g.id]=pick;
  const choices=catalogChoices(g),last=gameState.catalogResults[g.id],carry=(S.gameCarries&&S.gameCarries[g.id])||0,recent=(S.games||[]).filter(x=>x.gameId===g.id).slice(0,8);
  let picker="";
  if(g.type==="number")picker=`<label>Your prediction (${g.min}–${g.max})</label><input type="number" class="stake-input sm" id="catalogPick" value="${pick}" min="${g.min}" max="${g.max}" style="width:150px"/>`;
  else if(g.type==="none")picker='<div class="catalog-note">No pick required — each entrant receives an independent fair byte.</div>';
  else picker=`<div class="pick-grid">${choices.map(x=>`<button class="pick-btn ${String(pick)===String(x)?'active':''}" data-cpick="${x}" style="width:auto;min-width:58px;padding:0 10px">${x}</button>`).join("")}</div>`;
  const result=last?`<div class="result-banner ${last.kind==='WIN'?'win':last.kind==='LOSE'?'lose':''}" style="display:block;margin-top:14px"><b>${last.kind}</b> · ${last.detail}${last.kind==='WAITING'?'':last.kind==='MATCHING'?`<br><small>vs ${last.botName} ${last.botFlag||''} · picks locked — revealing on settlement…</small>`:`<br><small>vs ${last.botName} ${last.botFlag||''} · your pick ${last.pick} · bot pick ${last.botPick} · delta ${last.delta>=0?'+':''}${fmt(last.delta)}</small>`}</div>
    ${last.proof?`<div class="proof show"><span class="ok">✓ merged-hash verified</span> · game #${last.proof.gameId}<br><span class="pl">finalHash:</span> <span class="pv">${last.proof.finalHash.slice(0,36)}…</span><br><span class="pl">first bytes:</span> ${last.proof.finalHash.slice(0,16)}</div>`:""}`:"";
  return `<h3>${g.name} <span class="muted" style="margin-left:auto;font-weight:400">catalog P2P · ${cfg().feePct}% pot fee</span></h3>
    <p class="muted">${g.desc}</p>
    ${carry?`<div class="catalog-carry" style="margin:10px 0">🔥 Carry pool: ${fmt(carry)} coins added to the next settled ${g.name.replace(/^\S+\s/,"")} match</div>`:""}
    <div style="margin-top:14px">${picker}</div>
    <div class="game-row" style="justify-content:center;margin-top:14px">
      <input type="number" class="stake-input sm" id="catalogStake" value="50" min="10" style="width:120px"/>
      <button class="btn btn-primary" id="catalogPlay" ${busy?'disabled':''}>📨 Post to waiting room</button>
    </div>
    <div class="section-title" style="margin-top:16px">⏳ ${g.name} Waiting Room</div>
    <div class="wait-list">${catalogWaitingHTML(g)}</div>${result}<div class="section-title">🕘 Your ${g.name} history</div>${recent.map(x=>`<div class="hist-row"><span class="hist-res ${String(x.result).toLowerCase()}">${x.result}</span><div><b>vs ${x.oppName}</b><div class="hist-meta">${new Date(x.t).toLocaleString()} · ${x.resultText}</div></div><span class="hist-amt ${x.delta>=0?'win':'lose'}">${x.delta>=0?'+':''}${fmt(x.delta)}</span></div>`).join('')||'<div class="empty">No completed matches for this game yet.</div>'}`;
}
function bindCatalogPanel(g){
  document.querySelectorAll("[data-cpick]").forEach(b=>b.onclick=()=>{gameState.catalogPicks[g.id]=b.dataset.cpick;renderGamePanel();});
  document.querySelectorAll("[data-catalog-cancel]").forEach(b=>b.onclick=()=>cancelCatalogBet(b.dataset.catalogCancel));
  document.querySelectorAll("[data-catalog-take]").forEach(b=>b.onclick=()=>takeCatalogBet(b.dataset.catalogTake,g));
  const play=$("catalogPlay");if(play)play.onclick=()=>postCatalogBet(g);
}
function cancelCatalogBet(id){
  const bet=S.waiting.find(b=>b.id===id&&b.kind==="catalog"&&b.owner==="you");if(!bet)return;
  refund(bet.split);S.waiting=S.waiting.filter(b=>b!==bet);gameState.catalogResults[bet.catalogGame]={kind:"CANCELLED",detail:"Open bet cancelled and fully refunded."};
  toast("Catalog bet cancelled — refunded.","ok");render();renderGamePanel();
}
async function takeCatalogBet(id,gameHint=null){
  if(busy)return;
  const open=S.waiting.find(b=>b.id===id&&b.kind==="catalog"&&b.owner!=="you");if(!open)return;
  const g=gameHint||GAMES.find(x=>x.id===open.catalogGame);if(!g)return;
  let pick=gameState.catalogPicks[g.id]??catalogDefaultPick(g);
  const numberInput=activeGame===g.id?$("catalogPick"):null;if(g.type==="number"&&numberInput)pick=Math.max(g.min,Math.min(g.max,Math.round(+numberInput.value)));
  if(!g.allowSame&&g.type!=="none"&&String(pick)===String(open.pick)){
    const choices=catalogChoices(g);
    if(g.type==="number")pick=(+open.pick<g.max)?+open.pick+1:+open.pick-1;
    else pick=choices.find(x=>String(x)!==String(open.pick));
    gameState.catalogPicks[g.id]=pick;
    toast(`Your pick was adjusted to ${pick} to make a valid manual match.`,"ok");
  }
  try{checkGuards(open.stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(open.stake);}catch(e){toast(e.message,"err");return;}
  const bot=botByName(open.owner);if(!bot){refund(split);S.waiting=S.waiting.filter(b=>b!==open);toast("That bot is no longer available.","err");return;}
  S.waiting=S.waiting.filter(b=>b!==open);const playerBet={id:"cg"+S.gid++,owner:"you",name:playerName(),kind:"catalog",catalogGame:g.id,gameName:g.name,pick:String(pick),stake:open.stake,split,wait:0};
  gameState.catalogResults[g.id]={kind:"MATCHING",detail:`You manually took ${bot.name}'s open bet. Resolving…`,botName:bot.name,botFlag:bot.flag,pick:String(pick),botPick:String(open.pick),delta:0};
  addFeed(`🤝 <b>You</b> manually took <b>${bot.name}</b>'s ${g.name} bet @ ${fmt(open.stake)}`);busy=true;render();if(activeGame===g.id)renderGamePanel();
  await settleCatalogBet(g,playerBet,bot,String(open.pick));
}
function catalogRandomPick(g){
  if(g.type==="none")return "AUTO";
  if(g.type==="number")return g.min+Math.floor(Math.random()*(g.max-g.min+1));
  const choices=catalogChoices(g);return choices[Math.floor(Math.random()*choices.length)];
}
function catalogBotPick(g,playerPick){
  if(g.type==="none")return "AUTO";
  if(g.type==="number"){
    let n;do{n=g.min+Math.floor(Math.random()*(g.max-g.min+1));}while(n===+playerPick);return n;
  }
  const choices=catalogChoices(g),pool=g.allowSame?choices:choices.filter(x=>String(x)!==String(playerPick));
  return pool[Math.floor(Math.random()*pool.length)];
}
async function catalogFairOutcome(g,stake,pickA,pickB){
  const gameId=S.gid++,makerSeed=randHex(),takerSeed=randHex(),serverSeed=randHex();
  const makerHash=await shaHex(`${makerSeed}:${gameId}:${stake}:${g.id}:${pickA}`);
  const takerHash=await shaHex(`${takerSeed}:${gameId}:${stake}:${g.id}:${pickB}`);
  const commit=await shaHex(serverSeed);
  const combined=(BigInt("0x"+makerHash)+BigInt("0x"+takerHash)+BigInt("0x"+commit)).toString(16);
  const finalHash=await shaHex(combined+":"+gameId),bytes=[];
  for(let i=0;i<finalHash.length;i+=2)bytes.push(parseInt(finalHash.slice(i,i+2),16));
  return {bytes,proof:{serverSeed,makerSeed,takerSeed,makerHash,takerHash,commit,combined,finalHash,firstByte:bytes[0],gameId}};
}
function zoneBounds(z){const [a,b]=String(z).split("-").map(Number);return [a,b];}
function isPrimeNumber(n){if(n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;}
function pokerScore(hand){
  const ranks=hand.map(c=>c.r).sort((a,b)=>b-a),suits=hand.map(c=>c.s),counts={};ranks.forEach(r=>counts[r]=(counts[r]||0)+1);
  const groups=Object.entries(counts).map(([r,n])=>({r:+r,n})).sort((a,b)=>b.n-a.n||b.r-a.r),flush=new Set(suits).size===1,uniq=[...new Set(ranks)].sort((a,b)=>b-a);
  if(uniq[0]===14)uniq.push(1);let straightHigh=0;for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){straightHigh=uniq[i];break;}
  let cat=0,tie=[];if(flush&&straightHigh){cat=8;tie=[straightHigh];}else if(groups[0].n===4){cat=7;tie=[groups[0].r,groups[1].r];}else if(groups[0].n===3&&groups[1]?.n===2){cat=6;tie=[groups[0].r,groups[1].r];}else if(flush){cat=5;tie=ranks;}else if(straightHigh){cat=4;tie=[straightHigh];}else if(groups[0].n===3){cat=3;tie=[groups[0].r,...groups.filter(x=>x.n===1).map(x=>x.r).sort((a,b)=>b-a)];}else if(groups[0].n===2&&groups[1]?.n===2){cat=2;const ps=groups.filter(x=>x.n===2).map(x=>x.r).sort((a,b)=>b-a);tie=[...ps,groups.find(x=>x.n===1).r];}else if(groups[0].n===2){cat=1;tie=[groups[0].r,...groups.filter(x=>x.n===1).map(x=>x.r).sort((a,b)=>b-a)];}else tie=ranks;
  return {cat,tie,name:['High card','Pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'][cat]};
}
function comparePoker(a,b){if(a.cat!==b.cat)return a.cat>b.cat?1:-1;for(let i=0;i<Math.max(a.tie.length,b.tie.length);i++){const x=a.tie[i]||0,y=b.tie[i]||0;if(x!==y)return x>y?1:-1;}return 0;}
function resolveCatalogGame(g,pickA,pickB,bytes){
  const side=n=>n%2===0?"HEADS":"TAILS",win=s=>String(pickA)===String(s)?"player":"bot";
  // Fairness guard: game formulas are written for DISTINCT sides. If a hidden-take ever
  // yields an identical pick (which the old waiting-room leak allowed a player to force), no
  // side should be able to win on that edge — settle it as a fair split instead.
  if(g.type!=="none"&&!g.allowSame&&String(pickA)===String(pickB))return {winner:"split",detail:`both picked ${pickA} — tie split`};
  if(g.id==="overunder"){const r=bytes[0],s=r>=128?"HIGH":"LOW";return {winner:win(s),detail:`byte ${r} → ${s}`};}
  if(g.id==="speed"){const f=bytes.slice(0,5).map(side),h=f.filter(x=>x==="HEADS").length,s=h>2?"HEADS":"TAILS";return {winner:win(s),detail:`${f.map(x=>x[0]).join(" ")} · ${h}-${5-h} ${s}`};}
  if(g.id==="tug"){let pos=0,n=0;for(;n<bytes.length&&Math.abs(pos)<3;n++)pos+=side(bytes[n])==="HEADS"?-1:1;const s=pos<=-3?"LEFT":pos>=3?"RIGHT":(pos<0?"LEFT":"RIGHT");return {winner:win(s),detail:`rope ${s} after ${n} pulls`};}
  if(g.id==="evenodd"){const sum=bytes[0]+bytes[1],s=sum%2===0?"EVEN":"ODD";return {winner:win(s),detail:`${bytes[0]} + ${bytes[1]} = ${sum} (${s})`};}
  if(g.id==="closest"||g.id==="luckybattle"){const r=bytes[0],da=Math.abs(+pickA-r),db=Math.abs(+pickB-r);if(da===db)return {winner:g.id==="luckybattle"?"carry":"split",detail:`result ${r} · equal distance ${da}`};return {winner:da<db?"player":"bot",detail:`result ${r} · distances ${da} vs ${db}${(+pickA===r||+pickB===r)?' · EXACT MATCH':''}`};}
  if(g.id==="sumpredict"){const r=bytes[0]+bytes[1],da=Math.abs(+pickA-r),db=Math.abs(+pickB-r);return {winner:da===db?"split":da<db?"player":"bot",detail:`sum ${bytes[0]} + ${bytes[1]} = ${r} · distances ${da}/${db}`};}
  if(g.id==="higherbyte"){const a=bytes[0],b=bytes[1];return {winner:a===b?"split":a>b?"player":"bot",detail:`your byte ${a} · bot byte ${b}`};}
  if(g.id==="patternrace"){let seq="";for(let i=0;i<bytes.length;i++){seq+=side(bytes[i])[0];if(seq.endsWith(pickA))return {winner:"player",detail:`${pickA} appeared first in ${seq}`};if(seq.endsWith(pickB))return {winner:"bot",detail:`${pickB} appeared first in ${seq}`};}return {winner:"carry",detail:"no pattern completed in the proof window"};}
  if(g.id==="parlayduel"){const seq=bytes.slice(0,3).map(x=>side(x)[0]).join(""),a=[0,1,2].filter(i=>pickA[i]===seq[i]).length,b=[0,1,2].filter(i=>pickB[i]===seq[i]).length;return {winner:a===b?"carry":a>b?"player":"bot",detail:`flips ${seq} · matches ${a}-${b}`};}
  if(g.id==="prediction"){const seq=bytes.slice(0,5).map(x=>side(x)[0]).join(""),a=[0,1,2,3,4].filter(i=>pickA[i]===seq[i]).length,b=[0,1,2,3,4].filter(i=>pickB[i]===seq[i]).length;return {winner:a===b?"split":a>b?"player":"bot",detail:`flips ${seq} · correct ${a}-${b}`};}
  if(g.id==="blind"){const flip=side(bytes[0]);if(pickA===pickB)return {winner:pickA===flip?"split":"carry",detail:`both picked ${pickA}; flip ${flip}`};return {winner:pickA===flip?"player":"bot",detail:`secret picks revealed · flip ${flip}`};}
  if(g.id==="rangewar"||g.id==="bullseye"){const r=bytes[0],[a1,a2]=zoneBounds(pickA),[b1,b2]=zoneBounds(pickB);return {winner:r>=a1&&r<=a2?"player":r>=b1&&r<=b2?"bot":"carry",detail:`result ${r} · zones ${pickA} vs ${pickB}`};}
  if(g.id==="chain"){for(let i=0;i<10;i++){const caller=i%2===0?"player":"bot",call=caller==="player"?pickA:pickB,flip=side(bytes[i]);if(call!==flip)return {winner:caller==="player"?"bot":"player",detail:`round ${i+1}: ${caller} called ${call}, flip was ${flip}`};}return {winner:"split",detail:"both survived 10 calls"};}
  if(g.id==="ladder"){let h=0,t=0;for(let i=0;i<bytes.length;i++){side(bytes[i])==="HEADS"?h++:t++;if(h>=3||t>=3){const s=h>=3?"HEADS":"TAILS";return {winner:win(s),detail:`${s} reached rung 3 after ${i+1} flips (${h}-${t})`};}}}
  if(g.id==="mirrored"){const a=side(bytes[0]),b=side(bytes[1]);if(a===b)return {winner:"carry",detail:`mirrored coins both showed ${a}`};return {winner:a===pickA?"player":"bot",detail:`your coin ${a} · bot coin ${b}`};}
  if(g.id==="rps"){if(pickA===pickB)return {winner:"split",detail:`both revealed ${pickA}`};const beats={ROCK:"SCISSORS",PAPER:"ROCK",SCISSORS:"PAPER"};return {winner:beats[pickA]===pickB?"player":"bot",detail:`${pickA} vs ${pickB}`};}
  if(g.id==="closest21"){const value=x=>x%10+1,a=[value(bytes[0]),value(bytes[1])],b=[value(bytes[2]),value(bytes[3])],ta=a[0]+a[1],tb=b[0]+b[1];if((ta>21&&tb>21)||ta===tb)return {winner:"split",detail:`cards ${a.join('+')}=${ta} vs ${b.join('+')}=${tb} · split`};if(ta>21)return {winner:"bot",detail:`you ${ta} BUST · bot ${tb}`};if(tb>21)return {winner:"player",detail:`you ${ta} · bot ${tb} BUST`};return {winner:ta>tb?"player":"bot",detail:`cards ${a.join('+')}=${ta} vs ${b.join('+')}=${tb}`};}
  if(g.id==="triplecoin"){const flips=bytes.slice(0,3).map(side),heads=flips.filter(x=>x==="HEADS").length,result=heads>=2?"HEADS":"TAILS";return {winner:win(result),detail:`${flips.map(x=>x[0]).join(' ')} · majority ${result}`};}
  if(g.id==="sequencebuilder"){const seq=bytes.map(x=>side(x)[0]).join('');const ia=seq.indexOf(pickA),ib=seq.indexOf(pickB);if(ia<0&&ib<0)return {winner:"carry",detail:`neither ${pickA} nor ${pickB} appeared`};if(ia===ib)return {winner:"split",detail:`both starters completed together in ${seq.slice(0,12)}`};return {winner:ib<0||ia>=0&&ia<ib?"player":"bot",detail:`sequence ${seq.slice(0,16)} · first positions ${ia<0?'—':ia+1}/${ib<0?'—':ib+1}`};}
  if(g.id==="dicesumduel"){const dice=bytes.slice(0,4).map(x=>x%6+1),ta=dice[0]+dice[1],tb=dice[2]+dice[3];return {winner:ta===tb?"split":ta>tb?"player":"bot",detail:`your dice ${dice[0]}+${dice[1]}=${ta} · bot ${dice[2]}+${dice[3]}=${tb}`};}
  if(g.id==="colourspectrum"){const r=bytes[0],[a1,a2]=zoneBounds(pickA),[b1,b2]=zoneBounds(pickB);return {winner:r>=a1&&r<=a2?"player":r>=b1&&r<=b2?"bot":"carry",detail:`spectrum byte ${r} · bands ${pickA}/${pickB}`};}
  if(g.id==="primecomposite"){const n=2+bytes[0]%250,result=isPrimeNumber(n)?"PRIME":"COMPOSITE";return {winner:win(result),detail:`number ${n} is ${result}`};}
  if(g.id==="medianbattle"){const pa=+pickA,pb=+pickB,r=bytes[0],median=[pa,pb,r].sort((x,y)=>x-y)[1];if(median===pa)return {winner:"player",detail:`values ${pa}, ${pb}, ${r} · median ${median}`};if(median===pb)return {winner:"bot",detail:`values ${pa}, ${pb}, ${r} · median ${median}`};const da=Math.abs(pa-r),db=Math.abs(pb-r);return {winner:da===db?"split":da<db?"player":"bot",detail:`proof ${r} is median · distances ${da}/${db}`};}
  if(g.id==="streaksurvivor"){let last="",run=0;for(let n=0;n<bytes.length;n++){const current=side(bytes[n]);if(current===last)run++;else{last=current;run=1;}if(run===4)return {winner:win(current),detail:`${current} reached a 4-streak on flip ${n+1}`};}return {winner:"carry",detail:"no four-result streak in proof window"};}
  if(g.id==="territory"){const [a1,a2]=zoneBounds(pickA),[b1,b2]=zoneBounds(pickB),draws=bytes.slice(0,9);let ca=0,cb=0;draws.forEach(r=>{if(r>=a1&&r<=a2)ca++;else if(r>=b1&&r<=b2)cb++;});return {winner:ca===cb?(ca?"split":"carry"):ca>cb?"player":"bot",detail:`9 captures · your sector ${ca} · bot sector ${cb}`};}
  if(g.id==="modulo4"){const result=String(bytes[0]%4);return {winner:result===pickA?"player":result===pickB?"bot":"carry",detail:`byte ${bytes[0]} mod 4 = ${result}`};}
  if(g.id==="pokerhigh"){const deck=Array.from({length:52},(_,i)=>({r:i%13+2,s:Math.floor(i/13)})),hands=[[],[]];let bi=0;for(let h=0;h<2;h++)for(let c=0;c<5;c++){const ix=bytes[bi++%bytes.length]%deck.length;hands[h].push(deck.splice(ix,1)[0]);}const sa=pokerScore(hands[0]),sb=pokerScore(hands[1]),cmp=comparePoker(sa,sb),show=h=>h.map(c=>`${c.r<=10?c.r:['J','Q','K','A'][c.r-11]}${['♠','♥','♦','♣'][c.s]}`).join(' ');return {winner:cmp===0?"split":cmp>0?"player":"bot",detail:`you ${sa.name} (${show(hands[0])}) · bot ${sb.name} (${show(hands[1])})`};}
  if(g.id==="threedicepoker"){const d=bytes.slice(0,6).map(x=>x%6+1),rank=a=>{const c={};a.forEach(x=>c[x]=(c[x]||0)+1);const max=Math.max(...Object.values(c));return {cat:max===3?2:max===2?1:0,total:a.reduce((n,x)=>n+x,0),high:Math.max(...a)};},a=rank(d.slice(0,3)),b=rank(d.slice(3,6)),cmp=a.cat!==b.cat?a.cat-b.cat:a.total!==b.total?a.total-b.total:a.high-b.high;return {winner:cmp===0?'split':cmp>0?'player':'bot',detail:`your dice ${d.slice(0,3).join('-')} · bot ${d.slice(3).join('-')} · categories ${a.cat}/${b.cat} · totals ${a.total}/${b.total}`};}
  if(g.id==="lastdigit"){const n=(bytes[0]*256+bytes[1])%10000,digit=String(n%10);return {winner:digit===pickA?'player':digit===pickB?'bot':'carry',detail:`proof number ${n} · last digit ${digit}`};}
  if(g.id==="binaryduel"){const code=bytes.slice(0,3).map(x=>side(x)[0]).join(''),dist=p=>[0,1,2].filter(i=>p[i]!==code[i]).length,da=dist(pickA),db=dist(pickB);return {winner:da===db?'split':da<db?'player':'bot',detail:`proof code ${code} · Hamming distance ${da}/${db}`};}
  if(g.id==="coinbalance"){const flips=bytes.slice(0,10).map(side),heads=flips.filter(x=>x==='HEADS').length,da=Math.abs(+pickA-heads),db=Math.abs(+pickB-heads);return {winner:da===db?'split':da<db?'player':'bot',detail:`${flips.map(x=>x[0]).join('')} · ${heads} HEADS · distances ${da}/${db}`};}
  return {winner:"split",detail:"fair split"};
}
function logCatalogMatch(entry){S.catalogLog=S.catalogLog||[];S.catalogLog.unshift(entry);if(S.catalogLog.length>100)S.catalogLog.length=100;}
function postCatalogBet(g){
  if(busy)return;
  if(S.waiting.some(b=>b.owner==="you"&&b.kind==="catalog"&&b.catalogGame===g.id)){toast("You already have an open bet for this game.","err");return;}
  let pick=gameState.catalogPicks[g.id]??catalogDefaultPick(g);
  if(g.type==="number")pick=Math.max(g.min,Math.min(g.max,Math.round(+$("catalogPick").value)));
  const stake=Math.round(+$("catalogStake").value);
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  const ent=currentVipEntitlements(),bet={id:"cg"+S.gid++,owner:"you",name:playerName(),kind:"catalog",catalogGame:g.id,gameName:g.name,pick:String(pick),side:String(pick),stake,split,wait:0,createdAt:Date.now(),vipTier:ent.tier,priority:ent.queuePriority};
  S.waiting.push(bet);gameState.catalogResults[g.id]={kind:"WAITING",detail:`${g.name} bet posted. A bot will join automatically.`,pick:String(pick),delta:0};
  addFeed(`📨 <b>You</b> posted ${g.name} · pick ${pick} @ ${fmt(stake)} to the waiting room`);toast("Bet posted — waiting for a bot…","ok");render();renderGamePanel();
  if(cfg().features.bots)setTimeout(()=>botJoinCatalogBet(bet.id),ent.queuePriority?120+Math.random()*180:350+Math.random()*650);
}
async function botJoinCatalogBet(id){
  const bet=S.waiting.find(b=>b.id===id&&b.kind==="catalog"&&b.owner==="you");if(!bet)return;
  if(busy){setTimeout(()=>botJoinCatalogBet(id),300);return;}
  const g=GAMES.find(x=>x.id===bet.catalogGame);if(!g){refund(bet.split);S.waiting=S.waiting.filter(b=>b!==bet);return;}
  const botPool=filterSkillBots(S.bots.filter(b=>ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=bet.stake));if(!botPool.length)return;
  const bot=botPool[Math.floor(Math.random()*botPool.length)],botPick=catalogBotPick(g,bet.pick);bot.balance-=bet.stake;
  S.waiting=S.waiting.filter(b=>b!==bet);gameState.catalogResults[g.id]={kind:"MATCHING",detail:`${bot.name} joined from the waiting room. Resolving…`,botName:bot.name,botFlag:bot.flag,pick:bet.pick,botPick,delta:0};
  addFeed(`⚡ <b>${bot.name}</b> ${bot.flag} joined your ${g.name} bet @ ${fmt(bet.stake)}`);busy=true;render();renderGamePanel();
  await settleCatalogBet(g,bet,bot,botPick);
}
async function settleCatalogBet(g,bet,bot,botPick){
  const stake=bet.stake,pick=bet.pick;
  try{
    await new Promise(r=>setTimeout(r,S.settings.instant?80:420));
    const fair=await catalogFairOutcome(g,stake,pick,botPick),out=resolveCatalogGame(g,String(pick),String(botPick),fair.bytes);
    const pot=stake*2,fee=Math.round(pot*cfg().feePct/100),jpContrib=Math.max(0,Math.min(fee-1,Math.max(cfg().jpFloor,Math.round(fee*cfg().jpFundPct/100)))),vip=vipFor(S.monthWagered),rbEarned=Math.round((fee/2)*effectiveRakeback(vip.rakeback)/100);
    S.accruedRakeback+=rbEarned;S.jackpot+=jpContrib;cfg().house.catalogFees=(cfg().house.catalogFees||0)+fee-jpContrib;cfg().house.netRevenue+=fee-jpContrib;cfg().sinks+=fee;
    S.gameCarries=S.gameCarries||{};const carry=S.gameCarries[g.id]||0,available=pot-fee+carry;
    let delta=-stake,kind="LOSE",playerPaid=0,botPaid=0;
    if(out.winner==="player"){playerPaid=available;S.wallet.main+=playerPaid;bot.net=(bot.net||0)-stake;bot.losses=(bot.losses||0)+1;bot.streak=0;delta=playerPaid-stake;kind="WIN";S.gameCarries[g.id]=0;}
    else if(out.winner==="bot"){botPaid=available;bot.balance+=botPaid;bot.net=(bot.net||0)+botPaid-stake;bot.wins=(bot.wins||0)+1;bot.streak=(bot.streak||0)+1;bot.bestStreak=Math.max(bot.bestStreak||0,bot.streak);kind="LOSE";S.gameCarries[g.id]=0;}
    else if(out.winner==="split"){playerPaid=Math.floor(available/2);botPaid=available-playerPaid;S.wallet.main+=playerPaid;bot.balance+=botPaid;bot.net=(bot.net||0)+botPaid-stake;delta=playerPaid-stake;kind="DRAW";S.gameCarries[g.id]=0;}
    else{S.gameCarries[g.id]=carry+pot-fee;bot.net=(bot.net||0)-stake;kind="CARRY";}
    bot.games=(bot.games||0)+1;S.stats.games++;S.global.totalGames++;S.monthWagered+=stake;awardXp(stake);S.stats.net+=delta;sessionNet+=delta;S.quests.settle=Math.min(3,(S.quests.settle||0)+1);S.catalogPlayed=S.catalogPlayed||{};S.catalogPlayed[g.id]=true;
    if(kind==="WIN"){S.stats.wins++;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);S.stats.bestWin=Math.max(S.stats.bestWin,delta);S.quests.win=Math.min(1,(S.quests.win||0)+1);}
    else if(kind==="LOSE"){S.stats.losses++;S.streak=0;}recordEngagement(g.id,kind==="WIN");
    if(fair.bytes[0]%2===0)S.global.heads++;else S.global.tails++;
    checkProgressAchievements();
    const detail=out.detail+(carry&&out.winner!=="carry"?` · included ${fmt(carry)} carry`:out.winner==="carry"?` · pool now ${fmt(S.gameCarries[g.id])}`:"")+(rbEarned?` · +${rbEarned} VIP rakeback pending`:"");
    const rec={id:fair.proof.gameId,t:Date.now(),result:kind,stake,fee,payout:playerPaid,oppName:bot.name,oppFlag:bot.flag,winner:kind==="WIN"?"you":kind==="LOSE"?"opp":"draw",delta,verified:true,game:g.name,gameId:g.id,playerPick:String(pick),botPick:String(botPick),proof:fair.proof,resultText:detail};
    S.games.unshift(rec);if(S.games.length>200)S.games.pop();recordPlayerMetrics({stake,payout:playerPaid,fee,source:'catalog',result:kind});if(bet.source==='room'){S.stats.roomGames=(S.stats.roomGames||0)+1;pushHistory('roomGames',{title:bet.roomName||'Private Room',detail:`${g.name} vs ${bot.name} · ${detail}`,result:kind,amount:delta,payout:playerPaid,roomId:bet.roomId,gameId:rec.id});}lastProof=fair.proof;
    logCatalogMatch({t:rec.t,id:rec.id,game:g.name,playerA:"You",pickA:String(pick),playerB:bot.name,pickB:String(botPick),stake,fee,result:kind,detail,proof:fair.proof.finalHash});
    if(kind==="WIN"&&playerPaid>=400)cfg().reviewFlags.unshift({t:Date.now(),game:rec.id,type:"big-win",amount:delta});
    gameState.catalogResults[g.id]={kind,detail,botName:bot.name,botFlag:bot.flag,pick,botPick,delta,proof:fair.proof};
    addFeed(`🎮 <b>You</b> ${kind.toLowerCase()} ${g.name} vs <b>${bot.name}</b> · ${detail} · ${delta>=0?'+':''}${fmt(delta)}`);
    toast(kind==="WIN"?`🏆 ${g.name} won! +${fmt(delta)}`:kind==="CARRY"?`🔥 Pot carried to ${fmt(S.gameCarries[g.id])}`:`${g.name}: ${kind}`,kind==="WIN"?"ok":kind==="LOSE"?"err":"");
  }catch(e){console.warn("catalog game error",e);refund(bet.split);bot.balance+=stake;toast("Match failed — stakes refunded.","err");}
  finally{busy=false;render();renderGamePanel();}
}
function filteredCatalogGames(){const q=CATALOG_NAV.search.trim().toLowerCase(),fav=S.settings.catalogFavorites||[];return GAMES.filter(g=>(!CATALOG_NAV.group||catalogGroup(g.id)===CATALOG_NAV.group)&&(!CATALOG_NAV.favorites||fav.includes(g.id))&&(!q||`${g.code||''} ${g.name} ${g.desc} ${g.edge} ${catalogGroup(g.id)}`.toLowerCase().includes(q)));}
function syncCatalogNavigation(){const groups=Object.keys(CATALOG_GROUPS),group=$("catalogNavGroup"),jump=$("catalogNavJump"),fav=S.settings.catalogFavorites||[];if(!group.dataset.ready){group.innerHTML='<option value="">All categories</option><option value="__favorites">★ Favorites</option>'+groups.map(x=>`<option value="${x}">${x}</option>`).join('');group.dataset.ready='1';}if(!jump.dataset.ready){jump.innerHTML='<option value="">Select a game…</option>'+groups.map(x=>`<optgroup label="${x}">${GAMES.filter(g=>catalogGroup(g.id)===x).map(g=>`<option value="${g.id}">${g.code?g.code+' · ':''}${g.name.replace(/^\S+\s/,'')}</option>`).join('')}</optgroup>`).join('');jump.dataset.ready='1';}group.value=CATALOG_NAV.favorites?'__favorites':CATALOG_NAV.group;jump.value=activeGame;if(document.activeElement!==$("catalogNavSearch"))$("catalogNavSearch").value=CATALOG_NAV.search;$("catalogFavoriteBtn").textContent=fav.includes(activeGame)?'★ Favorited':'☆ Favorite';$("catalogFavoriteBtn").classList.toggle('btn-primary',fav.includes(activeGame));}
function renderCatalogTabs(){const rows=filteredCatalogGames(),fav=S.settings.catalogFavorites||[];$("gameTabs").innerHTML=rows.length?rows.map(g=>`<button class="game-tab ${activeGame===g.id?'active':''}" data-gtab="${g.id}">${g.name}${fav.includes(g.id)?'<span class="fav-star">★</span>':''} <span class="muted" style="font-size:10px;margin-left:4px">${g.code||g.edge}</span></button>`).join(""):'<div class="game-nav-empty">No Catalog games match these filters.</div>';$("catalogNavSummary").textContent=`Showing ${rows.length} of ${GAMES.length} games${CATALOG_NAV.group?' · '+CATALOG_NAV.group:''}${CATALOG_NAV.favorites?' · favorites only':''}`;syncCatalogNavigation();}
function renderGames(){
  renderCatalogTabs();
  $("gamePanels").innerHTML=GAMES.map(g=>`<div class="card game-panel ${activeGame===g.id?'active':''}" id="gpanel-${g.id}"></div>`).join("");
  renderGamePanel();
}
function renderGamePanel(){
  // The restored classic Arcade Zone panels (Crash, Hi-Lo and Mines) are hosted by the
  // New Games hub: when that hub is visible, refresh it instead of the hidden catalog panel.
  const hubPanel=document.getElementById("panel-newgames");
  if(hubPanel&&hubPanel.classList.contains("active")&&["crash","hilo","mines"].includes(HUB.newgames)){renderNewGamesHub();return;}
  const p=$("gpanel-"+activeGame),g=GAMES.find(x=>x.id===activeGame);if(!p||!g)return;
  p.innerHTML=catalogGameHTML(g);bindCatalogPanel(g);
}
function diceHTML(){
  const gs=gameState.dice;
  const over=gs.over;
  const target=gs.target;
  const winChance=over?100-target:target;
  const mult=(100/winChance*0.98);
  return `<h3>🎲 Dice <span class="muted" id="diceMeta" style="margin-left:auto;font-weight:400">roll ${over?"over":"under"} ${target.toFixed(1)} · ${winChance}% · ${mult.toFixed(2)}×</span></h3>
    <div class="game-big" id="diceResult" style="color:var(--mut)">—</div>
    <label>Target: <b id="diceTarget">${target.toFixed(1)}</b> (2.0–98.0)</label>
    <input type="range" min="2" max="98" value="${target}" class="dice-slider" id="diceSlider"/>
    <div class="game-row">
      <button class="btn btn-sm ${over?'':'btn-primary'}" id="diceUnder">Roll Under</button>
      <button class="btn btn-sm ${over?'btn-primary':''}" id="diceOver">Roll Over</button>
      <span style="flex:1"></span>
      <input type="number" class="stake-input sm" id="diceStake" value="50" min="10" style="width:110px"/>
      <button class="btn btn-primary btn-sm" id="diceRoll">Roll</button>
    </div>`;
}
function bindDice(){
  const sl=$("diceSlider");if(!sl)return;
  sl.oninput=()=>{
    const target=gameState.dice.target=+sl.value;
    const chance=gameState.dice.over?100-target:target;
    $("diceTarget").textContent=target.toFixed(1);
    $("diceMeta").textContent=`roll ${gameState.dice.over?"over":"under"} ${target.toFixed(1)} · ${chance}% · ${(100/chance*.98).toFixed(2)}×`;
  };
  $("diceUnder").onclick=()=>{gameState.dice.over=false;renderGamePanel();};
  $("diceOver").onclick=()=>{gameState.dice.over=true;renderGamePanel();};
  $("diceRoll").onclick=playDice;
}
async function playDice(){
  if(busy)return;const stake=Math.round(+$("diceStake").value);
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  busy=true;
  try{
    const o=await gameOutcome("dice",gameState.dice.target+(gameState.dice.over?"o":"u"));
    const roll=o.byte*100/256; // 0..99.96
    const gs=gameState.dice;
    const win=gs.over?roll>gs.target:roll<gs.target;
    const chance=gs.over?100-gs.target:gs.target;
    const mult=100/chance*0.98;
    const payout=win?Math.round(stake*mult):0;
    const r=$("diceResult");r.textContent=roll.toFixed(2);r.style.color=win?"var(--green)":"var(--red)";
    settleGameWin("dice",stake,payout,"Dice","🎲 Dice",`rolled ${roll.toFixed(2)} (${win?"WIN":"lose"})`,{...o,gameId:o.byte+100000});
    if(o.jpByte===0&&S.jackpot>=cfg().jpArm){payJackpot("dice");}
  }catch(e){console.warn(e);refund(split);}
  finally{busy=false;render();}
}
function luckyHTML(){
  const p=gameState.lucky.pick;
  return `<h3>🔢 Lucky Number <span class="muted" style="margin-left:auto;font-weight:400">pick 1 number 1–10 · 9× payout (10% edge)</span></h3>
    <div class="pick-grid" id="luckyPicks">
      ${Array.from({length:10},(_,i)=>`<button class="pick-btn ${p===i+1?'active':''}" data-lp="${i+1}">${i+1}</button>`).join("")}
    </div>
    <div class="game-big" id="luckyResult" style="color:var(--mut)">—</div>
    <div class="game-row"><span style="flex:1"></span>
      <input type="number" class="stake-input sm" id="luckyStake" value="50" min="10" style="width:110px"/>
      <button class="btn btn-primary btn-sm" id="luckyPlay">Play</button></div>`;
}
function bindLucky(){
  document.querySelectorAll("[data-lp]").forEach(b=>b.onclick=()=>{gameState.lucky.pick=+b.dataset.lp;renderGamePanel();});
  const pl=$("luckyPlay");if(pl)pl.onclick=playLucky;
}
async function playLucky(){
  if(busy)return;const stake=Math.round(+$("luckyStake").value);
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  busy=true;
  try{
    const o=await gameOutcome("lucky",gameState.lucky.pick);
    const drawn=(o.result%10)+1; // 1..10
    const win=drawn===gameState.lucky.pick;
    const payout=win?stake*9:0;
    const r=$("luckyResult");r.textContent="🎲 "+drawn;r.style.color=win?"var(--green)":"var(--red)";
    settleGameWin("lucky",stake,payout,"Lucky Number","🎲 Lucky #",`drew ${drawn}, picked ${gameState.lucky.pick}`,{...o,gameId:o.result+200000});
    if(o.jpByte===0&&S.jackpot>=cfg().jpArm)payJackpot("lucky");
  }catch(e){console.warn(e);refund(split);}
  finally{busy=false;render();}
}
const WHEEL_SEGMENTS=[
 {label:"0×",color:"#475569",mult:0,weight:5},
 {label:"1.5×",color:"#10b981",mult:1.5,weight:4},
 {label:"0×",color:"#475569",mult:0,weight:5},
 {label:"2×",color:"#3b82f6",mult:2,weight:3},
 {label:"0×",color:"#475569",mult:0,weight:5},
 {label:"3×",color:"linear-gradient(135deg,#fbbf24,#f43f5e,#a855f7)",mult:3,weight:2},
 {label:"0×",color:"#475569",mult:0,weight:4},
 {label:"5×",color:"#f59e0b",mult:5,weight:1},
 {label:"0×",color:"#475569",mult:0,weight:4},
 {label:"10×",color:"#ef4444",mult:10,weight:1}
];
function wheelHTML(){
  const grad=WHEEL_SEGMENTS.map((s,i)=>{const start=WHEEL_SEGMENTS.slice(0,i).reduce((a,x)=>a+x.weight,0);
    const total=WHEEL_SEGMENTS.reduce((a,x)=>a+x.weight,0);
    return `${s.color} ${start/total*360}deg ${(start+s.weight)/total*360}deg`;}).join(",");
  return `<h3>🎡 Wheel <span class="muted" style="margin-left:auto;font-weight:400">spin to win up to 10×</span></h3>
    <div class="wheel-wrap"><div class="wheel-pointer">🔻</div>
      <div class="wheel" id="wheel" style="background:conic-gradient(${grad})"></div>
      <div class="wheel-center">SPIN</div></div>
    <div class="game-big" id="wheelResult" style="color:var(--mut)">—</div>
    <div class="game-row"><span style="flex:1"></span>
      <input type="number" class="stake-input sm" id="wheelStake" value="50" min="10" style="width:110px"/>
      <button class="btn btn-primary btn-sm" id="wheelSpin">Spin</button></div>`;
}
function bindWheel(){const b=$("wheelSpin");if(b)b.onclick=spinWheel;}
async function spinWheel(){
  if(busy)return;const stake=Math.round(+$("wheelStake").value);
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  busy=true;
  try{
    const o=await gameOutcome("wheel","spin");
    const total=WHEEL_SEGMENTS.reduce((a,x)=>a+x.weight,0);
    let r=o.result%total,idx=0;
    for(let i=0;i<WHEEL_SEGMENTS.length;i++){r-=WHEEL_SEGMENTS[i].weight;if(r<0){idx=i;break;}}
    const seg=WHEEL_SEGMENTS[idx];
    const segStart=WHEEL_SEGMENTS.slice(0,idx).reduce((a,x)=>a+x.weight,0);
    const segCenter=(segStart+seg.weight/2)/total*360;
    const wheel=$("wheel");
    const finalRot=360*5+(360-segCenter);
    wheel.style.transform=`rotate(${finalRot}deg)`;
    await new Promise(r=>setTimeout(r,3100));
    const payout=Math.round(stake*seg.mult);
    const rr=$("wheelResult");rr.textContent=seg.label+(seg.mult>0?`  +${fmt(payout-stake)}`:"");rr.style.color=seg.mult>0?"var(--green)":"var(--red)";
    settleGameWin("wheel",stake,payout,"Wheel","🎡 Wheel",`landed ${seg.label}`,{...o,gameId:o.result+300000});
    if(o.jpByte===0&&S.jackpot>=cfg().jpArm)payJackpot("wheel");
  }catch(e){console.warn(e);refund(split);}
  finally{busy=false;render();}
}
function crashHTML(){
  const cs=gameState.crash;
  return `<h3>🚀 Crash <span class="muted" style="margin-left:auto;font-weight:400">cash out before it busts · 1% edge</span></h3>
    <p class="muted">A rocket multiplier rises from 1× from a provably-fair curve. Cash out any time to bank {mult}×; if the rocket busts before you cash out you lose the stake. Set an auto cash-out to lock your target.</p>
    <div class="crash-graph"><div class="crash-grid"></div>
      <div class="crash-plane" id="crashPlane" style="transform:translate(0,0)">🚀</div>
      <div class="crash-mult" id="crashMult">${cs.running?cs.mult.toFixed(2)+"×":(cs.crashedAt?"💥 "+cs.crashedAt.toFixed(2)+"×":"READY")}</div></div>
    <div class="game-row">
      <input type="number" class="stake-input sm" id="crashStake" value="50" min="10" ${cs.running?'disabled':''} style="width:110px"/>
      <input type="number" class="stake-input sm" id="crashAuto" value="${(cs.autoCash||2).toFixed(2)}" min="1.01" step="0.1" ${cs.running?'disabled':''} style="width:110px" placeholder="auto 2×"/>
      ${cs.running?'<button class="btn btn-danger btn-sm" id="crashCashout">💰 Cash Out</button>':'<button class="btn btn-primary btn-sm" id="crashStart">🚀 Start</button>'}
    </div>`;
}
function bindCrash(){
  const s=$("crashStart"),c=$("crashCashout");
  if(s)s.onclick=startCrash;if(c)c.onclick=cashoutCrash;
}
async function startCrash(){
  if(busy)return;const stake=Math.round(+$("crashStake").value);
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  const cs=gameState.crash;
  cs.autoCash=Math.max(1.01,parseFloat($("crashAuto").value)||2);
  busy=true;
  // Fair 97% RTP crash curve. Multiplying before floor preserves two decimals.
  let o;try{o=await gameOutcome("crash","v1");}catch(e){refund(split);busy=false;toast("Could not start Crash.","err");return;}
  let cp=Math.max(1.0,Math.floor(((256*0.97)/(256-o.byte))*100)/100);
  cp=Math.min(cp,100);
  cs.running=true;cs.crashedAt=0;cs.mult=1.0;cs.bet=stake;cs.split=split;cs.cashed=false;cs.crashProof=o;
  renderGamePanel();
  const plane=$("crashPlane"),multEl=$("crashMult");
  const startT=Date.now();
  cs.timer=setInterval(()=>{
    if(!cs.running)return;
    const t=(Date.now()-startT)/1000;
    cs.mult=Math.max(1.0,Math.pow(Math.E,t*0.12));
    multEl.textContent=cs.mult.toFixed(2)+"×";multEl.classList.remove("bust");
    const x=Math.min(90,t*25),y=Math.min(80,Math.log(cs.mult)*25);
    plane.style.transform=`translate(${x}%,-${y}%)`;
    // auto cashout
    const auto=cs.autoCash;
    if(!cs.cashed&&auto>1&&cs.mult>=auto&&cs.mult<cp){cashoutCrash();}
    if(cs.mult>=cp){
      cs.running=false;cs.crashedAt=cp;cs.mult=cp;
      clearInterval(cs.timer);
      multEl.textContent="💥 "+cp.toFixed(2)+"×";multEl.classList.add("bust");
      plane.textContent="💥";
      // settle loss
      busy=true;
      S.stats.games++;S.global.totalGames++;S.monthWagered+=stake;awardXp(stake);S.stats.losses++;S.stats.net-=stake;sessionNet-=stake;
      S.games.unshift({id:o.byte+400000,result:"LOSE",stake,fee:0,oppName:"🚀 Crash",oppFlag:"",winner:"house",delta:-stake,verified:true,game:"Crash",resultText:"busted at "+cp.toFixed(2)+"×",proof:o});
      if(S.games.length>200)S.games.pop();
      addFeed(`🚀 Crash busted at <b>${cp.toFixed(2)}×</b>`);
      if(o.jpByte===0&&S.jackpot>=cfg().jpArm)payJackpot("crash");
      cs.bet=0;cs.split=null;
      setTimeout(()=>{busy=false;render();renderGamePanel();},600);
    }
  },80);
}
function cashoutCrash(){
  const cs=gameState.crash;if(!cs.running||cs.cashed)return;
  cs.cashed=true;cs.running=false;clearInterval(cs.timer);
  const payout=Math.round(cs.bet*cs.mult);
  S.wallet.main+=payout;
  S.stats.games++;S.global.totalGames++;S.monthWagered+=cs.bet;S.xp+=cs.bet;S.stats.wins++;S.stats.net+=payout-cs.bet;sessionNet+=payout-cs.bet;
  S.stats.bestWin=Math.max(S.stats.bestWin,payout-cs.bet);
  S.games.unshift({id:Date.now(),result:"WIN",stake:cs.bet,fee:0,oppName:"🚀 Crash",oppFlag:"",winner:"you",delta:payout-cs.bet,verified:true,game:"Crash",resultText:"cashed out at "+cs.mult.toFixed(2)+"×",proof:cs.crashProof});
  if(S.games.length>200)S.games.pop();
  toast(`💰 Cashed out at ${cs.mult.toFixed(2)}× — +${fmt(payout-cs.bet)}`,"ok");
  addFeed(`🚀 <b>You</b> cashed out at ${cs.mult.toFixed(2)}×`);
  if(cs.crashProof&&cs.crashProof.jpByte===0&&S.jackpot>=cfg().jpArm)payJackpot("crash");
  cs.bet=0;cs.split=null;
  setTimeout(()=>{busy=false;render();renderGamePanel();},300);
}
function hiloHTML(){
  const hs=gameState.hilo;
  if(!hs.active)return `<h3>🂠 Hi-Lo <span class="muted" style="margin-left:auto;font-weight:400">guess higher/lower · each correct = 1.7× streak</span></h3>
    <p class="muted">Guess whether the next proof-derived card is higher or lower than the current card. Each correct guess multiplies your stake by 1.7×; bank your streak any time before a wrong guess.</p>
    <div class="hilo-card">?</div>
    <div class="game-row" style="justify-content:center">
      <input type="number" class="stake-input sm" id="hiloStake" value="50" min="10" style="width:120px"/>
      <button class="btn btn-primary btn-sm" id="hiloStart">Start</button></div>`;
  return `<h3>🂠 Hi-Lo <span class="muted" style="margin-left:auto;font-weight:400">streak ×${hs.streak} · bank ${fmt(hs.bet)}</span></h3>
    <div class="hilo-card">${cardEmoji(hs.current)}</div>
    <div class="game-row" style="justify-content:center;gap:14px">
      <button class="btn btn-primary" id="hiloLower" style="min-width:120px">⬇️ Lower</button>
      <button class="btn btn-primary" id="hiloHigher" style="min-width:120px">⬆️ Higher</button>
    </div>
    <div class="game-row" style="justify-content:center"><button class="btn btn-success btn-sm" id="hiloCash" style="background:rgba(var(--green-rgb),.15);border:1px solid rgba(var(--green-rgb),.4);color:var(--green)">💰 Bank ${fmt(Math.round(hs.bet*Math.pow(1.7,hs.streak)))}</button></div>`;
}
function cardEmoji(n){ // 1..13 to a suit emoji + rank
  const rank=["A","2","3","4","5","6","7","8","9","10","J","Q","K"][(n-1)%13];
  const suits=["♠️","♥️","♦️","♣️"];return rank+suits[n%4];
}
function bindHilo(){
  const st=$("hiloStart");if(st)st.onclick=startHilo;
  const hi=$("hiloHigher"),lo=$("hiloLower"),cash=$("hiloCash");
  if(hi)hi.onclick=()=>guessHilo("higher");
  if(lo)lo.onclick=()=>guessHilo("lower");
  if(cash)cash.onclick=bankHilo;
}
async function startHilo(){
  if(busy)return;const stake=Math.round(+$("hiloStake").value);
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  const hs=gameState.hilo;
  hs.active=true;hs.streak=0;hs.bet=stake;hs.split=split;
  hs.current=(await gameOutcome("hilo","c0")).result%13+1;
  renderGamePanel();
}
async function guessHilo(dir){
  const hs=gameState.hilo;if(!hs.active||busy)return;
  busy=true;
  try{
    const o=await gameOutcome("hilo","c"+hs.streak);
    const next=o.result%13+1;
    const correct=(dir==="higher")?next>hs.current:(dir==="lower")?next<hs.current:next===hs.current;
    hs.current=next;hs.streak++;
    if(!correct){
      hs.active=false;
      S.stats.games++;S.global.totalGames++;S.monthWagered+=hs.bet;S.xp+=hs.bet;S.stats.losses++;S.stats.net-=hs.bet;sessionNet-=hs.bet;
      S.games.unshift({id:o.result+500000,result:"LOSE",stake:hs.bet,fee:0,oppName:"🂠 Hi-Lo",oppFlag:"",winner:"house",delta:-hs.bet,verified:true,game:"Hi-Lo",resultText:"busted on "+cardEmoji(next),proof:o});
      if(S.games.length>200)S.games.pop();
      addFeed(`🂠 <b>You</b> busted Hi-Lo at ${cardEmoji(next)}`);
      if(o.jpByte===0&&S.jackpot>=cfg().jpArm)payJackpot("hilo");
      hs.bet=0;hs.split=null;
      toast("❌ Wrong!","err");
    }
    renderGamePanel();
  }finally{busy=false;render();}
}
function bankHilo(){
  const hs=gameState.hilo;if(!hs.active)return;
  const payout=Math.round(hs.bet*Math.pow(1.7,hs.streak));
  S.wallet.main+=payout;hs.active=false;
  S.stats.games++;S.global.totalGames++;S.monthWagered+=hs.bet;S.xp+=hs.bet;S.stats.wins++;S.stats.net+=payout-hs.bet;sessionNet+=payout-hs.bet;
  S.stats.bestWin=Math.max(S.stats.bestWin,payout-hs.bet);
  S.games.unshift({id:Date.now(),result:"WIN",stake:hs.bet,fee:0,oppName:"🂠 Hi-Lo",oppFlag:"",winner:"you",delta:payout-hs.bet,verified:true,game:"Hi-Lo",resultText:"banked at streak "+hs.streak,proof:{}});
  if(S.games.length>200)S.games.pop();
  toast(`💰 Banked ${fmt(payout)}!`,"ok");
  hs.bet=0;hs.split=null;
  renderGamePanel();render();
}
function minesHTML(){
  const ms=gameState.mines;
  if(!ms.active){
    return `<h3>💣 Mines <span class="muted" style="margin-left:auto;font-weight:400">reveal gems, avoid bombs · multiplier rises</span></h3>
      <p class="muted">A 5×5 board hides a number of proof-placed mines. Reveal gems to raise your multiplier; hit a mine and you lose the stake. Choose the mine count before you start.</p>
      <label>Mines: <b id="minesCount">${ms.mines}</b></label>
      <input type="range" min="1" max="15" value="${ms.mines}" class="dice-slider" id="minesSlider"/>
      <div class="grid-mines">${Array.from({length:25}).map(()=>`<div class="mine-tile"></div>`).join("")}</div>
      <div class="game-row" style="justify-content:center">
        <input type="number" class="stake-input sm" id="minesStake" value="50" min="10" style="width:120px"/>
        <button class="btn btn-primary btn-sm" id="minesStart">Start</button></div>`;
  }
  return `<h3>💣 Mines <span class="muted" style="margin-left:auto;font-weight:400">${ms.mines} bombs · gems ${ms.picked} · ${minesMult(ms).toFixed(2)}×</span></h3>
    <div class="grid-mines">${ms.grid.map((cell,i)=>{
      if(cell==="gem")return `<div class="mine-tile revealed">💎</div>`;
      if(cell==="bomb")return `<div class="mine-tile boom">💣</div>`;
      return `<div class="mine-tile" data-mine="${i}"></div>`;
    }).join("")}</div>
    <div class="game-row" style="justify-content:center">
      <button class="btn btn-success btn-sm" id="minesCash" style="background:rgba(var(--green-rgb),.15);border:1px solid rgba(var(--green-rgb),.4);color:var(--green)">💰 Bank ${fmt(Math.round(ms.bet*minesMult(ms)))}</button>
    </div>`;
}
function minesMult(ms){
  const safe=25-ms.mines;
  let m=1;
  for(let i=0;i<ms.picked;i++){m=m*(25-i)/(safe-i);}
  return m*0.97; // 3% edge
}
function bindMines(){
  const sl=$("minesSlider");if(sl)sl.oninput=()=>{gameState.mines.mines=+sl.value;$("minesCount").textContent=sl.value;};
  const st=$("minesStart");if(st)st.onclick=startMines;
  const c=$("minesCash");if(c)c.onclick=bankMines;
  document.querySelectorAll("[data-mine]").forEach(t=>t.onclick=()=>pickMine(+t.dataset.mine));
}
async function startMines(){
  if(busy)return;const stake=Math.round(+$("minesStake").value);
  try{checkGuards(stake);}catch(e){toast(e.message,"err");return;}
  let split;try{split=escrow(stake);}catch(e){toast(e.message,"err");return;}
  const ms=gameState.mines;
  ms.active=true;ms.busted=false;ms.picked=0;ms.bet=stake;ms.split=split;
  // place mines fairly via hash bytes
  const o=await gameOutcome("mines","v1");
  const positions=new Set();
  let h=o.h;
  while(positions.size<ms.mines){
    const v=parseInt(h.slice(0,2),16)%25;positions.add(v);
    h=await shaHex(h+"x");
  }
  ms.minePositions=positions;
  ms.grid=Array(25).fill("empty");
  renderGamePanel();
}
async function pickMine(i){
  const ms=gameState.mines;if(!ms.active||ms.busted)return;
  busy=true;
  try{
    if(ms.minePositions.has(i)){
      ms.busted=true;ms.active=false;ms.grid[i]="bomb";
      // reveal all
      ms.minePositions.forEach(p=>ms.grid[p]="bomb");
      S.stats.games++;S.global.totalGames++;S.monthWagered+=ms.bet;S.xp+=ms.bet;S.stats.losses++;S.stats.net-=ms.bet;sessionNet-=ms.bet;
      S.games.unshift({id:Date.now(),result:"LOSE",stake:ms.bet,fee:0,oppName:"💣 Mines",oppFlag:"",winner:"house",delta:-ms.bet,verified:true,game:"Mines",resultText:"hit a bomb",proof:{}});
      if(S.games.length>200)S.games.pop();
      addFeed("💣 <b>You</b> hit a bomb in Mines");
      toast("💥 Bomb!","err");
    }else{
      ms.grid[i]="gem";ms.picked++;
      toast(`💎 Gem! ${minesMult(ms).toFixed(2)}×`,"ok");
    }
    renderGamePanel();
  }finally{busy=false;render();}
}
function bankMines(){
  const ms=gameState.mines;if(!ms.active||ms.picked===0)return;
  const payout=Math.round(ms.bet*minesMult(ms));
  S.wallet.main+=payout;ms.active=false;
  S.stats.games++;S.global.totalGames++;S.monthWagered+=ms.bet;S.xp+=ms.bet;S.stats.wins++;S.stats.net+=payout-ms.bet;sessionNet+=payout-ms.bet;
  S.stats.bestWin=Math.max(S.stats.bestWin,payout-ms.bet);
  S.games.unshift({id:Date.now(),result:"WIN",stake:ms.bet,fee:0,oppName:"💣 Mines",oppFlag:"",winner:"you",delta:payout-ms.bet,verified:true,game:"Mines",resultText:`banked ${ms.picked} gems`,proof:{}});
  if(S.games.length>200)S.games.pop();
  toast(`💰 Banked ${fmt(payout)}!`,"ok");
  ms.bet=0;ms.split=null;
  renderGamePanel();render();
}
function payJackpot(src){
  const jp=Math.round(S.jackpot*cfg().jpPayPct/100);
  S.wallet.main+=jp;S.jackpot-=jp;S.stats.jackpots++;S.global.jackpots++;unlockAch("jackpot");
  toast(`🎰 JACKPOT! +${fmt(jp)} from ${src}!`,"jp");
  addFeed(`🎰 <b>You</b> hit the ${src} JACKPOT — +${fmt(jp)}!`,true);
  confettiFx();
}
function bindGamePanel(){
  if(activeGame==="dice")bindDice();
  else if(activeGame==="lucky")bindLucky();
  else if(activeGame==="wheel")bindWheel();
  else if(activeGame==="crash")bindCrash();
  else if(activeGame==="hilo")bindHilo();
  else if(activeGame==="mines")bindMines();
}
async function settleBotCatalogMatch(g,a,pickA,b,pickB,stake,stakesEscrowed=false){
  stake=coin(stake);
  // Escrow and payout both go through the shared money module so bot wallets
  // obey the same zero-negative invariant as the player wallet.
  if(!stakesEscrowed){debitBot(a,stake);debitBot(b,stake);}
  const fair=await catalogFairOutcome(g,stake,pickA,pickB),out=resolveCatalogGame(g,String(pickA),String(pickB),fair.bytes);
  const pot=mul(stake,2),fee=pct(pot,cfg().feePct),jpc=Math.max(0,Math.min(sub(fee,1),Math.max(cfg().jpFloor,pct(fee,cfg().jpFundPct))));
  S.jackpot=add(S.jackpot,jpc);cfg().house.catalogFees=add(cfg().house.catalogFees||0,sub(fee,jpc));cfg().house.netRevenue=add(cfg().house.netRevenue||0,sub(fee,jpc));cfg().sinks=add(cfg().sinks||0,fee);
  S.gameCarries=S.gameCarries||{};const carry=coin(S.gameCarries[g.id]||0),available=add(sub(pot,fee),carry);
  a.games=(a.games||0)+1;b.games=(b.games||0)+1;
  if(out.winner==="player"){creditBot(a,available);a.wins=(a.wins||0)+1;a.streak=(a.streak||0)+1;a.bestStreak=Math.max(a.bestStreak||0,a.streak);a.net=sub(add(a.net||0,available),stake);b.losses=(b.losses||0)+1;b.streak=0;b.net=sub(b.net||0,stake);S.gameCarries[g.id]=0;}
  else if(out.winner==="bot"){creditBot(b,available);b.wins=(b.wins||0)+1;b.streak=(b.streak||0)+1;b.bestStreak=Math.max(b.bestStreak||0,b.streak);b.net=sub(add(b.net||0,available),stake);a.losses=(a.losses||0)+1;a.streak=0;a.net=sub(a.net||0,stake);S.gameCarries[g.id]=0;}
  else if(out.winner==="split"){const parts=allocate(available,[1,1]),ap=parts[0],bp=parts[1];creditBot(a,ap);creditBot(b,bp);a.net=sub(add(a.net||0,ap),stake);b.net=sub(add(b.net||0,bp),stake);S.gameCarries[g.id]=0;}
  else{a.net=sub(a.net||0,stake);b.net=sub(b.net||0,stake);S.gameCarries[g.id]=add(carry,sub(pot,fee));}
  logCatalogMatch({t:Date.now(),id:fair.proof.gameId,game:g.name,playerA:a.name,pickA:String(pickA),playerB:b.name,pickB:String(pickB),stake,fee,result:out.winner==="player"?`${a.name} WIN`:out.winner==="bot"?`${b.name} WIN`:out.winner.toUpperCase(),detail:out.detail,proof:fair.proof.finalHash});
  S.global.totalGames++;if(fair.bytes[0]%2===0)S.global.heads++;else S.global.tails++;
  [a,b].forEach(x=>topUpBot(x,"Catalog balance"));
  if(!window._suppressFeed&&Math.random()<0.55)addFeed(`🎮 <b>${a.name}</b> vs <b>${b.name}</b> in ${g.name} · ${out.detail}${out.winner==="carry"?' · pot carried':''}`);
}
async function autoMatchBotCatalogBet(id){
  const open=S.waiting.find(x=>x.id===id&&x.kind==="catalog"&&x.owner!=="you");if(!open||busy)return;
  const g=GAMES.find(x=>x.id===open.catalogGame),a=botByName(open.owner);if(!g||!a)return;
  const pool=S.bots.filter(x=>x!==a&&x.balance>=open.stake);if(!pool.length)return;
  const b=pool[Math.floor(Math.random()*pool.length)],pickB=catalogBotPick(g,open.pick);debitBot(b,coin(open.stake));S.waiting=S.waiting.filter(x=>x!==open);
  await settleBotCatalogMatch(g,a,String(open.pick),b,String(pickB),open.stake,true);
}
async function botPlayGame(){
  const g=GAMES[Math.floor(Math.random()*GAMES.length)],stake=[50,100,250][Math.floor(Math.random()*3)],pool=S.bots.filter(b=>!b.frozen&&ensureBotFirstTopup(b,'Required first top-up before activity')&&b.balance>=stake);if(pool.length<2)return;
  const a=pool[Math.floor(Math.random()*pool.length)];let b=pool[Math.floor(Math.random()*pool.length)];while(b===a)b=pool[Math.floor(Math.random()*pool.length)];const pickA=catalogRandomPick(g),pickB=catalogBotPick(g,pickA);
  await settleBotCatalogMatch(g,a,pickA,b,pickB,stake,false);
}

export function bind(){
  setInterval(heartbeat,2000);
  heartbeat();
  window.addEventListener("storage",e=>{if(e.key===SAVE_KEY){applyingRemoteState=true;try{load();checkVipMonthReset();applyVipUnlocks(false);render();}finally{applyingRemoteState=false;}}});
  if(botLiveChannel)botLiveChannel.onmessage=e=>{const m=e.data||{};if(m.type==='admin-pulse'){lastAdminPulse=Date.now();botLiveChannel.postMessage({type:'player-alive',id:SIM_TAB_ID,t:Date.now(),games:S?.global?.totalGames||0});if(Date.now()-lastBotTickAt>1700)runCoordinatedBotTick('admin-request');}};
  window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){lastAdminPulse=0;runCoordinatedBotTick('player-visible');}});
  window.addEventListener('beforeunload',()=>{try{const lock=JSON.parse(localStorage.getItem(SIM_LEADER_KEY)||'{}');if(lock.id===SIM_TAB_ID)localStorage.removeItem(SIM_LEADER_KEY);}catch(e){}});
  $("catalogNavSearch").oninput=e=>{CATALOG_NAV.search=e.target.value;renderCatalogTabs();};
  $("catalogNavGroup").onchange=e=>{CATALOG_NAV.favorites=e.target.value==='__favorites';CATALOG_NAV.group=CATALOG_NAV.favorites?'':e.target.value;renderCatalogTabs();};
  $("catalogNavJump").onchange=e=>{if(!e.target.value)return;activeGame=e.target.value;renderGames();};
  $("catalogFavoriteBtn").onclick=()=>{const fav=S.settings.catalogFavorites=S.settings.catalogFavorites||[],i=fav.indexOf(activeGame);if(i>=0)fav.splice(i,1);else fav.push(activeGame);renderCatalogTabs();save();};
  document.addEventListener("click",e=>{
    const t=e.target.closest("[data-gtab]");if(t){activeGame=t.dataset.gtab;renderGames();}
  });
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{CATALOG_GROUPS,CATALOG_NAV,GAMES,PATTERNS3,PATTERNS5,WHEEL_SEGMENTS,ZONES,accountBotStartingBonus,autoMatchBotCatalogBet,backgroundTick,bankHilo,bankMines,bindCatalogPanel,bindCrash,bindDice,bindGamePanel,bindHilo,bindLucky,bindMines,bindWheel,botActivityLog,botArcadeActivity,botBuyShop,botJoinCatalogBet,botPlayGame,botSocialActivity,botTransferCoins,cancelCatalogBet,cardEmoji,cashoutCrash,catalogBotPick,catalogChoices,catalogDefaultPick,catalogFairOutcome,catalogGameHTML,catalogGroup,catalogRandomPick,catalogWaitingHTML,claimBotEngineLeadership,comparePoker,crashHTML,createAutoBot,diceHTML,ensureAllBotsFirstTopups,ensureBotFirstTopup,filteredCatalogGames,gameOutcome,gameState,growBotRoster,guessHilo,heartbeat,hiloHTML,houseEdge,isPrimeNumber,logCatalogMatch,luckyHTML,minesHTML,minesMult,payJackpot,pickMine,playDice,playLucky,pokerScore,postCatalogBet,processBotWithdrawals,readyBotPool,renderCatalogTabs,renderGamePanel,renderGames,requestBotWithdraw,resolveCatalogGame,runCoordinatedBotTick,settleBotCatalogMatch,settleBotFlip,settleCatalogBet,settleGameWin,spinWheel,startCrash,startHilo,startMines,syncCatalogNavigation,takeCatalogBet,topUpBot,wheelHTML,withdrawAtFor,zoneBounds});

export {CATALOG_GROUPS,CATALOG_NAV,GAMES,PATTERNS3,PATTERNS5,WHEEL_SEGMENTS,ZONES,accountBotStartingBonus,autoMatchBotCatalogBet,backgroundTick,bankHilo,bankMines,bindCatalogPanel,bindCrash,bindDice,bindGamePanel,bindHilo,bindLucky,bindMines,bindWheel,botActivityLog,botArcadeActivity,botBuyShop,botJoinCatalogBet,botPlayGame,botSocialActivity,botTransferCoins,cancelCatalogBet,cardEmoji,cashoutCrash,catalogBotPick,catalogChoices,catalogDefaultPick,catalogFairOutcome,catalogGameHTML,catalogGroup,catalogRandomPick,catalogWaitingHTML,claimBotEngineLeadership,comparePoker,crashHTML,createAutoBot,diceHTML,ensureAllBotsFirstTopups,ensureBotFirstTopup,filteredCatalogGames,gameOutcome,gameState,growBotRoster,guessHilo,heartbeat,hiloHTML,houseEdge,isPrimeNumber,logCatalogMatch,luckyHTML,minesHTML,minesMult,payJackpot,pickMine,playDice,playLucky,pokerScore,postCatalogBet,processBotWithdrawals,readyBotPool,renderCatalogTabs,renderGamePanel,renderGames,requestBotWithdraw,resolveCatalogGame,runCoordinatedBotTick,settleBotCatalogMatch,settleBotFlip,settleCatalogBet,settleGameWin,spinWheel,startCrash,startHilo,startMines,syncCatalogNavigation,takeCatalogBet,topUpBot,wheelHTML,withdrawAtFor,zoneBounds};
