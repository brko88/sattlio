if ('serviceWorker' in navigator) {
  // Kad nova verzija SW-a preuzme kontrolu (skipWaiting + clients.claim u sw.js),
  // ova kartica to sazna kroz 'controllerchange' - osvjezimo je da povucemo novi build,
  // bez toga korisnik ostaje na starom kesiranom kodu dok rucno ne obrise podatke sajta.
  let refreshingAfterUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingAfterUpdate) return;
    refreshingAfterUpdate = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch((err) => console.log('SW registration failed:', err));
  });
}
