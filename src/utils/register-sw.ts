'use client';

export function registerSpecificServiceWorker(swPath: string) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(swPath) // Use the provided path
        .then(registration => {
          console.log(`Service Worker ${swPath} registered: `, registration);
        })
        .catch(registrationError => {
          console.log(`Service Worker ${swPath} registration failed: `, registrationError);
        });
    });
  }
}
