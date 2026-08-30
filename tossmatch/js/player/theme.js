/* FlipArena player module — theme */
import "../shared/runtime.js";
import {SAVE_KEY} from "./core.js";
import {HISTORY} from "./bots.js";
import {$,fmt,toast} from "./helpers.js";
import {renderHistory} from "./render.js";
import {THEME_PRESETS,applyTheme,closePalette,openPalette,saveThemePrefs,themeName} from "../shared/theme.js";

/* Theme settings UI was removed from every page. The header icon buttons stay:
   #themeBtn toggles light/midnight (bound in render.js) and #paletteBtn cycles
   through the shared presets — no embedded grids or palette modal. */
function cycleTheme(){
  const presets=THEME_PRESETS;
  const i=Math.max(0,presets.findIndex(p=>p.id===themeName()));
  const next=presets[(i+1)%presets.length];
  S.settings.themeName=next.id;
  S.settings.customPalette=null;
  applyTheme();
  saveThemePrefs();
  toast(`${next.name} applied.`,'ok');
}

export function bind(){
  $('paletteBtn')&&($('paletteBtn').onclick=cycleTheme);
  $("historyTabs").addEventListener("click",e=>{const b=e.target.closest("[data-history-tab]");if(!b)return;HISTORY.tab=b.dataset.historyTab;HISTORY.page=1;renderHistory();});
  $("historyPrev").onclick=()=>{HISTORY.page=Math.max(1,HISTORY.page-1);renderHistory();};
  $("historyNext").onclick=()=>{HISTORY.page++;renderHistory();};
  $("historySearch").addEventListener("input",e=>{HISTORY.search=e.target.value;HISTORY.page=1;renderHistory();});
  $("historySort").onchange=e=>{HISTORY.sort=e.target.value;HISTORY.page=1;renderHistory();};
  $("historyList").addEventListener("click",e=>{const row=e.target.closest("[data-history-detail]");if(!row)return;const x=(window._historyRenderedRows||[])[+row.dataset.historyDetail];if(!x)return;$("modalContent").innerHTML=`<h3>🕘 ${x.title}</h3><div class="result-banner ${x.amount>=0?'win':'lose'}" style="display:block">${x.result} · ${x.amount>=0?'+':''}${fmt(x.amount)}</div><p class="muted">${x.detail}</p><pre>${JSON.stringify(x.raw,null,2)}</pre><button class="btn btn-primary" onclick="document.getElementById('modalBg').classList.remove('show')">Close</button>`;$("modalBg").classList.add("show");});
  $("historyExport").onclick=()=>{const blob=new Blob([JSON.stringify({games:S.games,histories:S.histories},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tossmatch-player-history.json';a.click();URL.revokeObjectURL(url);};
}
