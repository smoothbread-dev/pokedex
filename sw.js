var CACHE_NAME = 'pokedex-cache-v2';

var APP_SHELL = [
  './',
  './index.html',
  './js/data.js',
  './js/audio.js',
  './js/game.js',
  './manifest.json',
];

self.addEventListener('install', function (evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (c) { return c.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evt) {
  evt.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (evt) {
  var reqUrl = new URL(evt.request.url);

  if (reqUrl.hostname === 'pokeapi.co') {
    evt.respondWith(networkFirstThenCache(evt.request));
    return;
  }

  if (reqUrl.hostname === 'raw.githubusercontent.com') {
    evt.respondWith(cacheFirstThenNetwork(evt.request));
    return;
  }

  evt.respondWith(networkFirstThenCache(evt.request));
});

function networkFirstThenCache(req) {
  return fetch(req).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
    return res;
  }).catch(function () {
    return caches.match(req);
  });
}

function cacheFirstThenNetwork(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
      return res;
    });
  });
}
