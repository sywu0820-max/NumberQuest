const CACHE='number-quest-v05-2';
const CORE=['./','./index.html','./v04.css','./v05.css','./v05-app.js','./src/v05-core.mjs','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('number-quest-v05-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone();c.put(e.request,copy);return r}).catch(()=>c.match('./index.html')))))});
