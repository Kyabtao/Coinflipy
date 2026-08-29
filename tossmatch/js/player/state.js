/* FlipArena player module — state */
import "../shared/runtime.js";
import {coin,enforceWalletInvariants,numOr,reconciliation,sub} from "../shared/money.js";
import {SAVE_KEY} from "./core.js";
import {BOTS_SEED,VIP_SEED} from "./data.js";

function cfg(){return S.config;}
function houseGross(){const h=cfg().house;return (h.fees||0)+(h.catalogFees||0)+(h.cupRakes||0)+(h.trnyRakes||0)+(h.shop||0)+(h.xfFees||0);}
function houseNet(){const h=cfg().house;return houseGross()-(h.promoCost||0)-(h.comps||0);}
function houseCashIn(){const h=cfg().house;return (h.deposits||0)+(h.botDeposits||0);}
function houseCashOut(){const h=cfg().house;return (h.withdrawals||0)+(h.playerWithdrawals||0);}
function houseNetCash(){return houseCashIn()-houseCashOut();}
/* Reconciliation is delegated to the shared money module so both apps derive
   net revenue from the same integer-subunit formula:
       Net revenue = Gross revenue − Promo cost − Comps
       Gross revenue = fees + catalog fees + cup rakes + tournament rakes + shop + transfer fees */
function reconcileHouse(){
  const h=cfg().house,r=reconciliation();
  h.netRevenue=r.net;h.netCash=r.netCash;
  const drift=sub(coin(r.net),coin(houseNet()));
  if(Math.abs(drift)>0){h.netRevenue=coin(houseNet());h.netCash=coin(houseNetCash());}
  enforceWalletInvariants();
  return h;
}
function initializeBotStartingWallet(bot){if(!bot)return bot;if((bot.walletVersion||0)<2){bot.balance=0;bot.bonusBalance=1000;bot.walletVersion=2;bot.startingBonus=1000;bot.startingBonusAccounted=false;bot.startingBonusAt=0;bot.firstTopupDone=false;bot.firstTopupAt=0;bot.topupCount=0;bot.topupTotal=0;bot.lastTopupBase=0;}else{bot.balance=Math.max(0,+(bot.balance||0));bot.bonusBalance=Math.max(0,+(bot.bonusBalance??1000));}return bot;}
function defaultState(){
  const now=Date.now();
  return {
    v:10.8,
    wallet:{main:1000,bonus:250,referral:50,rakeback:0,bank:0},
    level:1,xp:0,monthWagered:0,accruedRakeback:0,vipMonthKey:new Date().toISOString().slice(0,7),vipUnlockedTier:1,vipBenefits:{unlockedAt:{1:Date.now()},birthdayEligible:false},
    streak:0,bestStreak:0,lossStreak:0,
    quests:{settle:0,win:0,cup:0,claimed:{}},
    owned:{skins:["classic"],flags:[],avatars:[],frames:["none"],colours:["default"],fx:["confetti"],themes:["midnight"],sounds:["standard"],emojis:[]},
    equipped:{skin:"classic",flag:"",avatar:"",frame:"none",colour:"default",fx:"confetti",theme:"midnight",sound:"standard"},
    games:[],reactions:{},
    stats:{metricsVersion:1,games:0,wins:0,losses:0,draws:0,carries:0,biggestStake:0,jackpots:0,net:0,bestWin:0,maxPayout:0,totalPayout:0,lifetimeWagered:0,feesPaid:0,catalogGames:0,seriesPlayed:0,tournamentEntries:0,friendGames:0,roomGames:0,clanGames:0,arcadePlays:0,cupsWon:0,trnysWon:0},
    histories:{friendChallenges:[],rooms:[],roomGames:[],clanGames:[],arcade:[],progression:[],economy:[],social:[]},
    trophies:{cups:0,trnys:0},
    achievements:{},levelMilestones:{},
    waiting:[],cups:[],trnys:[],x2room:[],feed:[],gameCarries:{},
    jackpot:120,
    bots:BOTS_SEED.map(b=>({...b,balance:0,bonusBalance:1000,walletVersion:2,startingBonus:1000,startingBonusAccounted:false,startingBonusAt:0,wins:0,losses:0,net:0,streak:0,bestStreak:0,biggestWin:0,jackpots:0,games:0,shop:b.shop||[],title2:b.title2||"",firstTopupDone:false,firstTopupAt:0,topupCount:0,topupTotal:0})),
    settings:{theme:"dark",themeName:"midnight",customPalette:null,sound:true,instant:false,autoRebet:false,autoRebetStop:-200,language:"en",catalogFavorites:[],arcadeFavorites:[],accessibility:{highContrast:false,reducedMotion:false,textScale:100,colorVision:"none",screenReaderHints:true},dashboardWidgets:["wallet","net","jackpot","level","network","topups"],dashboardSections:["opportunities","vip","feed","explore"],gamePresets:[]},
    referralCode:"TM-"+Math.floor(1000+Math.random()*9000),referredBy:"",referralCount:0,referralEarned:0,
    transferToday:0,transferDay:new Date().toDateString(),transferCount:0,catalogPlayed:{},
    playerName:"",firstDepositDone:false,
    kyc:{verified:false,verifiedAt:0,name:"",docType:""},
    playerWithdrawals:{count:0,amount:0,log:[]},
    walletRefs:{deposit:1,withdraw:1},
    login:{streak:0,lastDay:""},
    social:{friends:[],friendRequests:[],botFriendships:[],blocked:[],muted:[],chat:[],privateRooms:[],gifts:[],clan:null,clanScore:0},
    botActivity:{socialActions:0,arcadePlays:0,createdBots:0,socialLog:[],arcadeLog:[],lastCreatedAt:0},
    services:{apiKey:"tm_demo_"+Math.random().toString(36).slice(2,10),apiLog:[],notifications:{enabled:false,match:true,friend:true,jackpot:true,quest:true},notificationLog:[],twoFactor:{secret:"",enabled:false,verifiedAt:0},antiCheat:{lastScan:0,score:0,findings:[]},promoClaims:{},activeDepositPromo:"",statements:[],emailLog:[],pwaInstallSeen:false},
    rg:{depositLimits:{daily:0,weekly:0,monthly:0},pendingDepositLimits:null,deposits:[],sessionLimitMin:0,coolOffMin:1,coolOffUntil:0,selfExUntil:0,selfExPermanent:false,selfExReason:"",realityIntervalMin:5,lastRealityAt:Date.now(),sessionPoints:[{t:Date.now(),net:0}]},
    analytics:{samples:[],lastSampleAt:0},
    featureGames:{wheel:{lastFreeDay:"",spins:0,lastPrize:""},scratch:[],dice:[],raffle:{week:"",playerTickets:0,botTickets:80,pool:800,lastWinner:""},ladder:[],war:[],extended:{plays:[],last:{},lastTriviaDay:"",fishingCollection:{}}},
    engagement:{battlePass:{month:"",xp:0,premium:false,claimedFree:[],claimedPremium:[]},weekly:{key:"",wins:0,games:0,gameTypes:{},bestStreak:0,claimed:[]},prestige:0,skillOnly:false},
    economyPlus:{cratesOpened:0,tradingListings:[],staking:{balance:0,lastClaim:Date.now()},subscription:{tier:"none",expires:0,lastDropMonth:""},boosters:{xpUntil:0,rakeUntil:0},utility:{crafts:[],eventTickets:0,ticketPurchases:[],clanTreasury:0,clanLevel:1,roomUpgrade:'basic',roomPurchases:[]}},
    spectatorEvents:[],
    lossLimit:0,
    frozen:{you:false,reason:"",at:0,by:""},
    config:{
      stakeMin:10,stakeMax:1000,payoutCap:0,animMs:2300,edgePct:2,
      feePct:5,cupRakePct:5,trnyRakePct:10,jpFundPct:10,jpFloor:1,jpArm:50,jpPayPct:50,
      nonMainCapPct:20,transferFee:2,transferMin:10,transferCap:500,
      botTopupThreshold:500,botGrowthMax:250,botGrowthIntervalSec:15,botGrowthBatch:1,botArcadePerTick:2,wdMin:3000,wdMax:5000,wdTickChance:0.35,
      vip:VIP_SEED.map(v=>({...v})),
      levelRewards:Object.fromEntries(Array.from({length:49},(_,n)=>[n+2,(n+2)*50])),
      features:{autoMatch:true,quests:true,dailyLogin:true,bots:true,botGrowth:true,maintenance:false,topupPromo:true},
      broadcast:"",
      promotions:[],
      seasonNumber:1, seasonEnds: lastDayOfMonthUTC20(),
      house:{capital:100000,fees:0,catalogFees:0,cupRakes:0,trnyRakes:0,shop:0,xfFees:0,promoCost:0,comps:0,withdrawals:0,playerWithdrawals:0,deposits:0,botDeposits:0,netRevenue:0,netCash:0},
      taps:0, sinks:0,
      audit:[], reviewFlags:[]
    },
    global:{heads:0,tails:0,totalGames:0,jackpots:0},
    ledger:[],botTransfers:[],botTopups:[],catalogLog:[], // capped histories
    withdrawals:{count:0,amount:0,log:[]},
    turbo:1,
    gid:1,tabId:Math.random().toString(36).slice(2)
  };
}
function lastDayOfMonthUTC20(){const d=new Date();return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0,20,0,0);}
function save(){if(applyingRemoteState)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
function load(){
  try{
    const r=localStorage.getItem(SAVE_KEY);
    if(r){
      const p=JSON.parse(r);
      S=Object.assign(defaultState(),p);
      S.wallet=Object.assign(defaultState().wallet,p.wallet||{});
      if((p.v||8)<8.2&&(p.stats?.games||0)===0&&+(p.wallet?.main||0)===5000)S.wallet.main=1000;
      S.v=11.0;
      S.settings=Object.assign(defaultState().settings,p.settings||{});S.settings.accessibility=Object.assign(defaultState().settings.accessibility,(p.settings&&p.settings.accessibility)||{});S.settings.dashboardWidgets=Array.isArray(p.settings&&p.settings.dashboardWidgets)?p.settings.dashboardWidgets:defaultState().settings.dashboardWidgets;S.settings.dashboardSections=Array.isArray(p.settings&&p.settings.dashboardSections)?p.settings.dashboardSections:defaultState().settings.dashboardSections;S.settings.gamePresets=Array.isArray(p.settings&&p.settings.gamePresets)?p.settings.gamePresets:[];if((p.v||0)<10.5&&!S.settings.dashboardWidgets.includes('topups'))S.settings.dashboardWidgets.push('topups');
      S.botActivity=Object.assign(defaultState().botActivity,p.botActivity||{});S.levelMilestones=Object.assign({},p.levelMilestones||{});
      S.services=Object.assign(defaultState().services,p.services||{});S.services.notifications=Object.assign(defaultState().services.notifications,(p.services&&p.services.notifications)||{});S.services.twoFactor=Object.assign(defaultState().services.twoFactor,(p.services&&p.services.twoFactor)||{});S.services.antiCheat=Object.assign(defaultState().services.antiCheat,(p.services&&p.services.antiCheat)||{});S.services.promoClaims=Object.assign({},(p.services&&p.services.promoClaims)||{});
      S.rg=Object.assign(defaultState().rg,p.rg||{});S.rg.depositLimits=Object.assign(defaultState().rg.depositLimits,(p.rg&&p.rg.depositLimits)||{});S.rg.sessionPoints=Array.isArray(p.rg&&p.rg.sessionPoints)?p.rg.sessionPoints:defaultState().rg.sessionPoints;S.rg.deposits=Array.isArray(p.rg&&p.rg.deposits)?p.rg.deposits:defaultState().rg.deposits;S.kyc=Object.assign(defaultState().kyc,p.kyc||{});S.playerWithdrawals=Object.assign(defaultState().playerWithdrawals,p.playerWithdrawals||{});if(!Array.isArray(S.playerWithdrawals.log))S.playerWithdrawals.log=[];S.walletRefs=Object.assign(defaultState().walletRefs,p.walletRefs||{});S.playerName=typeof p.playerName==='string'?p.playerName:'';S.analytics=Object.assign(defaultState().analytics,p.analytics||{});
      S.social=Object.assign(defaultState().social,p.social||{});S.featureGames=Object.assign(defaultState().featureGames,p.featureGames||{});S.featureGames.wheel=Object.assign(defaultState().featureGames.wheel,(p.featureGames&&p.featureGames.wheel)||{});S.featureGames.raffle=Object.assign(defaultState().featureGames.raffle,(p.featureGames&&p.featureGames.raffle)||{});S.featureGames.extended=Object.assign(defaultState().featureGames.extended,(p.featureGames&&p.featureGames.extended)||{});S.featureGames.extended.last=Object.assign({},(p.featureGames&&p.featureGames.extended&&p.featureGames.extended.last)||{});S.featureGames.extended.fishingCollection=Object.assign({},(p.featureGames&&p.featureGames.extended&&p.featureGames.extended.fishingCollection)||{});
      S.engagement=Object.assign(defaultState().engagement,p.engagement||{});S.engagement.battlePass=Object.assign(defaultState().engagement.battlePass,(p.engagement&&p.engagement.battlePass)||{});S.engagement.weekly=Object.assign(defaultState().engagement.weekly,(p.engagement&&p.engagement.weekly)||{});
      S.economyPlus=Object.assign(defaultState().economyPlus,p.economyPlus||{});S.economyPlus.staking=Object.assign(defaultState().economyPlus.staking,(p.economyPlus&&p.economyPlus.staking)||{});S.economyPlus.subscription=Object.assign(defaultState().economyPlus.subscription,(p.economyPlus&&p.economyPlus.subscription)||{});S.economyPlus.boosters=Object.assign(defaultState().economyPlus.boosters,(p.economyPlus&&p.economyPlus.boosters)||{});S.economyPlus.utility=Object.assign(defaultState().economyPlus.utility,(p.economyPlus&&p.economyPlus.utility)||{});
      S.vipUnlockedTier=Math.max(1,p.vipUnlockedTier||1);S.vipBenefits=Object.assign(defaultState().vipBenefits,p.vipBenefits||{});S.vipBenefits.unlockedAt=Object.assign({1:Date.now()},(p.vipBenefits&&p.vipBenefits.unlockedAt)||{});
      S.config=Object.assign(defaultState().config,p.config||{});
      S.frozen=Object.assign(defaultState().frozen,p.frozen||{});
      S.config.stakeMin=Math.max(1,Math.round(S.config.stakeMin||10));
      S.config.stakeMax=Math.max(S.config.stakeMin,Math.round(S.config.stakeMax||1000));
      S.config.payoutCap=Math.max(0,Math.round(S.config.payoutCap||0));
      S.config.animMs=Math.max(200,Math.round(S.config.animMs||2300));
      S.config.edgePct=Math.min(25,Math.max(0,numOr(S.config.edgePct,2)));
      S.config.house=Object.assign(defaultState().config.house,(p.config&&p.config.house)||{});if(S.config.house.deposits==null)S.config.house.deposits=0;if(S.config.house.botDeposits==null)S.config.house.botDeposits=0;
      S.withdrawals=Object.assign(defaultState().withdrawals,p.withdrawals||{});if(!Array.isArray(S.withdrawals.log))S.withdrawals.log=[];
      S.config.features=Object.assign(defaultState().config.features,(p.config&&p.config.features)||{});
      S.config.levelRewards=Object.assign(defaultState().config.levelRewards,(p.config&&p.config.levelRewards)||{});
      S.owned=Object.assign(defaultState().owned,p.owned||{});
      S.equipped=Object.assign(defaultState().equipped,p.equipped||{});
      S.global=Object.assign(defaultState().global,p.global||{});
      S.stats=Object.assign(defaultState().stats,p.stats||{});S.histories=Object.assign(defaultState().histories,p.histories||{});if((p.stats?.metricsVersion||0)<1){const oldGames=p.games||[];S.stats.lifetimeWagered=oldGames.reduce((a,g)=>a+(g.stake||0),0);S.stats.totalPayout=oldGames.reduce((a,g)=>a+Math.max(0,g.payout??(g.delta>0?(g.delta+(g.stake||0)):0)),0);S.stats.maxPayout=oldGames.reduce((a,g)=>Math.max(a,g.payout??(g.delta>0?g.delta+(g.stake||0):0)),0);S.stats.feesPaid=oldGames.reduce((a,g)=>a+(g.fee||0),0);S.stats.metricsVersion=1;}
      S.quests=Object.assign(defaultState().quests,p.quests||{});
      S.quests.claimed=Object.assign({},(p.quests&&p.quests.claimed)||{});
      S.config.vip=(p.config&&p.config.vip&&p.config.vip.length===8)?p.config.vip:VIP_SEED.map(v=>({...v}));
      // migrate: ensure all seeded bots exist (roster may have grown)
      if(Array.isArray(S.bots)){
        BOTS_SEED.forEach(b=>{
          const ex=S.bots.find(x=>x.name===b.name);
          if(!ex)S.bots.push(initializeBotStartingWallet({...b,wins:0,losses:0,net:0,streak:0,bestStreak:0,biggestWin:0,jackpots:0,games:0,shop:b.shop||[],title2:b.title2||""}));
          else{if(ex.losses===undefined)ex.losses=0;if(ex.games===undefined)ex.games=0;if(ex.shop===undefined)ex.shop=[];if(!ex.about)ex.about=b.about;if(!ex.country)ex.country=b.country;if(!ex.title)ex.title=b.title;if(!ex.skin)ex.skin=b.skin;if(ex.jackpots===undefined)ex.jackpots=0;if(ex.bestStreak===undefined)ex.bestStreak=0;if(ex.biggestWin===undefined)ex.biggestWin=0;if(ex.firstTopupDone===undefined)ex.firstTopupDone=false;if(ex.topupCount===undefined)ex.topupCount=0;if(ex.topupTotal===undefined)ex.topupTotal=0;}
        });
        S.bots.forEach(initializeBotStartingWallet);
      }
      // Bot-created Series Cups are public; another bot may complete them.
      S.cups=Array.isArray(S.cups)?S.cups:[];
      S.cups.forEach(c=>{if(c.createdBy==="bot")c.reservedSeat=false;});
      reconcileHouse();
      return;
    }
  }catch(e){console.warn(e)}
  S=defaultState();reconcileHouse();
}
function ledger(type,delta,note){const bal={...S.wallet};S.ledger=S.ledger||[];S.ledger.unshift({t:Date.now(),type,delta:coin(delta),note,balance:coin(bal.main)});if(S.ledger.length>200)S.ledger.pop();}
function audit(action,detail){S.config.audit.unshift({t:Date.now(),who:"player",action,detail});if(S.config.audit.length>50)S.config.audit.pop();}

export function bind(){

}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{audit,cfg,defaultState,houseCashIn,houseCashOut,houseGross,houseNet,houseNetCash,initializeBotStartingWallet,lastDayOfMonthUTC20,ledger,load,reconcileHouse,save});

export {audit,cfg,defaultState,houseCashIn,houseCashOut,houseGross,houseNet,houseNetCash,initializeBotStartingWallet,lastDayOfMonthUTC20,ledger,load,reconcileHouse,save};
