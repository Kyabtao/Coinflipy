const CACHE='tossmatch-v12.0';
const CORE=['./','./index.html','./admin.html','./manifest.webmanifest','./icons/favicon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-512.jpg','./img/logo.jpg','./img/coin-heads.jpg','./img/coin-tails.jpg','./api/openapi.json','./css/admin/app.css','./css/player/app.css','./css/shared/theme.css','./js/admin/banking.js','./js/admin/boot.js','./js/admin/core.js','./js/admin/engine.js','./js/admin/main.js','./js/admin/render.js','./js/admin/sync.js','./js/admin/theme.js','./js/player/boot.js','./js/player/bots.js','./js/player/core.js','./js/player/crypto.js','./js/player/data.js','./js/player/games.js','./js/player/helpers.js','./js/player/main.js','./js/player/misc.js','./js/player/render.js','./js/player/state.js','./js/player/sync.js','./js/player/theme.js','./js/player/wallet.js','./js/shared/runtime.js','./js/shared/theme.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match('./index.html'))));
});
