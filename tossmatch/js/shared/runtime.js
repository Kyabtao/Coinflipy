// FlipArena shared runtime state.
// Cross-module mutable bindings that used to be top-level `let` are held on
// globalThis so every ES module sees the same live binding (assignments in one
// module are visible to the others, exactly like the original single-script app).
globalThis.S=null;
globalThis.activeGame="overunder";
globalThis.applyingRemoteState=false;
globalThis.audioCtx=null;
globalThis.betTimes=[];
globalThis.busy=false;
globalThis.cupFmt="bo3";
globalThis.featureHubsMounted=false;
globalThis.gamesMounted=false;
globalThis.isPrivate=false;
globalThis.lastAdminPulse=0;
globalThis.lastBotTickAt=0;
globalThis.lastProof=null;
globalThis.lastStorageSyncAt=0;
globalThis.lbSort="net";
globalThis.pickedSide=null;
globalThis.pwaInstallPrompt=null;
globalThis.servicesMounted=false;
globalThis.sessionNet=0;
globalThis.shopCat="skins";
globalThis.tickRunning=false;
/* ── Shake-free DOM updates (v13.1) ─────────────────────────────────────────
   patchHTML(el, html): when the new markup has the same element skeleton as
   what is already there, only the changed text/attributes are updated in
   place — no reflow, no flicker, no lost focus or scroll position. When the
   structure genuinely changes (rows added/removed), it falls back to a full
   innerHTML replace. withPatchedDom(fn) routes every innerHTML write inside
   fn through patchHTML, which is how background ticks update live data
   without making the page "shake". */
function faNodeSame(a,b){
  if(a.nodeType!==b.nodeType)return false;
  if(a.nodeType===3||a.nodeType===8)return true;
  if(a.nodeName!==b.nodeName)return false;
  const ac=a.childNodes,bc=b.childNodes;
  if(ac.length!==bc.length)return false;
  for(let i=0;i<ac.length;i++)if(!faNodeSame(ac[i],bc[i]))return false;
  return true;
}
function faMergeNode(a,b){
  if(a.nodeType===3){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return;}
  if(a.nodeType!==1)return;
  const oldAttrs={};
  for(const at of a.attributes)oldAttrs[at.name]=at.value;
  for(const at of b.attributes)if(oldAttrs[at.name]!==at.value)a.setAttribute(at.name,at.value);
  for(const n of Object.keys(oldAttrs))if(!b.hasAttribute(n))a.removeAttribute(n);
  for(let i=0;i<b.childNodes.length;i++)faMergeNode(a.childNodes[i],b.childNodes[i]);
}
let faRealInnerHTMLSet=null;
globalThis.patchHTML=function(el,html){
  if(el.__faLastHtml===html)return;
  el.__faLastHtml=html;
  try{
    const tpl=(el.ownerDocument||document).createElement('template');
    tpl.innerHTML=html;
    if(faSameSkeleton(el,tpl.content)){faMergeInto(el,tpl.content);return;}
  }catch(e){/* fall through to full replace */}
  if(faRealInnerHTMLSet)faRealInnerHTMLSet.call(el,html);else el.innerHTML=html;
};
function faSameSkeleton(el,content){
  const ac=el.childNodes,bc=content.childNodes;
  if(ac.length!==bc.length)return false;
  for(let i=0;i<ac.length;i++)if(!faNodeSame(ac[i],bc[i]))return false;
  return true;
}
function faMergeInto(el,content){
  const bc=content.childNodes;
  for(let i=0;i<bc.length;i++)faMergeNode(el.childNodes[i],bc[i]);
}
globalThis.withPatchedDom=function(fn){
  if(typeof Element==='undefined'){fn();return;}
  const desc=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  if(!faRealInnerHTMLSet)faRealInnerHTMLSet=desc.set;
  Object.defineProperty(Element.prototype,'innerHTML',{
    configurable:true,
    get:function(){return desc.get.call(this);},
    set:function(v){globalThis.patchHTML(this,v);}
  });
  try{fn();}finally{Object.defineProperty(Element.prototype,'innerHTML',desc);}
};
