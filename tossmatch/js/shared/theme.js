import "./runtime.js";

/* TossMatch shared theme engine (pure, no DOM wiring here — apps inject the palette UI wiring) */
/* ───── Theme engine v12 (player + admin shared) ───── */
const THEME_PRESETS=[
  {id:'midnight',name:'Midnight Gold',desc:'Deep navy · gold',dots:['#0b1020','#121a2e','#f6c453','#93a0bd']},
  {id:'royal',name:'Royal Violet',desc:'Night violet · purple',dots:['#0d0a1f','#181234','#c084fc','#b1a4d8']},
  {id:'emerald',name:'Emerald Night',desc:'Deep green · mint',dots:['#05130f','#0b241d','#34d399','#8fc8b3']},
  {id:'sunset',name:'Sunset Rose',desc:'Warm rose · coral',dots:['#1a0d14','#2a1420','#fb7185','#d4a3ad']},
  {id:'ocean',name:'Ocean Blue',desc:'Deep sea · sky',dots:['#051426','#0b2540','#38bdf8','#8fbede']},
  {id:'light',name:'Light',desc:'Clean light · amber',dots:['#f5f6fa','#ffffff','#a16207','#5a6781']}
];
function themeName(){return S.settings?.themeName||'midnight';}
function themePalette(){return S.settings?.customPalette||null;}
function hexToRgb(h){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h||'');return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:null;}
function shadeRgb(rgb,amt){return rgb?`rgb(${Math.max(0,Math.min(255,rgb.r+amt))},${Math.max(0,Math.min(255,rgb.g+amt))},${Math.max(0,Math.min(255,rgb.b+amt))})`:'';}
function clearThemeVars(){const cs=document.documentElement.style;['--bg','--bg2','--card','--card2','--line','--line2','--txt','--mut','--mut2','--gold','--gold2','--heads','--gold-rgb','--amb1','--amb2'].forEach(v=>cs.removeProperty(v));}
function applyTheme(){
  const name=themeName(),pal=themePalette();
  const isLight=name==='light'||(pal&&pal.light);
  document.body.classList.toggle('light',isLight);
  document.body.dataset.theme=name||'midnight';
  const cs=document.documentElement.style;
  if(pal){
    const br=hexToRgb(pal.bg),ta=hexToRgb(pal.txt),ca=hexToRgb(pal.card),aa=hexToRgb(pal.accent);
    cs.setProperty('--bg',pal.bg||'#0b1020');
    cs.setProperty('--bg2',pal.bg2||'#0e1526');
    cs.setProperty('--card',pal.card||'#121a2e');
    cs.setProperty('--card2',pal.card2||'#0e1a30');
    cs.setProperty('--line',pal.line||'#22304f');
    cs.setProperty('--line2',pal.line2||'#2a3a60');
    cs.setProperty('--txt',pal.txt||'#e8edf7');
    cs.setProperty('--mut',pal.mut||'#93a0bd');
    cs.setProperty('--mut2',pal.mut2||'#6d7d9d');
    cs.setProperty('--gold',pal.accent||'#f6c453');
    cs.setProperty('--gold2',pal.accent2||'#e0a52e');
    cs.setProperty('--heads',pal.accent||'#f6c453');
    if(aa)cs.setProperty('--gold-rgb',`${aa.r},${aa.g},${aa.b}`);
    if(isLight)cs.setProperty('--amb1','220,226,240'),cs.setProperty('--amb2','235,240,252');
  }else{
    document.documentElement.style.cssText='';
  }
  $('themeBtn')&&($('themeBtn').textContent=isLight?'🌙':'💡');
  $('paletteBtn')&&($('paletteBtn').style.color=name==='custom'?'var(--gold)':'var(--mut)');
}
function openPalette(){
  const el=$('paletteContent');if(!el)return;
  renderThemePresets();
  const pal=themePalette()||{};
  $('pcBg').value=pal.bg||'#0b1020';$('pcCard').value=pal.card||'#121a2e';$('pcAccent').value=pal.accent||'#f6c453';$('pcTxt').value=pal.txt||'#e8edf7';
  $('paletteBg').classList.add('show');
}
function closePalette(){$('paletteBg')&&$('paletteBg').classList.remove('show');}
function saveThemePrefs(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
function renderThemePresets(){
  const cur=themeName();
  $('themePresetGrid').innerHTML=THEME_PRESETS.map(p=>`<div class="theme-preset ${cur===p.id?'active':''}" data-theme-id="${p.id}"><div class="tp-dots">${p.dots.map(d=>`<i style="background:${d}"></i>`).join('')}</div><div class="tp-name">${p.name}</div><div class="tp-desc">${p.desc}</div></div>`).join('')+'<div class="theme-preset '+(cur==='custom'?'active':'')+'" data-theme-id="custom"><div class="tp-dots"><i style="background:#f6c453"></i><i style="background:#c084fc"></i><i style="background:#34d399"></i></div><div class="tp-name">Custom</div><div class="tp-desc">Your palette</div></div>';
  document.querySelectorAll('[data-theme-id]').forEach(el=>el.onclick=()=>{
    const id=el.dataset.themeId;
    if(id==='custom'){S.settings.themeName='custom';S.settings.customPalette=S.settings.customPalette||{};applyTheme();saveThemePrefs();renderThemePresets();return;}
    S.settings.themeName=id;S.settings.customPalette=null;
    applyTheme();saveThemePrefs();renderThemePresets();
    toast(`${THEME_PRESETS.find(p=>p.id===id)?.name||'Theme'} applied.`,'ok');
  });
}


/* expose shared engine symbols to globalThis for legacy/hybrid consumers */
Object.assign(globalThis,{THEME_PRESETS,applyTheme,clearThemeVars,closePalette,hexToRgb,openPalette,renderThemePresets,saveThemePrefs,shadeRgb,themeName,themePalette});

export {THEME_PRESETS,applyTheme,clearThemeVars,closePalette,hexToRgb,openPalette,renderThemePresets,saveThemePrefs,shadeRgb,themeName,themePalette};
