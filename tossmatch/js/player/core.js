/* FlipArena player module — _top */
import "../shared/runtime.js";

const SAVE_KEY="tossmatch_v8", TAB_KEY="tossmatch_tab_"+(sessionStorage.tabId||(sessionStorage.tabId=Math.random().toString(36).slice(2)));
const BOT_CHANNEL_NAME="tossmatch_bot_live_v1",SIM_LEADER_KEY="tossmatch_bot_leader_v1",SIM_TAB_ID="player-"+(sessionStorage.botEngineId||(sessionStorage.botEngineId=Math.random().toString(36).slice(2)));
const botLiveChannel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel(BOT_CHANNEL_NAME):null;
const STAKE_MIN=10, STAKE_CAP_PCT=20;

export function bind(){
  "use strict";
}


/* expose top-level symbols to globalThis so legacy inline handlers and the shared theme engine can resolve them */
Object.assign(globalThis,{BOT_CHANNEL_NAME,SAVE_KEY,SIM_LEADER_KEY,SIM_TAB_ID,STAKE_CAP_PCT,STAKE_MIN,TAB_KEY,botLiveChannel});

export {BOT_CHANNEL_NAME,SAVE_KEY,SIM_LEADER_KEY,SIM_TAB_ID,STAKE_CAP_PCT,STAKE_MIN,TAB_KEY,botLiveChannel};
