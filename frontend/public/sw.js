const CACHE_NAME = 'sattlio-v5';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install — cache statičnih resursa. NAPOMENA: self.skipWaiting() se namjerno
// NE poziva ovdje - nova verzija ceka (waiting) dok korisnik ne potvrdi
// osvjezavanje (vidi UpdateBanner.tsx), umjesto da tiho preuzme kontrolu.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Poruka od UpdateBanner.tsx kad korisnik klikne "Osvježi"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate — ukloni stari cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strane domene (Google Fonts i sl.) - pusti browseru da ih normalno
  // ucita. Nasa fetch()/cache fallback logika ispod je bila hvatala i njih,
  // a kad bi CSP connect-src blokirao SW-ov fetch, fallback je vracao
  // keširani index.html KAO da je to trazeni resurs (npr. font CSS) - browser
  // bi onda odbio "text/html" kao stylesheet. Same-origin zahtjevi i dalje
  // idu kroz strategije ispod.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ne-GET zahtjevi (POST/PUT/DELETE) - pusti browseru direktno, bez SW
  // posrednistva. Otkriveno 25.08.2026: kad SW presretne POST /auth/login
  // (respondWith(fetch(request))), Chrome ume da NE primijeni Set-Cookie iz
  // takvog "kroz SW" odgovora (DevTools ga oznaci "from service worker"),
  // pa je refresh cookie tiho nestajao i korisnik bi bio izlogovan cim
  // istekne access token (~60 min). Cache/keriranje ionako nema smisla za
  // POST/PUT/DELETE, pa nema sta da se izgubi ovim ranim izlaskom.
  if (request.method !== 'GET') {
    return;
  }

  // Upload-ovane slike (avatari, logo, cover) - fajl na datom URL-u se NIKAD
  // ne mijenja (novi upload = nova nasumicna putanja), pa je cache-first
  // bezbjedno i mnogo brze, radi i offline nakon prve posjete.
  if (url.pathname.startsWith('/api/media/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Ostali API pozivi — uvijek network, nikad cache (svjezi podaci)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Vite build izlaz (/assets/*.js, *.css) — ime fajla sadrzi hash sadrzaja
  // koji se NIKAD ne mijenja za dati URL, pa je cache-first ispravna i
  // najbrza strategija (instant ucitavanje pri ponovnoj posjeti/offline).
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // index.html, manifest.json, ikonice — network first, fallback cache.
  // Mora ostati svjeze da update-banner mehanizam ispravno detektuje novu
  // verziju (vidi UpdateBanner.tsx). cache:'no-cache' tjera browser da
  // revalidira kroz HTTP kes (ETag/304) umjesto da servira po heuristici -
  // bez toga je SW-ov fetch() mogao dobiti STARI index.html iz HTTP kesa
  // i korisnik bi vidio staru verziju do hard refresh-a.
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
  );
});
