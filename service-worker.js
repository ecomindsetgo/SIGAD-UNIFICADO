const CACHE='sigad-unificado-v2.2-shell';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sigad-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return; e.respondWith(fetch(e.request).catch(()=> e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))});
