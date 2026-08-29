/* FlipArena admin module — render */
import "../shared/runtime.js";
import {applyTheme} from "../shared/theme.js";
import {$,drawRng,render,syncAdminNavigation} from "./core.js";



export function bind(){
  $("tabs").addEventListener("click",e=>{const b=e.target.closest(".tab");if(!b)return;
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    b.classList.add("active");$("panel-"+b.dataset.tab).classList.add("active");syncAdminNavigation(b.dataset.tab);drawRng();
  });
  $("themeBtn").onclick=()=>{S.settings.themeName=S.settings.themeName==="light"?"midnight":"light";S.settings.customPalette=null;applyTheme();render();};
}
