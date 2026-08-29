/* FlipArena admin module — banking */
import "../shared/runtime.js";
import {add,coin,creditWallet,debitWallet,ledgerAudit,sub} from "../shared/money.js";
import {$,SAVE_KEY,audit,cfg,fmt,houseCashIn,houseCashOut,houseGross,houseNet,houseNetCash,processBotWithdrawals,reconcileHouse,render,save,toast,topupAnalytics} from "./core.js";

function dl(filename,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}
function adminAdjustWallet(){
  const key=$("walletAdjKey").value,amt=coin($("walletAdjAmt").value);
  if(!S.wallet||!["main","bonus","bank","referral","rakeback"].includes(key)){toast("Invalid wallet key.");return;}
  if(!amt){toast("Amount must be non-zero.");return;}
  // Every Admin credit/debit runs through the shared money module so the
  // zero-negative-balance invariant and the integer-only rule always hold.
  if(amt>0){creditWallet({[key]:amt},"Admin "+key.toUpperCase()+" credit");}
  else{
    const res=debitWallet({[key]:Math.abs(amt)},"Admin "+key.toUpperCase()+" debit");
    if(!res.ok){toast(res.error||"Adjustment rejected.");return;}
  }
  if(amt>0)cfg().taps=add(cfg().taps||0,amt);else if(cfg().sinks!==undefined)cfg().sinks=add(cfg().sinks||0,Math.abs(amt));
  S.ledger=S.ledger||[];S.ledger.unshift({t:Date.now(),type:'admin-adjust',delta:amt,note:`Admin ${key.toUpperCase()} adjustment`,balance:S.wallet.main});if(S.ledger.length>200)S.ledger.length=200;
  audit("wallet-adjust",`${key.toUpperCase()} ${amt>=0?'+':''}${fmt(amt)}`);
  const rep=ledgerAudit();if(!rep.ok)toast("Ledger warning: "+rep.issues[0],"err");
  reconcileHouse();save();render();
}
function adminVerifyKyc(){S.kyc=Object.assign(S.kyc||{verified:false},{verified:true,verifiedAt:Date.now(),name:S.kyc?.name||'Admin verified',docType:S.kyc?.docType||'Admin'});audit("kyc-verify-admin","Verified demo player KYC (demo)");save();render();}
function adminResetKyc(){S.kyc={verified:false,verifiedAt:0,name:"",docType:""};audit("kyc-reset-admin","Reset demo player KYC (demo)");save();render();}
function adminReverseDeposit(ref){
  const dep=(S.rg?.deposits||[]).find(x=>x.reference===ref);if(!dep){toast("Deposit record not found.");return;}
  if(!confirm(`Reverse deposit ${ref}? This removes ${fmt(dep.base)} MAIN and ${fmt(dep.bonus)} BONUS from the player.`))return;
  const idx=(S.rg.deposits||[]).indexOf(dep);if(idx>=0)S.rg.deposits.splice(idx,1);
  const base=+((dep.base??dep.amount)||0),bonus=+(dep.bonus??((+(dep.firstBonus||0))+(+(dep.campaignBonus||0))));
  S.wallet.main=Math.max(0,S.wallet.main-base);S.wallet.bonus=Math.max(0,S.wallet.bonus-bonus);
  cfg().taps=Math.max(0,(cfg().taps||0)-(base+bonus));cfg().house.promoCost=Math.max(0,(cfg().house.promoCost||0)-bonus);cfg().house.deposits=Math.max(0,(cfg().house.deposits||0)-base);
  if(dep.campaignId&&S.services?.promoClaims)delete S.services.promoClaims[dep.campaignId];
  S.firstDepositDone=(S.rg.deposits||[]).some(d=>d.firstBonus>0);
  S.ledger=S.ledger||[];S.ledger.unshift({t:Date.now(),type:'deposit-reversal',delta:-(base+bonus),note:`Reverse deposit ${ref} · ${dep.method||'wallet'}`,balance:S.wallet.main});if(S.ledger.length>200)S.ledger.length=200;
  audit("deposit-reversal",`Reversed ${ref} · base ${base} · bonus ${bonus}`);
  reconcileHouse();save();render();
}
function adminReverseWithdraw(ref){
  const pwd=S.playerWithdrawals||{log:[]};const idx=(pwd.log||[]).findIndex(x=>x.reference===ref);if(idx<0){toast("Withdrawal record not found.");return;}
  const rec=pwd.log[idx];if(!confirm(`Reverse withdrawal ${ref}? ${fmt(rec.amount)} returns to MAIN.`))return;
  pwd.log.splice(idx,1);pwd.count=Math.max(0,(pwd.count||0)-1);pwd.amount=Math.max(0,(pwd.amount||0)-(rec.amount||0));
  S.wallet.main=Math.round((S.wallet.main||0)+(rec.amount||0));
  cfg().house.playerWithdrawals=Math.max(0,(cfg().house.playerWithdrawals||0)-(rec.amount||0));
  cfg().sinks=Math.max(0,(cfg().sinks||0)-(rec.amount||0));
  S.ledger=S.ledger||[];S.ledger.unshift({t:Date.now(),type:'withdraw-reversal',delta:rec.amount,note:`Reverse withdrawal ${ref} · ${rec.method||'—'}`,balance:S.wallet.main});if(S.ledger.length>200)S.ledger.length=200;
  audit("withdraw-reversal",`Reversed ${ref} · returned ${rec.amount}`);
  reconcileHouse();save();render();
}
function exportBanking(){
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const dep=(S.rg?.deposits||[]).map(x=>['deposit',new Date(x.t).toISOString(),x.method||'Wallet',x.reference||'',x.base||0,x.firstBonus||0,x.campaignBonus||0,x.bonus||0,x.credited??0,x.status||'completed']);
  const wd=(S.playerWithdrawals?.log||[]).map(x=>['withdraw',new Date(x.t).toISOString(),x.method||'',x.reference||'',x.amount||0,0,0,0,x.amount||0,x.status||'completed']);
  const rows=[['Type','When','Method','Reference','Base','First bonus','Campaign bonus','Total bonus','Credited/Amount','Status'],...dep,...wd];
  dl('tossmatch-player-banking.csv',rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');toast('Player banking CSV exported.');
}
function exportRevenue(){
  const h=cfg().house,gross=houseGross(),net=houseNet(),cin=houseCashIn(),cout=houseCashOut(),ncash=houseNetCash();
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=[['Metric','Value','Treatment'],['Fees',h.fees||0,'REVENUE'],['Catalog fees',h.catalogFees||0,'REVENUE'],['Cup rakes',h.cupRakes||0,'REVENUE'],['Tournament rakes',h.trnyRakes||0,'REVENUE'],['Shop/commerce',h.shop||0,'REVENUE'],['Transfer fees',h.xfFees||0,'REVENUE'],['Auction fees',h.auctionFees||0,'REVENUE'],['Gross revenue',gross,'REVENUE'],['Promo cost',h.promoCost||0,'COST'],['Comps',h.comps||0,'COST'],['Rakeback paid',h.rakebackPaid||0,'COST'],['Referral payouts',h.referralCost||0,'COST'],['Net revenue (NGR)',net,'NGR'],['Cash in — player deposits',h.deposits||0,'FUNDING'],['Cash in — bot deposits',h.botDeposits||0,'FUNDING'],['Cash in total',cin,'FUNDING'],['Cash out — bot withdrawals',h.withdrawals||0,'CASH-OUT'],['Cash out — player withdrawals',h.playerWithdrawals||0,'CASH-OUT'],['Cash out total',cout,'CASH-OUT'],['Net cash flow',ncash,'CASH-FLOW'],['Jackpot pool',S.jackpot||0,'LIABILITY'],['Taps (created)',cfg().taps||0,'ECONOMY'],['Sinks (removed)',cfg().sinks||0,'ECONOMY'],['House capital',h.capital||0,'ECONOMY'],['House bankroll',(h.capital||0)+net,'ECONOMY']];
  dl('tossmatch-revenue.csv',rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');toast('Revenue summary CSV exported.');
}

export function bind(){
  $("wdRun").onclick=()=>{const r=processBotWithdrawals();toast(r.n?("Paid "+r.n+" withdrawals · revenue −"+fmt(r.coins)):"No bot is at the trigger yet.");render();save();};
  $("exportWd").onclick=()=>{const w=S.withdrawals||{log:[]};const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['When','Bot','Amount','Kept MAIN','Status'],...(w.log||[]).map(x=>[new Date(x.t||0).toISOString(),x.name,x.amount,x.keep,x.status||'paid'])];dl('tossmatch-withdrawals.csv',rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');toast('Withdrawals CSV exported.');};
  $("walletAdjBtn").onclick=adminAdjustWallet;
  $("kycVerifyAdmin").onclick=adminVerifyKyc;
  $("kycResetAdmin").onclick=adminResetKyc;
  $("exportBanking").onclick=exportBanking;
  $("exportRevenue").onclick=exportRevenue;
  $("exportTopupStats").onclick=()=>{const a=topupAnalytics(),q=v=>'"'+String(v??'').replace(/"/g,'""')+'"',rows=[['Type','When','Player/Bot','Base','Starting bonus','First promo','Campaign bonus','Total bonus','Credited','Campaign/Reason'],...a.player.map(x=>['Player',new Date(x.t).toISOString(),'Player',x.base,0,x.firstBonus,x.campaignBonus,x.bonus,x.credited,x.campaignId||x.source]),...a.bots.map(x=>['Bot',new Date(x.t).toISOString(),x.bot,x.base,x.startingBonus,x.firstPromo,0,x.bonus,x.credited,x.reason||''])];dl('tossmatch-topup-analytics.csv',rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');toast('Top-up analytics CSV exported.');};
  $("exportLedger").onclick=()=>{
    const rows=[["timestamp","type","delta","note","main_balance"]].concat(S.ledger.map(l=>[new Date(l.t).toISOString(),l.type,l.delta,l.note||"",l.balance]));
    const csv=rows.map(r=>r.map(c=>`"${(""+c).replace(/"/g,'""')}"`).join(",")).join("\n");
    dl("tossmatch-ledger.csv",csv,"text/csv");toast("Ledger CSV exported.");
  };
  $("exportGames").onclick=()=>{dl("tossmatch-games.json",JSON.stringify(S.games,null,2),"application/json");toast("Games JSON exported.");};
  $("exportState").onclick=()=>{dl("tossmatch-state.json",JSON.stringify(S,null,2),"application/json");toast("Full state exported.");};
  $("resetAll").onclick=()=>{if(confirm("Wipe ALL demo data? This cannot be undone.")){localStorage.removeItem(SAVE_KEY);toast("Reset — reload player app to start fresh.");setTimeout(()=>location.reload(),800);}};
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{adminAdjustWallet,adminResetKyc,adminReverseDeposit,adminReverseWithdraw,adminVerifyKyc,dl,exportBanking,exportRevenue});

export {adminAdjustWallet,adminResetKyc,adminReverseDeposit,adminReverseWithdraw,adminVerifyKyc,dl,exportBanking,exportRevenue};
