/* FlipArena player module — wallet */
import "../shared/runtime.js";
import {add,coin,creditBot,creditWallet,debitWallet,pct,sub} from "../shared/money.js";
import {checkProgressAchievements} from "./games.js";
import {$,activePromotions,addFeed,applyPendingDepositLimits,checkDepositLimit,checkRealityReminder,fmt,pushHistory,recordAnalyticsSample,recordDeposit,recordSessionPoint,renderServicesHub,toast} from "./helpers.js";
import {render,renderStats,renderWallet} from "./render.js";
import {audit,cfg,ledger} from "./state.js";

function depositReference(){S.walletRefs=S.walletRefs||{deposit:1};const r="TMD-"+String(S.walletRefs.deposit++).padStart(6,"0");return r;}
function withdrawReference(){S.walletRefs=S.walletRefs||{withdraw:1};const r="TMW-"+String(S.walletRefs.withdraw++).padStart(6,"0");return r;}
function openDepositFlow(){
  const a=Math.round(+$("depositAmt").value),method=$("depositMethod").value;
  if(a<100){toast("Minimum deposit is 100.","err");return;}
  if(cfg().features.maintenance){toast("Maintenance blocks deposits.","err");return;}
  const limitError=checkDepositLimit(a);if(limitError){toast(limitError,"err");return;}
  const first=!S.firstDepositDone,firstBonus=first&&cfg().features.topupPromo!==false?Math.round(a*.5):0;
  const promo=activePromotions().find(p=>p.id===S.services.activeDepositPromo&&p.type==='deposit'&&!S.services.promoClaims[p.id]);
  const campaignBonus=promo?Math.round(a*Math.max(0,promo.amount)/100):0,totalBonus=firstBonus+campaignBonus,credited=a+totalBonus,ref=depositReference();
  $("modalContent").innerHTML=`<h3>💳 Confirm deposit</h3>
    <div class="kv-row"><span class="k">Amount</span><b>${fmt(a)}</b></div>
    <div class="kv-row"><span class="k">Method</span><b>${method}</b></div>
    <div class="kv-row"><span class="k">First-deposit bonus</span><b>${firstBonus?`+${fmt(firstBonus)}`:'—'}</b></div>
    <div class="kv-row"><span class="k">Campaign bonus</span><b>${campaignBonus?`+${fmt(campaignBonus)}`:'—'}</b></div>
    <div class="kv-row"><span class="k">Total credited</span><b>${fmt(credited)}</b></div>
    <div class="kv-row"><span class="k">Reference</span><b>${ref}</b></div>
    <p class="muted">Demo deposit — no real payment is taken and no money leaves your device.</p>
    <div class="game-row"><button class="btn btn-primary" id="depositConfirm">Confirm deposit</button><button class="btn btn-ghost" onclick="document.getElementById('modalBg').classList.remove('show')">Cancel</button></div>`;
  $("modalBg").classList.add("show");
  $("depositConfirm").onclick=()=>{
    if(window._bankBusy){toast("A banking request is already processing.","err");return;}
    window._bankBusy=true;
    $("modalContent").innerHTML=`<h3>💳 Processing deposit</h3><div class="muted">${method} · ${fmt(a)} · ${ref} · processing…</div><div class="result-banner" style="display:block;margin-top:12px">⏳ Processing…</div>`;
    setTimeout(()=>{
      creditWallet({main:a,bonus:totalBonus},"Deposit "+ref);cfg().taps=add(cfg().taps||0,add(a,totalBonus));cfg().house.promoCost+=totalBonus;cfg().house.deposits=(cfg().house.deposits||0)+a;S.firstDepositDone=true;
      recordDeposit(a,{firstBonus,campaignBonus,totalBonus,credited,campaignId:promo?.id||'',method,reference:ref,status:'COMPLETED',processingMs:1100});
      ledger('deposit',a,`Deposit ${ref} · ${method}${firstBonus?' + first bonus':''}${campaignBonus?' + campaign '+promo.id:''}`);audit("deposit",`${a} via ${method} · ${ref} · bonus ${totalBonus}`);
      if(promo){S.services.promoClaims[promo.id]={t:Date.now(),amount:campaignBonus,deposit:a};S.services.activeDepositPromo="";}
      pushHistory('economy',{title:'Deposit',detail:`${method} · ${ref}`,result:'COMPLETED',amount:credited});
      addFeed(`💳 <b>You</b> deposited ${fmt(a)} via ${method}${totalBonus?` + ${fmt(totalBonus)} bonus`:''}`);
      $("modalContent").innerHTML=`<h3>✅ Deposit receipt</h3>
        <div class="result-banner win" style="display:block">${fmt(a)} credited · total ${fmt(credited)}</div>
        <div class="kv-row"><span class="k">Reference</span><b>${ref}</b></div>
        <div class="kv-row"><span class="k">Method</span><b>${method}</b></div>
        <div class="kv-row"><span class="k">Status</span><b><span class="ttl-badge">COMPLETED</span></b></div>
        <div class="kv-row"><span class="k">Processing time</span><b>1.1s (demo)</b></div>
        <div class="kv-row"><span class="k">New MAIN / BONUS</span><b>${fmt(S.wallet.main)} / ${fmt(S.wallet.bonus)}</b></div>
        <p class="muted">Demo deposit — play coins only, never recognised as house revenue.</p>
        <button class="btn btn-primary" onclick="document.getElementById('modalBg').classList.remove('show')">Done</button>`;
      renderWallet();renderStats();renderServicesHub();render();window._bankBusy=false;
    },1100);
  };
}
function openWithdrawFlow(){
  const a=Math.round(+$("withdrawAmt").value),method=$("withdrawMethod").value,kyc=S.kyc||{verified:false};
  if(a<100){toast("Minimum withdrawal is 100.","err");return;}
  if(cfg().features.maintenance){toast("Maintenance blocks withdrawals.","err");return;}
  if(S.wallet.main<a){toast("Not enough MAIN.","err");return;}
  $("modalContent").innerHTML=`<h3>🏧 Withdraw</h3>
    <div class="kv-row"><span class="k">Amount</span><b>${fmt(a)}</b></div>
    <div class="kv-row"><span class="k">Method</span><b>${method}</b></div>
    <div class="kv-row"><span class="k">Available MAIN</span><b>${fmt(S.wallet.main)}</b></div>
    <div class="kv-row"><span class="k">KYC verification</span><b>${kyc.verified?`✓ Verified${kyc.name?' · '+kyc.name:''}`:'Required (demo)'}</b></div>
    ${kyc.verified?'':`<div class="section-title">Verify your identity (demo)</div>
      <p class="muted">Withdrawals require KYC before processing.</p>
      <input class="stake-input sm" id="kycName" placeholder="Full name (demo)" style="width:100%;margin-bottom:6px"/>
      <select class="stake-input sm" id="kycDoc" style="width:100%;margin-bottom:8px"><option>Passport</option><option>National ID</option><option>Bank card</option></select>
      <button class="btn btn-ghost" id="kycVerify">Verify KYC</button>`}
    <div class="game-row" style="margin-top:10px"><button class="btn btn-primary" id="withdrawConfirm" ${kyc.verified?'':'disabled'}>Request withdrawal</button><button class="btn btn-ghost" onclick="document.getElementById('modalBg').classList.remove('show')">Cancel</button></div>`;
  $("modalBg").classList.add("show");
  if(!kyc.verified){
    $("kycVerify").onclick=()=>{const name=$("kycName").value.trim();if(!name){toast("Enter your name.","err");return;}S.kyc={verified:true,verifiedAt:Date.now(),name,docType:$("kycDoc").value};audit('kyc-verify',`${name} · ${$("kycDoc").value} (demo)`);toast("KYC verified (demo).","ok");renderWallet();openWithdrawFlow();};
  }else{
    $("withdrawConfirm").onclick=()=>{
      if(window._bankBusy){toast("A banking request is already processing.","err");return;}
      window._bankBusy=true;
      const ref=withdrawReference();
      $("modalContent").innerHTML=`<h3>🏧 Processing withdrawal</h3><div class="muted">${method} · ${fmt(a)} · ${ref} · processing…</div><div class="result-banner" style="display:block;margin-top:12px">⏳ Processing…</div>`;
      setTimeout(()=>{
        const wd=debitWallet({main:a},"Withdrawal "+ref);
        if(!wd.ok){toast(wd.error||"Not enough MAIN.","err");$("modalBg").classList.remove("show");window._bankBusy=false;return;}
        S.playerWithdrawals=S.playerWithdrawals||{count:0,amount:0,log:[]};S.playerWithdrawals.log=S.playerWithdrawals.log||[];
        S.playerWithdrawals.log.unshift({t:Date.now(),amount:a,method,reference:ref,status:'COMPLETED',kyc:S.kyc?.name||''});if(S.playerWithdrawals.log.length>200)S.playerWithdrawals.log.length=200;
        S.playerWithdrawals.count=(S.playerWithdrawals.count||0)+1;S.playerWithdrawals.amount=(S.playerWithdrawals.amount||0)+a;
        cfg().house.playerWithdrawals=(cfg().house.playerWithdrawals||0)+a;cfg().sinks=(cfg().sinks||0)+a;
        ledger('withdraw',-a,`Withdraw ${ref} · ${method}`);audit("withdraw",`${a} via ${method} · ${ref}`);
        pushHistory('economy',{title:'Withdrawal',detail:`${method} · ${ref}`,result:'COMPLETED',amount:-a});
        addFeed(`🏧 <b>You</b> withdrew ${fmt(a)} via ${method}`);
        $("modalContent").innerHTML=`<h3>✅ Withdrawal receipt</h3>
          <div class="result-banner win" style="display:block">${fmt(a)} withdrawn via ${method}</div>
          <div class="kv-row"><span class="k">Reference</span><b>${ref}</b></div>
          <div class="kv-row"><span class="k">Status</span><b><span class="ttl-badge">COMPLETED</span></b></div>
          <div class="kv-row"><span class="k">KYC</span><b>${S.kyc?.name||'—'}</b></div>
          <div class="kv-row"><span class="k">New MAIN</span><b>${fmt(S.wallet.main)}</b></div>
          <p class="muted">Demo withdrawal — no real funds are moved and no money leaves your device.</p>
          <button class="btn btn-primary" onclick="document.getElementById('modalBg').classList.remove('show')">Done</button>`;
        renderWallet();renderStats();render();window._bankBusy=false;
      },1100);
    };
  }
}

export function bind(){
  $("parkBtn").onclick=()=>{const a=coin($("bankAmt").value);if(a<10){toast("Invalid.","err");return;}
    const park=debitWallet({main:a},"Park to vault");if(!park.ok){toast(park.error||"Invalid.","err");return;}
    creditWallet({bank:a},"Park to vault");toast(`Parked ${fmt(a)}.`,"ok");render();};
  $("unparkBtn").onclick=()=>{const a=coin($("bankAmt").value);if(a<10){toast("Invalid.","err");return;}
    const un=debitWallet({bank:a},"Unpark from vault");if(!un.ok){toast(un.error||"Invalid.","err");return;}
    creditWallet({main:a},"Unpark from vault");toast(`Unparked ${fmt(a)}.`,"ok");render();};
  $("depositBtn").onclick=openDepositFlow;
  $("withdrawBtn").onclick=openWithdrawFlow;
  $("refApplyBtn").onclick=()=>{const code=$("refApply").value.trim().toUpperCase();if(!code||S.referredBy){toast(S.referredBy?"Already referred.":"Enter a code.","err");return;}if(code===S.referralCode){toast("Can't refer yourself.","err");return;}S.referredBy=code;toast("Referral applied — your friend earns 5% of your fees.","ok");render();};
  $("xfBtn").onclick=()=>{
    const today=new Date().toDateString();if(S.transferDay!==today){S.transferDay=today;S.transferToday=0;}
    const a=Math.round(+$("xfAmt").value);
    if(a<cfg().transferMin){toast("Min 10.","err");return;}
    if(S.transferToday+a>cfg().transferCap){toast("Daily cap 500.","err");return;}
    if(S.wallet.main<a){toast("Not enough MAIN.","err");return;}
    const fee=pct(a,cfg().transferFee);
    const sent=debitWallet({main:a},"Peer transfer");if(!sent.ok){toast(sent.error||"Not enough MAIN.","err");return;}
    S.transferToday=add(S.transferToday||0,a);
    const bot=S.bots[Math.floor(Math.random()*S.bots.length)];creditBot(bot,sub(a,fee));
    cfg().house.xfFees=(cfg().house.xfFees||0)+fee;cfg().house.netRevenue+=fee;cfg().sinks+=fee;S.transferCount=(S.transferCount||0)+1;checkProgressAchievements();
    toast(`Sent ${fmt(a-fee)} to ${bot.name} (fee ${fmt(fee)}).`,"ok");addFeed(`💸 <b>You</b> transferred ${fmt(a-fee)} to ${bot.name}`);render();
  };
  $("setLossBtn").onclick=()=>{S.lossLimit=Math.round(+$("lossLim").value);toast(S.lossLimit?`Session loss limit set to ${S.lossLimit}.`:"Loss limit removed.","ok");render();};
  $("selfExBtn").onclick=()=>{if(S.rg.selfExPermanent||S.rg.selfExUntil>Date.now()){toast("An exclusion is already active and cannot be ended early.","err");return;}S.rg.selfExUntil=Date.now()+60000;S.rg.selfExReason="Wallet quick lock";S.settings.autoRebet=false;toast("⛔ Durable demo exclusion active for 60 seconds.","err");renderServicesHub();render();};
  setInterval(()=>{recordSessionPoint();checkRealityReminder();applyPendingDepositLimits();recordAnalyticsSample();render();},60000);
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{depositReference,openDepositFlow,openWithdrawFlow,withdrawReference});

export {depositReference,openDepositFlow,openWithdrawFlow,withdrawReference};
