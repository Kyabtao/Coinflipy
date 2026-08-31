import "./runtime.js";

/* FlipArena shared theme engine (pure, no DOM wiring here — apps inject the palette UI wiring) */
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
const PALETTE_FALLBACK={bg:'#0b1020',card:'#121a2e',accent:'#f6c453',txt:'#e8edf7'};
function setPaletteInput(id,val){const el=$(id);if(el&&val)el.value=val;}
function syncPaletteInputs(){
  const pal=themePalette()||{};
  setPaletteInput('pcBg',pal.bg||PALETTE_FALLBACK.bg);
  setPaletteInput('pcCard',pal.card||PALETTE_FALLBACK.card);
  setPaletteInput('pcAccent',pal.accent||PALETTE_FALLBACK.accent);
  setPaletteInput('pcTxt',pal.txt||PALETTE_FALLBACK.txt);
}
function openPalette(){
  const bg=$('paletteBg');if(!bg||!$('paletteContent'))return;
  renderThemePresets();
  syncPaletteInputs();
  bg.classList.add('show');
  if(bg.setAttribute)bg.setAttribute('aria-hidden','false');
  const first=$('pcApply');if(first&&first.focus)first.focus();
}
function closePalette(){
  const bg=$('paletteBg');if(!bg)return;
  bg.classList.remove('show');
  if(bg.setAttribute)bg.setAttribute('aria-hidden','true');
  const btn=$('paletteBtn');if(btn&&btn.focus)btn.focus();
}
function paletteIsOpen(){const bg=$('paletteBg');return !!bg&&bg.classList.contains('show');}
/* Apply the four custom colour pickers as a full derived palette. */
function applyCustomPalette(){
  const read=(id,fb)=>{const el=$(id);return el&&el.value?el.value:fb;};
  const bg=read('pcBg',PALETTE_FALLBACK.bg),card=read('pcCard',PALETTE_FALLBACK.card);
  const accent=read('pcAccent',PALETTE_FALLBACK.accent),txt=read('pcTxt',PALETTE_FALLBACK.txt);
  const b=hexToRgb(bg),c=hexToRgb(card),a=hexToRgb(accent),t=hexToRgb(txt);
  S.settings=S.settings||{};
  S.settings.themeName='custom';
  S.settings.customPalette={
    bg,card,accent,txt,
    bg2:shadeRgb(b,10),card2:shadeRgb(c,-8),
    line:shadeRgb(c,26),line2:shadeRgb(c,44),
    mut:shadeRgb(t,-62),mut2:shadeRgb(t,-96),
    accent2:shadeRgb(a,-22)
  };
  applyTheme();saveThemePrefs();renderThemePresets();renderNavTheme();
  toast('Custom palette applied.','ok');
}
/* Drop the custom palette and go back to the default preset. */
function resetPalette(){
  S.settings=S.settings||{};
  S.settings.themeName='midnight';S.settings.customPalette=null;
  applyTheme();saveThemePrefs();renderThemePresets();renderNavTheme();syncPaletteInputs();
  toast('Reset to Midnight Gold.','ok');
}
/* Wire the palette modal once per document (idempotent — safe to call again). */
function bindPalette(){
  const bg=$('paletteBg');
  if(!bg||!$('paletteContent'))return;
  if(bg.dataset.paletteWired)return;
  bg.dataset.paletteWired='1';
  const btn=$('paletteBtn');if(btn)btn.onclick=openPalette;
  const close=$('paletteClose');if(close)close.onclick=closePalette;
  const apply=$('pcApply');if(apply)apply.onclick=applyCustomPalette;
  const reset=$('pcReset');if(reset)reset.onclick=resetPalette;
  bg.addEventListener('click',e=>{if(e.target===bg)closePalette();});
  document.addEventListener('keydown',e=>{
    if((e.key==='Escape'||e.key==='Esc')&&paletteIsOpen()){closePalette();}
  });
}
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

/* In-nav theme settings so a theme switcher is reachable from every page/screen. */
function renderNavTheme(){
  const root=$('navThemePresets');if(!root)return;
  const cur=themeName();
  const html=THEME_PRESETS.map(p=>`<button class="nav-theme-btn ${cur===p.id?'active':''}" data-theme-id="${p.id}" title="${p.name} — ${p.desc}"><i style="background:${p.dots[2]}"></i><span>${p.name}</span></button>`).join('');
  if(root.dataset.sig!==html){root.dataset.sig=html;root.innerHTML=html;root.querySelectorAll('[data-theme-id]').forEach(b=>b.onclick=()=>{
    S.settings.themeName=b.dataset.themeId;S.settings.customPalette=null;
    applyTheme();saveThemePrefs();renderNavTheme();renderThemePresets();
    toast(`${THEME_PRESETS.find(p=>p.id===b.dataset.themeId)?.name||'Theme'} applied.`,'ok');
  });}
  const custom=$('navThemeCustom');if(custom&&!custom.dataset.wired){custom.dataset.wired='1';custom.onclick=openPalette;}
}


/* expose shared engine symbols to globalThis for legacy/hybrid consumers */
Object.assign(globalThis,{THEME_PRESETS,applyCustomPalette,applyTheme,bindPalette,clearThemeVars,closePalette,hexToRgb,openPalette,paletteIsOpen,renderNavTheme,renderThemePresets,resetPalette,saveThemePrefs,shadeRgb,syncPaletteInputs,themeName,themePalette});

export {THEME_PRESETS,applyCustomPalette,applyTheme,bindPalette,clearThemeVars,closePalette,hexToRgb,openPalette,paletteIsOpen,renderNavTheme,renderThemePresets,resetPalette,saveThemePrefs,shadeRgb,syncPaletteInputs,themeName,themePalette};
