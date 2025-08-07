// Service Worker for TimeCapsule CryptoVault
// Version: 1.0.1

const CACHE_NAME = 'timecapsule-vault-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Check for pending transactions in IndexedDB
    const pendingTransactions = await getPendingTransactions();
    
    for (const transaction of pendingTransactions) {
      try {
        // Attempt to send transaction
        await sendTransaction(transaction);
        // Remove from pending if successful
        await removePendingTransaction(transaction.id);
      } catch (error) {
        console.error('Background sync failed for transaction:', transaction.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingTransactions() {
  // Implementation would depend on your IndexedDB setup
  return [];
}

async function sendTransaction(transaction) {
  // Implementation would depend on your transaction sending logic
  return Promise.resolve();
}

async function removePendingTransaction(id) {
  // Implementation would depend on your IndexedDB setup
  return Promise.resolve();
} 