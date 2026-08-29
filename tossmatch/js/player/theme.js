/* FlipArena player module — theme */
import "../shared/runtime.js";
import {SAVE_KEY} from "./core.js";
import {HISTORY} from "./bots.js";
import {$,fmt,toast} from "./helpers.js";
import {renderHistory} from "./render.js";
import {THEME_PRESETS,applyTheme,clearThemeVars,closePalette,hexToRgb,openPalette,renderThemePresets,saveThemePrefs,shadeRgb,themeName,themePalette} from "../shared/theme.js";



export function bind(){
  $('paletteBtn')&&($('paletteBtn').onclick=openPalette);
  $('paletteClose')&&($('paletteClose').onclick=closePalette);
  $('paletteBg')&&($('paletteBg').onclick=e=>{if(e.target===$('paletteBg'))closePalette();});
  $('pcApply')&&($('pcApply').onclick=()=>{
    const bg=$('pcBg').value,card=$('pcCard').value,accent=$('pcAccent').value,txt=$('pcTxt').value;
    const br=hexToRgb(bg),ta=hexToRgb(txt),ca=hexToRgb(card),aa=hexToRgb(accent);
    const light=!!br&&br.r>200&&br.g>200&&br.b>200;
    const pal={light,bg,bg2:br?shadeRgb(br,-10):'#0e1526',card,card2:ca?shadeRgb(ca,-14):'#0e1a30',line:br?shadeRgb(br,28):'#22304f',line2:br?shadeRgb(br,44):'#2a3a60',txt,mut:ta?shadeRgb(ta,-40):'#93a0bd',mut2:ta?shadeRgb(ta,-70):'#6d7d9d',accent,accent2:aa?shadeRgb(aa,-24):'#e0a52e'};
    S.settings.themeName='custom';S.settings.customPalette=pal;
    applyTheme();saveThemePrefs();renderThemePresets();toast('Custom palette applied.','ok');
  });
  $('pcReset')&&($('pcReset').onclick=()=>{S.settings.themeName='midnight';S.settings.customPalette=null;applyTheme();saveThemePrefs();renderThemePresets();toast('Default theme restored.','ok');});
  $("historyTabs").addEventListener("click",e=>{const b=e.target.closest("[data-history-tab]");if(!b)return;HISTORY.tab=b.dataset.historyTab;HISTORY.page=1;renderHistory();});
  $("historyPrev").onclick=()=>{HISTORY.page=Math.max(1,HISTORY.page-1);renderHistory();};
  $("historyNext").onclick=()=>{HISTORY.page++;renderHistory();};
  $("historySearch").addEventListener("input",e=>{HISTORY.search=e.target.value;HISTORY.page=1;renderHistory();});
  $("historySort").onchange=e=>{HISTORY.sort=e.target.value;HISTORY.page=1;renderHistory();};
  $("historyList").addEventListener("click",e=>{const row=e.target.closest("[data-history-detail]");if(!row)return;const x=(window._historyRenderedRows||[])[+row.dataset.historyDetail];if(!x)return;$("modalContent").innerHTML=`<h3>🕘 ${x.title}</h3><div class="result-banner ${x.amount>=0?'win':'lose'}" style="display:block">${x.result} · ${x.amount>=0?'+':''}${fmt(x.amount)}</div><p class="muted">${x.detail}</p><pre>${JSON.stringify(x.raw,null,2)}</pre><button class="btn btn-primary" onclick="document.getElementById('modalBg').classList.remove('show')">Close</button>`;$("modalBg").classList.add("show");});
  $("historyExport").onclick=()=>{const blob=new Blob([JSON.stringify({games:S.games,histories:S.histories},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tossmatch-player-history.json';a.click();URL.revokeObjectURL(url);};
  /* theme UI wiring (was the tail of the shared engine block) */
  $('paletteBtn')&&($('paletteBtn').onclick=openPalette);
  $('paletteClose')&&($('paletteClose').onclick=closePalette);
  $('paletteBg')&&($('paletteBg').onclick=e=>{if(e.target===$('paletteBg'))closePalette();});
  $('pcApply')&&($('pcApply').onclick=()=>{
    const bg=$('pcBg').value,card=$('pcCard').value,accent=$('pcAccent').value,txt=$('pcTxt').value;
    const br=hexToRgb(bg),ta=hexToRgb(txt),ca=hexToRgb(card),aa=hexToRgb(accent);
    const light=!!br&&br.r>200&&br.g>200&&br.b>200;
    const pal={light,bg,bg2:br?shadeRgb(br,-10):'#0e1526',card,card2:ca?shadeRgb(ca,-14):'#0e1a30',line:br?shadeRgb(br,28):'#22304f',line2:br?shadeRgb(br,44):'#2a3a60',txt,mut:ta?shadeRgb(ta,-40):'#93a0bd',mut2:ta?shadeRgb(ta,-70):'#6d7d9d',accent,accent2:aa?shadeRgb(aa,-24):'#e0a52e'};
    S.settings.themeName='custom';S.settings.customPalette=pal;
    applyTheme();saveThemePrefs();renderThemePresets();toast('Custom palette applied.','ok');
  });
  $('pcReset')&&($('pcReset').onclick=()=>{S.settings.themeName='midnight';S.settings.customPalette=null;applyTheme();saveThemePrefs();renderThemePresets();toast('Default theme restored.','ok');});
  
}
