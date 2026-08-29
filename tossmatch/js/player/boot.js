/* TossMatch player module — boot */
import "../shared/runtime.js";
import {applyVipUnlocks} from "./bots.js";
import {checkProgressAchievements,seedBotBets,seedBotCatalogBets,selectSide} from "./games.js";
import {$,addFeed,applyDeepLink,fmt,syncPlayerNavigation} from "./helpers.js";
import {checkDailyLogin,checkVipMonthReset} from "./misc.js";
import {render,syncTurboBtn} from "./render.js";
import {cfg,load,save} from "./state.js";
import {claimBotEngineLeadership,ensureAllBotsFirstTopups,runCoordinatedBotTick} from "./sync.js";

let bc=null;


export function bind(){
  bc=$("broadcast");
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pwaInstallPrompt=e;});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  load();
  checkVipMonthReset();
  applyVipUnlocks(false);
  checkProgressAchievements();
  if(claimBotEngineLeadership()){const activated=ensureAllBotsFirstTopups('Required first top-up before Player activation');if(activated)save();}
  checkDailyLogin();
  seedBotBets();
  seedBotCatalogBets(10);
  if(!S.feed.length){addFeed("👋 Welcome to TossMatch v11.0 — post a bet!");addFeed("🎰 Jackpot armed at "+fmt(S.jackpot));}
  selectSide("HEADS");
  render();
  syncPlayerNavigation('home');
  applyDeepLink();
  syncTurboBtn();
  setInterval(()=>{if(Date.now()-lastAdminPulse>5000)runCoordinatedBotTick('player-interval');},2200);
  runCoordinatedBotTick('player-boot');
  setInterval(()=>save(),4000);
  if(!cfg().broadcast){bc.innerHTML="📣 Play coins only · H/T pick · P post · R random · open 🛡️ Admin to control rates & tournaments";bc.classList.add("show");setTimeout(()=>bc.classList.remove("show"),9000);}
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{bc});

export {bc};
