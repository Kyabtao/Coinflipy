/* FlipArena player module — misc */
import "../shared/runtime.js";
import {selectSide} from "./games.js";
import {$,addFeed,grantShopItem,randomShopItem,sfxFlip,toast} from "./helpers.js";
import {audit,cfg} from "./state.js";

function checkVipMonthReset(){
  const key=new Date().toISOString().slice(0,7);if(!S.vipMonthKey){S.vipMonthKey=key;return;}if(S.vipMonthKey!==key){S.vipMonthKey=key;S.monthWagered=0;addFeed("💎 VIP month reset to zero — permanent cosmetic rewards and pending rakeback were preserved");audit("vip-month-auto-reset",key);}
}
function checkDailyLogin(){
  if(!cfg().features.dailyLogin)return;
  const today=new Date().toDateString();
  if(S.login.lastDay===today)return;
  const y=new Date(Date.now()-86400000).toDateString();
  if(S.login.lastDay===y)S.login.streak=Math.min(7,S.login.streak+1);else S.login.streak=1;
  let reward=Math.min(175,50+25*(S.login.streak-1));if(S.login.streak===7)reward=250;
  S.wallet.bonus+=reward;cfg().taps+=reward;
  if(S.login.streak===7){const gift=randomShopItem('uncommon');grantShopItem(gift);toast(`🎁 Day 7! +250 BONUS and ${gift?.it?.name||'a cosmetic'}!`,"jp");}
  S.login.lastDay=today;
  toast(`📅 Login streak day ${S.login.streak}! +${reward} bonus 🪙`,"ok");
}

export function bind(){
  $("exportJsonBtn").onclick=()=>{
    const data=JSON.stringify(S.games,null,2);
    const blob=new Blob([data],{type:"application/json"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="tossmatch-games.json";a.click();URL.revokeObjectURL(url);
    toast("📦 Game history exported.","ok");
  };
  document.addEventListener("keydown",e=>{
    if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
    if(e.key==="h"||e.key==="H")selectSide("HEADS");
    if(e.key==="t"||e.key==="T")selectSide("TAILS");
    if(e.key==="r"||e.key==="R"){selectSide(Math.random()<.5?"HEADS":"TAILS");sfxFlip();}
    if(e.key==="p"||e.key==="P")$("postBtn").click();
  });
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{checkDailyLogin,checkVipMonthReset});

export {checkDailyLogin,checkVipMonthReset};
