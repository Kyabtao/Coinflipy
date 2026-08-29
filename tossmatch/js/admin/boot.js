/* TossMatch admin module — boot */
import "../shared/runtime.js";
import {cfg,checkVipMonthReset,load,render,sendAdminBotPulse,syncAdminNavigation} from "./core.js";



export function bind(){
  load();
  checkVipMonthReset();
  if(!cfg().seasonEnds){const d=new Date();cfg().seasonEnds=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0,20,0,0);}
  render();
  syncAdminNavigation('dash');
  sendAdminBotPulse();
}
