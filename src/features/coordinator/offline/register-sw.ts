'use client';

import { logger } from '@/server/api/utils/logger';

/**
 * Register the coordinator service worker
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Only register in production or if explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';
  const forceEnable = process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

  if (!isProduction && !forceEnable) {
    logger.debug('Service worker registration skipped in development');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/coordinator-sw.js')
      .then(registration => {
        logger.info('Coordinator service worker registered', {
          scope: registration.scope
        });

        // Check for updates every hour
        setInterval(() => {
          registration.update().catch(error => {
            logger.error('Error updating service worker', { error });
          });
        }, 60 * 60 * 1000);
      })
      .catch(error => {
        logger.error('Error registering coordinator service worker', { error });
      });
  });

  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', event => {
    const { type } = event.data || {};

    if (type === 'SYNC_TRIGGERED') {
      logger.debug('Sync triggered by service worker');
      // You could dispatch an event or call a function here
    }
  });
}

/**
 * Unregister all service workers
 */
export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      const promises = registrations.map(registration => registration.unregister());
      return Promise.all(promises);
    })
    .then(results => {
      const allUnregistered = results.every(result => result === true);
      if (allUnregistered) {
        logger.info('All service workers unregistered');
      } else {
        logger.warn('Some service workers could not be unregistered');
      }
      return allUnregistered;
    })
    .catch(error => {
      logger.error('Error unregistering service workers', { error });
      return false;
    });
}
