if ('serviceWorker' in navigator) {
  // Osvjezavanje na novu verziju se sad radi preko UpdateBanner.tsx (korisnik
  // klikne "Osvježi") umjesto tihog/prisilnog reload-a - vidi sw.js za
  // SKIP_WAITING poruku i App.tsx za UpdateBanner komponentu.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch((err) => console.log('SW registration failed:', err));
  });
}
