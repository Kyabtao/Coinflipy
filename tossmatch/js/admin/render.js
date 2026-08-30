/* FlipArena admin module — render */
import "../shared/runtime.js";
import {applyTheme} from "../shared/theme.js";
import {$,closeAdminNavDrawer,drawRng,render,renderAdminChrome,renderAdminTab,resetGameParams,saveGameParams,setAdminActiveTab,syncAdminNavigation} from "./core.js";



export function bind(){
  $("tabs").addEventListener("click",e=>{const b=e.target.closest(".tab");if(!b)return;
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    b.classList.add("active");$("panel-"+b.dataset.tab).classList.add("active");
    // Targeted refresh: only the active Admin screen is repainted; a chrome pass
    // keeps the header KPIs live. No monolithic full-screen re-render.
    setAdminActiveTab(b.dataset.tab);syncAdminNavigation(b.dataset.tab);
    renderAdminTab(b.dataset.tab);renderAdminChrome();drawRng();
    try{closeAdminNavDrawer();}catch(e){}
  });
  const sg=$("saveGameParams");if(sg)sg.onclick=saveGameParams;
  const rg=$("resetGameParams");if(rg)rg.onclick=resetGameParams;
  $("themeBtn").onclick=()=>{S.settings.themeName=S.settings.themeName==="light"?"midnight":"light";S.settings.customPalette=null;applyTheme();render();};
}
