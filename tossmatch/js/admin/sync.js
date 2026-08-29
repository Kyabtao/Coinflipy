/* FlipArena admin module — sync */
import "../shared/runtime.js";
import {$,SAVE_KEY,fmt,load,reconcileHouse,render,renderAdminChrome,renderAdminLiveStatus,renderAdminTick,renderDash,renderEcon,renderPeople,renderTopupAnalytics,renderWithdrawals,topupAnalytics} from "./core.js";



export function bind(){
  window.addEventListener("storage",e=>{if(e.key===SAVE_KEY){
    applyingRemoteState=true;lastStorageSyncAt=Date.now();
    try{
      load();
      const tag=document.activeElement&&document.activeElement.tagName;
      // Typing in a field? Only refresh chrome + live widgets so the caret and
      // half-typed values survive. Otherwise refresh the active screen too.
      if(["INPUT","SELECT","TEXTAREA"].includes(tag)){renderAdminChrome();}
      else{render();}
      renderAdminTick();
    }
    finally{applyingRemoteState=false;}renderAdminLiveStatus();
  }});
}
