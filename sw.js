// ICT Gold Bot Pro — Service Worker v4
// Handles background operation, caching, notifications
var CACHE = 'ictbot-v4';
var ASSETS = ['/', '/index.html', '/icon.png', '/badge.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

// Cache-first for assets, network-first for API calls
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('netlify/functions') || url.includes('api.gold-api') || url.includes('yahoo.com') || url.includes('agiliumtrade')) {
    e.respondWith(fetch(e.request).catch(()=>new Response('{"error":"offline"}',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
      if (r.status===200) {
        var clone = r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
      }
      return r;
    }).catch(()=>cached))
  );
});

// Background bot state
var botConfig = null, bgTimer = null, lastPing = 0;

self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'BOT_PING') {
    lastPing  = Date.now();
    botConfig = e.data.config;
    if (!bgTimer) bgTimer = setInterval(bgCheck, 35000);
  }
  if (e.data.type === 'BOT_STOP') {
    if (bgTimer) { clearInterval(bgTimer); bgTimer = null; }
    clearStatusNotif();
  }
});

async function bgCheck() {
  const clients = await self.clients.matchAll({type:'window'});
  const tabAlive = clients.length > 0 && (Date.now() - lastPing < 40000);

  if (tabAlive) {
    updateStatusNotif('🟢 Running', 'Tab active');
    return;
  }

  // Tab backgrounded — fetch price ourselves
  if (!botConfig) return;
  try {
    const r = await fetch('/.netlify/functions/market?url='+encodeURIComponent('https://api.gold-api.com/price/XAU'));
    if (r.ok) {
      const d    = await r.json();
      const price = parseFloat(d.price||0).toFixed(2);
      updateStatusNotif('🟢 BG Active', 'GOLD '+price);
      clients.forEach(c=>c.postMessage({type:'BG_PRICE',price}));
    }
  } catch(e) {
    updateStatusNotif('🟡 BG Mode', 'Waiting…');
  }
}

function updateStatusNotif(status, detail) {
  self.registration.showNotification('⚡ ICT Gold Bot', {
    body: status+' | '+detail,
    icon: '/icon.png', badge: '/badge.png',
    tag: 'ictbot-status',
    renotify: false,      // never re-trigger sound for status updates
    silent: true,         // always silent — status only
    requireInteraction: false, // auto-dismiss status notifications
    actions: [{action:'open',title:'📊 Open'},{action:'stop',title:'⏹ Stop'}]
  }).catch(()=>{});
}

function clearStatusNotif() {
  self.registration.getNotifications({tag:'ictbot-status'})
    .then(ns=>ns.forEach(n=>n.close())).catch(()=>{});
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action==='open'||!e.action) {
    e.waitUntil(self.clients.matchAll({type:'window'}).then(clients=>{
      if (clients.length) return clients[0].focus();
      return self.clients.openWindow('/');
    }));
  }
  if (e.action==='stop') {
    self.clients.matchAll({type:'window'}).then(clients=>clients.forEach(c=>c.postMessage({type:'STOP_BOT'})));
    clearStatusNotif();
  }
});
