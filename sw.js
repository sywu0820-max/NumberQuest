const CACHE='number-quest-v06-1';
const CORE=['./','./index.html','./v04.css','./v05.css','./v06.css','./v06-app.js','./src/v06-core.mjs','./src/v05-core.mjs','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('number-quest-v06-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone();c.put(e.request,copy);return r}).catch(()=>c.match('./index.html')))))});
