/* FlipArena admin module — sync */
import "../shared/runtime.js";
import {$,SAVE_KEY,fmt,load,reconcileHouse,render,renderAdminChrome,renderAdminLiveStatus,renderDash,renderEcon,renderPeople,renderTopupAnalytics,renderWithdrawals,topupAnalytics} from "./core.js";



export function bind(){
  window.addEventListener("storage",e=>{if(e.key===SAVE_KEY){
    applyingRemoteState=true;lastStorageSyncAt=Date.now();
    try{load();const tag=document.activeElement&&document.activeElement.tagName;if(!["INPUT","SELECT","TEXTAREA"].includes(tag))render();else{const h=reconcileHouse();$("hNet").textContent=fmt(h.netRevenue);$("hTopups").textContent=fmt(topupAnalytics().combined.base);$("hPool").textContent=fmt(S.jackpot);$("hGames").textContent=fmt(S.global.totalGames);renderAdminChrome();renderDash();renderEcon();renderTopupAnalytics();renderWithdrawals();renderPeople();}}
    finally{applyingRemoteState=false;}renderAdminLiveStatus();
  }});
}
